import { Box, Card, DropZone, Text } from "@shopify/polaris";
import { imgUploadDefault } from "app/constants";
import { useGalleryStore } from "app/store";
import { useRef } from "react";
import styles from "../../css/components/gallery-add.module.css";

export default function GalleryAdd() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setGallery } = useGalleryStore();

  return (
    <Card>
      <div className={styles["gallery-add"]}>
        <Box>
          <img
            className={styles["gallery-add__img"]}
            src={imgUploadDefault}
            alt=""
          />
        </Box>
        <Box>
          <Box paddingBlockStart={"300"}>
            <Text variant="headingLg" as="h1" alignment="center">
              Create you hots post image
            </Text>
          </Box>
          <div className={styles["gallery-add__dropzone"]}>
            <DropZone
              onDrop={(_, acceptedFiles) => {
                const selected = acceptedFiles[0];
                setGallery({ file: selected });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(selected);
                if (fileInputRef.current) {
                  fileInputRef.current.files = dataTransfer.files;
                }
              }}
            >
              <DropZone.FileUpload />
            </DropZone>
          </div>
        </Box>
      </div>
    </Card>
  );
}
