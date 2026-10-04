import crypto from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const TABLE_NAME = process.env.TABLE_NAME;
const DOCUMENT_BUCKET = process.env.DOCUMENT_BUCKET;
const ENABLE_SENSITIVE_UPLOADS = process.env.ENABLE_SENSITIVE_UPLOADS === "true";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true }
});
const s3 = new S3Client({});

const DIVISIONS = new Set(["process", "resource", "wellness", "va"]);
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function response(statusCode, body = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "pragma": "no-cache"
    },
    body: JSON.stringify(body)
  };
}

function claimsFrom(event) {
  return event?.requestContext?.authorizer?.jwt?.claims || {};
}

function groupsFrom(claims) {
  const raw = claims["cognito:groups"];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return String(raw)
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

function authContext(event) {
  const claims = claimsFrom(event);
  const sub = claims.sub;
  if (!sub) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  const groups = groupsFrom(claims);
  return {
    sub,
    email: claims.email || "",
    groups,
    isAdmin: groups.includes("admin"),
    isStaff: groups.includes("staff") || groups.includes("admin"),
    pk: `USER#${sub}`
  };
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    throw Object.assign(new Error("Invalid JSON"), { statusCode: 400 });
  }
}

function cleanText(value, max) {
  const s = String(value ?? "").trim();
  if (!s || s.length > max) {
    throw Object.assign(new Error("Invalid field"), { statusCode: 400 });
  }
  return s;
}

function cleanFilename(value) {
  const base = String(value ?? "").split(/[\\/]/).pop().trim();
  if (!base || base.length > 180) {
    throw Object.assign(new Error("Invalid filename"), { statusCode: 400 });
  }
  return base.replace(/[^a-zA-Z0-9._ -]/g, "_");
}

async function queryPrefix(pk, prefix, limit = 100) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": pk, ":prefix": prefix },
      ScanIndexForward: false,
      Limit: Math.min(limit, 100)
    })
  );
  return out.Items || [];
}

async function audit(ctx, eventType, objectType, objectId, extra = {}) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: ctx.pk,
        sk: `AUDIT#${now}#${id}`,
        type: "audit",
        actorSub: ctx.sub,
        eventType,
        objectType,
        objectId,
        createdAt: now,
        ...extra
      }
    })
  );
}

function stripKeys(item) {
  const { pk, sk, ...rest } = item;
  return rest;
}

async function handleGetMe(ctx) {
  return response(200, {
    user: {
      id: ctx.sub,
      email: ctx.email,
      groups: ctx.groups,
      role: ctx.isAdmin ? "admin" : ctx.isStaff ? "staff" : "client"
    },
    security: {
      sensitiveUploadsEnabled: ENABLE_SENSITIVE_UPLOADS,
      mfaRequiredByCognito: true
    }
  });
}

async function handleList(ctx, prefix) {
  const items = await queryPrefix(ctx.pk, prefix);
  return response(200, { items: items.map(stripKeys) });
}

async function handlePostMessage(ctx, event) {
  const body = parseBody(event);
  const division = cleanText(body.division, 32);
  if (!DIVISIONS.has(division)) {
    return response(400, { error: "Invalid service area." });
  }
  const message = cleanText(body.message, 5000);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: ctx.pk,
        sk: `MSG#${now}#${id}`,
        type: "message",
        id,
        division,
        message,
        direction: "client_to_binya",
        createdAt: now
      }
    })
  );

  await audit(ctx, "message_created", "message", id, { division });
  return response(201, { id, createdAt: now });
}

async function handleCreateUpload(ctx, event) {
  if (!ENABLE_SENSITIVE_UPLOADS) {
    return response(423, {
      error: "Sensitive uploads are locked until the AWS HIPAA go-live checklist is complete."
    });
  }

  const body = parseBody(event);
  const filename = cleanFilename(body.filename);
  const contentType = cleanText(body.contentType, 120);
  const division = cleanText(body.division, 32);
  const size = Number(body.size);

  if (!DIVISIONS.has(division)) {
    return response(400, { error: "Invalid service area." });
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    return response(400, { error: "Unsupported file type." });
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_BYTES) {
    return response(400, { error: "File must be 25 MB or smaller." });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const objectKey = `users/${ctx.sub}/${id}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: DOCUMENT_BUCKET,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: size,
    ServerSideEncryption: "AES256",
    Metadata: {
      owner: ctx.sub,
      division,
      documentid: id
    }
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: ctx.pk,
        sk: `DOC#${now}#${id}`,
        type: "document",
        id,
        division,
        filename,
        contentType,
        size,
        objectKey,
        status: "upload_url_issued",
        createdAt: now
      }
    })
  );

  await audit(ctx, "document_upload_url_issued", "document", id, { division });
  return response(201, {
    id,
    uploadUrl,
    requiredHeaders: {
      "content-type": contentType,
      "x-amz-server-side-encryption": "AES256"
    },
    expiresInSeconds: 300
  });
}

async function findDocument(ctx, id) {
  const docs = await queryPrefix(ctx.pk, "DOC#", 100);
  return docs.find(d => d.id === id) || null;
}

async function handleDownloadUrl(ctx, id) {
  if (!id) return response(400, { error: "Missing document id." });

  const doc = await findDocument(ctx, id);
  if (!doc) return response(404, { error: "Document not found." });

  const command = new GetObjectCommand({
    Bucket: DOCUMENT_BUCKET,
    Key: doc.objectKey,
    ResponseContentDisposition: `attachment; filename="${String(doc.filename).replace(/"/g, "")}"`
  });
  const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 120 });

  await audit(ctx, "document_download_url_issued", "document", doc.id, {
    division: doc.division
  });

  return response(200, { downloadUrl, expiresInSeconds: 120 });
}

export async function handler(event) {
  try {
    const ctx = authContext(event);
    const method = event?.requestContext?.http?.method || "";
    const path = event?.rawPath || "/";

    if (method === "GET" && path === "/me") return handleGetMe(ctx);
    if (method === "GET" && path === "/tasks") return handleList(ctx, "TASK#");
    if (method === "GET" && path === "/messages") return handleList(ctx, "MSG#");
    if (method === "POST" && path === "/messages") return handlePostMessage(ctx, event);
    if (method === "GET" && path === "/appointments") return handleList(ctx, "APPT#");
    if (method === "GET" && path === "/documents") return handleList(ctx, "DOC#");
    if (method === "POST" && path === "/documents/upload-url") return handleCreateUpload(ctx, event);

    const downloadMatch = path.match(/^\/documents\/([^/]+)\/download-url$/);
    if (method === "GET" && downloadMatch) {
      return handleDownloadUrl(ctx, decodeURIComponent(downloadMatch[1]));
    }

    return response(404, { error: "Not found." });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;

    // Do not log request bodies, tokens, filenames, messages, or other potential PHI.
    console.error(JSON.stringify({
      level: "error",
      statusCode,
      name: error?.name || "Error",
      message: statusCode >= 500 ? "Unhandled portal API error" : String(error?.message || "Request error")
    }));

    return response(statusCode, {
      error: statusCode >= 500 ? "The North Star could not complete that request." : String(error.message)
    });
  }
}
