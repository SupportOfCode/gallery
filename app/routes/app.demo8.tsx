import {
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { DropZone } from "@shopify/polaris";
import ImageKit from "imagekit";
import { useRef, useState, useEffect } from "react";

const IkUrlEndpoint = process.env.IK_URL_ENDPOINT;
const IkPublicKey = process.env.IK_PUBLIC_KEY;
const IkPrivateKey = process.env.IK_PRIVATE_KEY;

// ✅ Setup ImageKit SDK
const imagekit = new ImageKit({
  publicKey: IkPublicKey as string,
  privateKey: IkPrivateKey as string,
  urlEndpoint: IkUrlEndpoint as string,
});

// ✅ Handle upload inside action
export async function action({ request }: ActionFunctionArgs) {
  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 10_000_000, // 10MB
  });

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler,
  );
  const file = formData.get("file");
  console.log("File demo 8", file);

  if (!file || typeof file === "string") {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    const result = await imagekit.upload({
      file: Buffer.from(await file.arrayBuffer()),
      fileName: "upload.jpg",
      folder: "/gallery",
    });

    return Response.json({ url: result.url });
  } catch (err) {
    console.error("ImageKit Upload Error", err);
    return Response.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

// ✅ React UI using useFetcher
export default function AddImagePage() {
  const fetcher = useFetcher();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadResult = fetcher.data as
    | { url?: string; error?: string }
    | undefined;

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <DropZone
        onDrop={(_, acceptedFiles) => {
          const selected = acceptedFiles[0];
          setFile(selected);

          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(selected);
          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
          }
        }}
      >
        <DropZone.FileUpload />
      </DropZone>

      <input type="file" name="file" ref={fileInputRef} hidden />

      {file && (
        <div>
          <p className="text-sm text-gray-500">Preview:</p>
          <div>
            <button
              type="button"
              className="mt-2 bg-red-500 text-white px-3 py-1 rounded"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Huỷ ảnh
            </button>
          </div>
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="w-64 mt-2 border rounded"
          />
        </div>
      )}

      {!uploadResult?.url && file && (
        <button
          type="button"
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleUpload}
          disabled={fetcher.state === "submitting"}
        >
          {fetcher.state === "submitting" ? "Đang tải..." : "Tải lên"}
        </button>
      )}

      {uploadResult?.url && (
        <div className="mt-6">
          <p className="text-green-600">✅ Ảnh đã được tải lên!</p>
          <a
            href={uploadResult.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Xem ảnh
          </a>
        </div>
      )}

      {uploadResult?.error && (
        <p className="text-red-500">❌ {uploadResult.error}</p>
      )}
    </div>
  );
}
