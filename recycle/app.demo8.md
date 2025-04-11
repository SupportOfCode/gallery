import {
  ActionFunction,
  LoaderFunction,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  DropZone,
  Grid,
  Icon,
  Page,
  RangeSlider,
  Scrollable,
  Text,
  TextField,
} from "@shopify/polaris";
import { NoteIcon, SearchIcon } from "@shopify/polaris-icons";
import { validImageTypes } from "app/constants";
import { useDebounce } from "app/hook/useDebounce";
import { useUpdateParams } from "app/hook/useUpdateParams";
import { authenticate } from "app/shopify.server";
import { useGalleryStore } from "app/store";
import {
  addHotspotToGallery,
  getAllHotspots,
} from "app/utils/galleries.server";
import ImageKit from "imagekit";
import React, { useState, useRef, useEffect } from "react";

const IkUrlEndpoint = process.env.IK_URL_ENDPOINT;
const IkPublicKey = process.env.IK_PUBLIC_KEY;
const IkPrivateKey = process.env.IK_PRIVATE_KEY;
// ✅ Setup ImageKit SDK
const imagekit = new ImageKit({
  publicKey: IkPublicKey as string,
  privateKey: IkPrivateKey as string,
  urlEndpoint: IkUrlEndpoint as string,
});

export const loader: LoaderFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  let query = "";
  if (!!search?.trim()) query = `query:"title: *${search}*"`;
  try {
    const response = await admin.graphql(`#graphql 
      query {
  products(first: 3 reverse: true ${query}) {
    edges {
      node {
        id
        title
        media(first: 1) {
         edges {
          node {
            preview {
              image {
                url
              }
            }
          }
        }
        }
      }
    }
  }
}

      `);
    const data = await response.json();
    const results = data?.data?.products?.edges?.map((d: any) => ({
      value: d?.node?.id,
      label: d?.node?.title,
      img: d?.node?.media?.edges[0]?.node?.preview?.image?.url,
    }));
    const options = data?.data?.products?.edges?.map((d: any) => ({
      value: d?.node?.id,
      label: d?.node?.title,
    }));
    const listHotpost = await getAllHotspots("67ef56050993390326abd531");
    return { results, options, listHotpost };
  } catch (error) {
    console.error("Loader Error:", error);
    throw new Response("Internal Server Error");
  }
};

export const action: ActionFunction = async ({ request }) => {
  // uploadImage (request)
  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 10_000_000, // 10MB
  });

  const formDataImage = await unstable_parseMultipartFormData(
    request,
    uploadHandler,
  );
  const file = formDataImage.get("file");

  if (!file || typeof file === "string") {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    // handle save image
    const result = await imagekit.upload({
      file: Buffer.from(await file.arrayBuffer()),
      fileName: "upload.jpg",
      folder: "/gallery",
    });

    //
    const formData = await request.formData();
    const data = JSON.parse(formData.get("data") as string);
    if (request.method === "POST")
      await addHotspotToGallery({
        galleryId: "67ef56050993390326abd531",
        hotspot: data,
      });

    return Response.json({ url: result.url });
  } catch (err) {
    console.error("ImageKit Upload Error", err);
    return Response.json({ error: "Failed to upload image" }, { status: 500 });
  }
};

