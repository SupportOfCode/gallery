import { DropZone, Thumbnail, Text } from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";
import { validImageTypes } from "app/constants";
import { useState } from "react";

export default function DropZoneExample() {
  const [file, setFile] = useState<File | null>();

  const handleDropZoneDrop = (acceptedFiles: File[]) =>
    setFile(acceptedFiles[0]);

  const uploadedFiles = file && (
    <Thumbnail
      size="small"
      alt={file.name}
      source={
        validImageTypes.includes(file.type)
          ? window.URL.createObjectURL(file)
          : NoteIcon
      }
    />
  );

  return (
    <div>
      {file ? (
        <>
          {uploadedFiles}
          <button onClick={() => setFile(null)}>cancel</button>
        </>
      ) : (
        <DropZone onDrop={handleDropZoneDrop}>
          <DropZone.FileUpload />
        </DropZone>
      )}
    </div>
  );
}
