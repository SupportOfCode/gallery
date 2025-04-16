import ImageKit from "imagekit";
import type { UploadResponse } from "imagekit/dist/libs/interfaces";

export const IkUrlEndpoint = process.env.IK_URL_ENDPOINT;
export const IkPublicKey = process.env.IK_PUBLIC_KEY;
export const IkPrivateKey = process.env.IK_PRIVATE_KEY;
export const imagekit = new ImageKit({
  publicKey: IkPublicKey as string,
  privateKey: IkPrivateKey as string,
  urlEndpoint: IkUrlEndpoint as string,
});

export async function UploadImageToImageKit(
  file: File,
): Promise<UploadResponse> {
  if (!file || typeof file === "string") {
    throw new Error("No file uploaded");
  }
  const result = await imagekit.upload({
    file: Buffer.from(await file.arrayBuffer()),
    fileName: "upload.jpg",
    folder: "/gallery",
  });
  return result;
}

export async function DeleteImageFromImageKit(fileId: string) {
  const auth = Buffer.from(`${IkPrivateKey}:`).toString("base64");
  await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });
}
