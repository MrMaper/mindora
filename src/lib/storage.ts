import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let s3: S3Client | null = null;

function getClient(): S3Client | null {
  if (!process.env.S3_ENDPOINT || !process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY) {
    return null;
  }
  if (!s3) {
    s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return s3;
}

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const client = getClient();
  if (!client) {
    console.log("[storage:dev] S3 not configured — avatar upload skipped.");
    return null;
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const key = `avatars/${userId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read",
    })
  );

  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
}

export async function uploadAttachment(file: File, taskId: string): Promise<string | null> {
  const client = getClient();
  if (!client) {
    console.log("[storage:dev] S3 not configured — attachment upload skipped.");
    return null;
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `attachments/${taskId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
      ACL: "public-read",
    })
  );

  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
}

export async function uploadDocSourceFile(
  file: File,
  sourceId: string,
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    console.log("[storage:dev] S3 not configured — source file upload skipped.");
    return null;
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `doc-sources/${sourceId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/pdf",
      ACL: "public-read",
    }),
  );

  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
}
