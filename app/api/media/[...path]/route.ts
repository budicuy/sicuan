import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type NextRequest, NextResponse } from "next/server";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID ?? ""}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!path || path.length === 0) {
    return new NextResponse("Path missing", { status: 400 });
  }

  const key = path.map(decodeURIComponent).join("/");
  const rangeHeader = request.headers.get("range");

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME ?? "",
      Key: key,
      Range: rangeHeader ?? undefined,
    });

    const response = await r2Client.send(command);

    const headers = new Headers();
    if (response.ContentType) {
      headers.set("Content-Type", response.ContentType);
    }
    if (response.ContentLength !== undefined) {
      headers.set("Content-Length", response.ContentLength.toString());
    }
    if (response.ContentRange) {
      headers.set("Content-Range", response.ContentRange);
    }
    if (response.ETag) {
      headers.set("ETag", response.ETag);
    }
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    const status = rangeHeader && response.ContentRange ? 206 : 200;
    const body = response.Body
      ? (
          response.Body as { transformToWebStream: () => ReadableStream }
        ).transformToWebStream()
      : null;

    return new NextResponse(body, {
      status,
      headers,
    });
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err?.name === "NoSuchKey") {
      return new NextResponse("File tidak ditemukan di storage", {
        status: 404,
      });
    }
    console.error("Error streaming media from R2 proxy:", error);
    return new NextResponse("Gagal memuat media", { status: 500 });
  }
}
