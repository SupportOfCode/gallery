import {
  Box,
  Button,
  Card,
  DropZone,
  Page,
  Text,
  Thumbnail,
} from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";
import { validImageTypes } from "app/constants";
import { useState } from "react";

export default function Demo() {
  const [file, setFile] = useState<File | null>();

  const handleDropZoneDrop = (acceptedFiles: File[]) =>
    setFile(acceptedFiles[0]);

  return (
    <Page title="Hotspot Images">
      {file ? (
        <>
          <Thumbnail
            size="small"
            alt={file.name}
            source={
              validImageTypes.includes(file.type)
                ? window.URL.createObjectURL(file)
                : NoteIcon
            }
          />
          <Button
            tone="critical"
            variant="secondary"
            onClick={() => setFile(null)}
          >
            Cancel
          </Button>
        </>
      ) : (
        <Card>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box>
              <img
                src="https://s3-alpha-sig.figma.com/plugins/1238846170932800754/55109/d55bc0b1-cef0-4047-a8f9-8ac542f43fe1-cover?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=DyuuhIjIRS~UBk0IPb6iMgUhcbW9eWABtJRhwOsmMhTnBaswHwd2EcENZh4j-7Su-i5au5Y5Uu0VcHgjYkIaN6YCfCD8frw1BrqKhbbMNXGBBTBBKdzO1GUSvG-cA8rXATufuOu6cOJAcSZgsQWU9ounul-SZ758bvmbpkmUitCMyMgOEo5h51m3~OqUcOmdGvm81Bk4Fsi8-etdgsT1O1t4-A2l3JaDNeduMFOF63s3r0h13vlVk76EV8YCRBK1YK8j~31DGF~a8zx0HbIFFv04JZs0M~5aWvZIjyMmK73h-9imDuDfrkXm8KMnMCZ7RLbXuai-vYwaMvsdjl2wzw__"
                alt=""
                style={{
                  width: "300px",
                  height: "300px",
                  objectFit: "cover",
                  borderRadius: "50%",
                  margin: "0 auto",
                }}
              />
            </Box>
            <Box>
              <Box paddingBlockStart={"300"}>
                <Text variant="headingLg" as="h1" alignment="center">
                  Create you hots post image
                </Text>
              </Box>
              <div
                style={{
                  width: 40,
                  height: 40,
                  margin: "12px auto",
                }}
              >
                <DropZone onDrop={handleDropZoneDrop}>
                  <DropZone.FileUpload />
                </DropZone>
              </div>
            </Box>
          </div>
        </Card>
      )}
    </Page>
  );
}