export default function AppDemo() {
  const gallerys = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [hotspots, setHotspots] = useState<Point[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [originalHotspot, setOriginalHotspot] = useState<Point | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const draggingIndex = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { axis, editAxis, resetAxis } = useGalleryStore();
  // const [currentHotspotValue, setCurrentHotspotValue] = useState({
  //   id: "",
  //   title: "",
  //   img: "",
  //   axis: {
  //     x: 0,
  //     y: 0,
  //   },
  // });

  useEffect(() => {
    resetAxis();
  }, []);

  const handleAddHotspot = (newHotspot: Point) => {
    setHotspots([newHotspot, ...hotspots]);
    setEditingIndex(0);
    setInputValue("");
    setOriginalHotspot(null);
    setViewIndex(null);
    editAxis({ x: 10, y: 10 });
  };

  const handleClickAddHotspot = (newHotspot: Point) => {
    if (!hotspots.some((hot) => hot.saved === false))
      handleAddHotspot(newHotspot);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (editingIndex !== null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newHotspot: Point = {
      x,
      y,
      saved: false,
      label: "",
      img: "",
      id: "",
    };
    handleAddHotspot(newHotspot);
  };

  const handleSave = (index: number) => {
    const updated = [...hotspots];
    updated[index] = {
      ...updated[index],
      saved: true,
      label: inputValue || `New Hotspot `,
    };
    setHotspots(updated);
    setEditingIndex(null);
    setOriginalHotspot(null);
    setInputValue("");
  };

  const handleCancel = () => {
    if (editingIndex === null) return;

    if (originalHotspot) {
      const updated = [...hotspots];
      updated[editingIndex] = originalHotspot;
      setHotspots(updated);
    } else {
      const updated = [...hotspots];
      updated.splice(editingIndex, 1);
      setHotspots(updated);
    }

    setEditingIndex(null);
    setOriginalHotspot(null);
    setInputValue("");
  };

  const handleEdit = (index: number) => {
    setOriginalHotspot({ ...hotspots[index] });
    setEditingIndex(index);
    // setInputValue(hotspots[index].label);
    setViewIndex(null);
  };

  const handleDelete = (index: number) => {
    const updated = hotspots.filter((_, i) => i !== index);
    setHotspots(updated);
    setEditingIndex(null);
    setOriginalHotspot(null);
    setViewIndex(null);
  };

  const handlePositionChange = (
    index: number,
    axis: "x" | "y",
    value: number,
  ) => {
    const updated = [...hotspots];
    updated[index] = { ...updated[index], [axis]: value };
    setHotspots(updated);
  };

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    if (editingIndex === index) {
      draggingIndex.current = index;
    }
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingIndex.current === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const updated = [...hotspots];
    updated[draggingIndex.current] = {
      ...updated[draggingIndex.current],
      x,
      y,
    };
    setHotspots(updated);
  };

  const handleMouseUp = () => {
    draggingIndex.current = null;
  };

  const toggleViewPopup = (index: number) => {
    setViewIndex(viewIndex === index ? null : index);
  };

  const argOfPage = {
    title: "Gallery Page",
    backAction: {
      onAction: () => {
        navigate("/app");
      },
    },
  };

  // auto complete

  const debouncedSearch = useDebounce(inputValue);
  const updateParam = useUpdateParams();

  useEffect(() => {
    updateParam("search", debouncedSearch.trim());
  }, [debouncedSearch]);

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  console.log("selectedOptions", selectedOptions[0].split("/").pop());
  // const getImageByGid = (gid: string) => {
  //   const found = gallerys?.results?.find((p: any) => p.value === gid);
  //   return found?.img || "";
  // };

  // useEffect(() => {
  //   setCurrentHotspotValue((prev) => ({
  //     ...prev,
  //     id: selectedOptions[0],
  //     title: inputValue,
  //     img: getImageByGid(selectedOptions[0]),
  //     axis: {
  //       x: hotspots[0] ? hotspots[0].x : 0,
  //       y: hotspots[0] ? hotspots[0].y : 0,
  //     },
  //   }));
  // }, [hotspots]);

  const updateSelection = (selected: string[]) => {
    const selectedValue = selected.map((selectedItem) => {
      const matchedOption = gallerys.options.find(
        (option: { value: string; label: string }) => {
          return option.value.match(selectedItem);
        },
      );
      return matchedOption && matchedOption.label;
    });
    setSelectedOptions(selected);
    setInputValue(selectedValue[0] || "");
  };

  const textField = (
    <Autocomplete.TextField
      onChange={(value) => setInputValue(value)}
      label="Tags"
      value={inputValue}
      prefix={<Icon source={SearchIcon} tone="base" />}
      placeholder="Search"
      autoComplete="off"
    />
  );

  ///////////////////////
  const [file, setFile] = useState<File | null>();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadResult = fetcher.data as
    | { url?: string; error?: string }
    | undefined;

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    //
    // const formData = new FormData();
    // const data = {
    //   id: currentHotspotValue.id,
    //   title: currentHotspotValue.title,
    //   img: currentHotspotValue.img,
    //   x: currentHotspotValue.axis.x,
    //   y: currentHotspotValue.axis.y,
    // };
    // formData.append("data", JSON.stringify(data));
    // fetcher.submit(formData, { method: "post" });

    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  // component
  const GalleryPage = (
    <Page
      title="Gallery Page"
      backAction={argOfPage.backAction}
      secondaryActions={
        <Button
          tone="critical"
          variant="secondary"
          onClick={() => setFile(null)}
        >
          Cancel
        </Button>
      }
    >
      <Grid>
        <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
          <Box paddingBlockEnd={"500"}>
            <Button
              variant="primary"
              onClick={() =>
                handleClickAddHotspot({
                  x: axis.x,
                  y: axis.y,
                  saved: false,
                  label: "",
                  img: "",
                  id: "",
                })
              }
            >
              Add hotspot
            </Button>
            <Box paddingBlock={"200"} />
            <TextField
              label=""
              placeholder="Gallery Title"
              autoComplete="off"
            />
          </Box>
          <Scrollable style={{ height: "80vh" }}>
            {hotspots.map((point, index) => (
              <>
                <Card key={index}>
                  {editingIndex === index ? (
                    <>
                      <Autocomplete
                        options={gallerys.options}
                        selected={selectedOptions}
                        onSelect={updateSelection}
                        textField={textField}
                      />
                      <Box minHeight="12px" />
                      <RangeSlider
                        label={`X axis ${point.x}`}
                        min={0}
                        max={834}
                        value={point.x}
                        onChange={(value) =>
                          handlePositionChange(index, "x", Number(value))
                        }
                      />
                      <Box minHeight="12px" />
                      <RangeSlider
                        label={`X axis ${point.y}`}
                        min={0}
                        max={641}
                        value={point.y}
                        onChange={(value) =>
                          handlePositionChange(index, "y", Number(value))
                        }
                      />
                      <Box minHeight="12px" />
                      <Grid>
                        <Grid.Cell
                          columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                        >
                          <Button
                            onClick={() => handleSave(index)}
                            tone="success"
                            variant="primary"
                          >
                            Save
                          </Button>
                        </Grid.Cell>
                        <Grid.Cell
                          columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                        >
                          <Button
                            onClick={handleCancel}
                            variant="secondary"
                            tone="critical"
                          >
                            Cancel
                          </Button>
                        </Grid.Cell>
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Text as="p">
                        {point.label || `Hotspot tại vị trí thứ ${index + 1}`}
                      </Text>
                      <Box minHeight="6px" />
                      <Box minHeight="30px">
                        <Text as="span">X: {Math.round(point.x)} </Text>
                        <Text as="span"> Y: {Math.round(point.y)}</Text>
                      </Box>
                      <Grid>
                        <Grid.Cell
                          columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                        >
                          <Button
                            onClick={() => handleEdit(index)}
                            tone="success"
                            variant="secondary"
                          >
                            Sửa
                          </Button>
                        </Grid.Cell>
                        <Grid.Cell
                          columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                        >
                          <Button
                            onClick={() => handleDelete(index)}
                            tone="critical"
                            variant="secondary"
                          >
                            Xóa
                          </Button>
                        </Grid.Cell>
                      </Grid>
                    </>
                  )}
                </Card>
                <Box minHeight="12px" />
              </>
            ))}
          </Scrollable>
        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 9, xl: 9 }}>
          <div
            ref={containerRef}
            style={{
              position: "relative",
              display: "inline-block",
              overflow: "hidden",
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img
              src={
                validImageTypes.includes((file && (file.type as string)) ?? "")
                  ? window.URL.createObjectURL(file as File)
                  : "https://thumbs.dreamstime.com/b/not-valid-red-stamp-text-white-48506534.jpg"
              }
              alt="Demo"
              onClick={handleImageClick}
              style={{ width: "50vw", maxHeight: "80vh", objectFit: "cover" }}
            />
            {hotspots.map((point, index) => (
              <div
                key={index}
                onMouseDown={handleMouseDown(index)}
                onClick={() => point.saved && toggleViewPopup(index)}
                style={{
                  position: "absolute",
                  top: point.y,
                  left: point.x,
                  width: 20,
                  height: 20,
                  backgroundColor:
                    editingIndex === index
                      ? "#f43f5e"
                      : point.saved
                        ? "#111827"
                        : "#9ca3af",
                  borderRadius: "9999px",
                  transform: "translate(-50%, -50%)",
                  cursor: point.saved ? "pointer" : "move",
                  userSelect: "none",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                  transition: "background-color 0.3s ease",
                  border: "2px solid white",
                }}
              >
                {viewIndex === index && point.saved && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      textAlign: "center",
                      position: "absolute",
                      bottom: "calc(100% + 10px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#ffffff",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#1f2937",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                      border: "1px solid #b2b3b5",
                      whiteSpace: "nowrap",
                      zIndex: 999,
                      transition: "opacity 0.3s ease",
                      opacity: 1,
                    }}
                  >
                    <div>
                      <img
                        style={{
                          width: "200px",
                          height: "100px",
                          objectFit: "cover",
                        }}
                        src="https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/04/anh-con-gai-1-1.jpg"
                        alt=""
                      />
                    </div>
                    <p>{point.label}</p>
                    <Button url="/app">see more</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Grid.Cell>
      </Grid>
    </Page>
  );

  const CreateGalleryPage = (
    <Page title="Create Gallery" backAction={argOfPage.backAction}>
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
            </div>
          </Box>
        </div>
      </Card>
    </Page>
  );

  return <>{file ? GalleryPage : CreateGalleryPage}</>;
}
