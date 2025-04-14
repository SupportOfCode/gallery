import {
  ActionFunction,
  LoaderFunction,
  redirect,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { SaveBar } from "@shopify/app-bridge-react";
import {
  Box,
  Button,
  Card,
  DropZone,
  Grid,
  Page,
  RangeSlider,
  Scrollable,
  Text,
  TextField,
} from "@shopify/polaris";
import { validImageTypes } from "app/constants";
import { IHotspot } from "app/model/Gallery.model.server";
import { useGalleryStore } from "app/store";
import {
  addGallery,
  deleteGalleryById,
  editGalleryById,
  getGalleryById,
} from "app/utils/galleries.server";
import ImageKit from "imagekit";
import React, { useState, useRef, useEffect } from "react";

const IkUrlEndpoint = process.env.IK_URL_ENDPOINT;
const IkPublicKey = process.env.IK_PUBLIC_KEY;
const IkPrivateKey = process.env.IK_PRIVATE_KEY;
const imagekit = new ImageKit({
  publicKey: IkPublicKey as string,
  privateKey: IkPrivateKey as string,
  urlEndpoint: IkUrlEndpoint as string,
});

export const loader: LoaderFunction = async ({ request, params }) => {
  try {
    if (params.id === "new")
      return {
        page: "new",
        data: {},
      };
    return {
      page: "edit",
      data: await getGalleryById(params.id as string),
    };
  } catch (error) {
    console.error("Loader Error:", error);
    throw new Response("Internal Server Error");
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  try {
    if (request.method === "POST") {
      // handle save image
      const uploadHandler = unstable_createMemoryUploadHandler({
        maxPartSize: 10_000_000,
      });

      const formData = await unstable_parseMultipartFormData(
        request,
        uploadHandler,
      );
      const file = formData.get("file");

      if (!file || typeof file === "string") {
        return Response.json({ error: "No file uploaded" }, { status: 400 });
      }
      const result = await imagekit.upload({
        file: Buffer.from(await file.arrayBuffer()),
        fileName: "upload.jpg",
        folder: "/gallery",
      });
      const data = JSON.parse(formData.get("data") as string);

      await addGallery({
        title: data.title,
        hotspots: data.hotspots,
        imageUrl: result.url,
        idImage: result.fileId,
      });
    }

    if (request.method === "DELETE") {
      const formData = await request.formData();
      const idImg = formData.get("idImg");
      console.log("idImg", idImg);
      const auth = Buffer.from(`${IkPrivateKey}:`).toString("base64");
      await fetch(`https://api.imagekit.io/v1/files/${idImg}`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      });

      await deleteGalleryById(params.id as string);
    }

    return redirect("/app");
  } catch (err) {
    console.error("ImageKit Upload Error", err);
    return Response.json({ error: "Failed to upload image" }, { status: 500 });
  }
};

export default function Gallery() {
  const gallery = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { loading, editLoading } = useGalleryStore();
  const [hotspots, setHotspots] = useState<Point[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [originalHotspot, setOriginalHotspot] = useState<Point | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [tilte, setTitle] = useState<string>("");
  const [error, setError] = useState({
    title: "",
  });
  const [acceptNavigate, setAcceptNavigate] = useState(true);
  const [file, setFile] = useState<File | null>();
  const draggingIndex = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddHotspot = (newHotspot: Point) => {
    setHotspots([newHotspot, ...hotspots]);
    setEditingIndex(0);
    setOriginalHotspot(null);
    setViewIndex(null);
  };

  const handleClickAddHotspot = (newHotspot: Point) => {
    if (!hotspots.some((hot) => hot.saved === false))
      handleAddHotspot(newHotspot);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (editingIndex !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
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
    };
    setHotspots(updated);
    setEditingIndex(null);
    setOriginalHotspot(null);
  };

  const handlePick = async (index: number) => {
    try {
      const selected = await shopify.resourcePicker({ type: "product" });
      const products = selected as ProductResource[];
      const updated = [...hotspots];
      updated[index] = {
        ...updated[index],
        id: products?.[0]?.id,
        label: products?.[0]?.title ?? "New Hotspot",
        img: products?.[0]?.images?.[0]?.originalSrc ?? "",
      };
      setHotspots(updated);
    } catch (error) {
      console.log("Người dùng đã hủy chọn");
    }
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
  };

  const handleEdit = (index: number) => {
    setOriginalHotspot({ ...hotspots[index] });
    setEditingIndex(index);
    setViewIndex(null);
  };

  const handleDelete = (index: number) => {
    const updated = hotspots.filter((_, i) => i !== index);
    editLoading({ loadingDeleteGallery: true });
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
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
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

  const handleUpload = () => {
    if (!file) return;
    if (!tilte.trim()) {
      setError({ title: "Title is required" });
      return;
    }
    const formData = new FormData();
    editLoading({ loadingSave: true });
    formData.append("file", file);
    const data = {
      title: tilte,
      hotspots: hotspots.map((h) => ({
        x: h.x,
        y: h.y,
        title: h.label,
        img: h.img,
        productId: h.id,
      })),
    };
    formData.append("data", JSON.stringify(data));
    fetcher.submit(formData, {
      method: gallery.page === "new" ? "post" : "put",
      encType: "multipart/form-data",
    });
    shopify.loading(true);
  };

  const handleDeleteGallery = () => {
    const formData = new FormData();
    formData.append("idImg", gallery.data.idImage as string);
    fetcher.submit(formData, { method: "delete" });
    shopify.loading(true);
    editLoading({ loadingDeleteGallery: true });
  };

  const argOfPage = {
    title: "Gallery Page",
    backAction: {
      onAction: () => {
        if (acceptNavigate) navigate("/app");
      },
    },
  };

  useEffect(() => {
    if (navigation.state === "loading") {
      shopify.loading(true);
    } else {
      shopify.loading(false);
    }
  }, [navigation.state]);

  useEffect(() => {
    if (gallery.page === "edit") {
      const hotspots = gallery.data.hotspots.map((h: IHotspot) => ({
        id: h.productId,
        x: h.x,
        y: h.y,
        saved: true,
        label: h.title,
        img: h.img,
      }));
      setHotspots(hotspots);
      setTitle(gallery.page === "edit" ? gallery.data.title : "");
    }
  }, []);

  // component
  const GalleryPage = (
    <>
      <Grid>
        <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
          <Box paddingBlockEnd={"500"}>
            <Button
              variant="primary"
              onClick={() =>
                handleClickAddHotspot({
                  x: 50,
                  y: 50,
                  saved: false,
                  label: "",
                  img: "",
                  id: "",
                })
              }
            >
              Add hotspot
            </Button>
            <span style={{ marginLeft: "7px" }} />
            <Button variant="secondary" onClick={() => setFile(null)}>
              UnCheck Image
            </Button>

            <Box paddingBlock={"200"} />
            <TextField
              label=""
              placeholder="Gallery Title"
              autoComplete="off"
              value={tilte}
              error={error.title}
              onChange={(value) => {
                setTitle(value);
                setError({ title: "" });
                shopify.saveBar.show("save-bar-custom");
              }}
            />
          </Box>
          <Scrollable style={{ height: "80vh" }}>
            {hotspots.map((point, index) => (
              <>
                <Card key={index}>
                  {editingIndex === index ? (
                    <>
                      <Button onClick={() => handlePick(index)}>
                        Choose Product
                      </Button>
                      <Box minHeight="12px" />
                      <RangeSlider
                        label={`X axis ${Math.round(point.x)}%`}
                        min={0}
                        max={100}
                        value={point.x}
                        onChange={(value) =>
                          handlePositionChange(index, "x", Number(value))
                        }
                      />
                      <Box minHeight="12px" />
                      <RangeSlider
                        label={`Y axis ${Math.round(point.y)}%`}
                        min={0}
                        max={100}
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
                        <Text as="span">X: {Math.round(point.x)}%</Text>
                        <Text as="span"> Y: {Math.round(point.y)}%</Text>
                      </Box>
                      <Grid>
                        <Grid.Cell
                          columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                        >
                          <Button
                            onClick={() => handleEdit(index)}
                            variant="primary"
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
                gallery.page === "edit"
                  ? gallery.data.imageUrl
                  : validImageTypes.includes(
                        (file && (file.type as string)) ?? "",
                      )
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
                  top: `${point.y}%`,
                  left: `${point.x}%`,
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
                        src={`${point.img ?? "https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/04/anh-con-gai-1-1.jpg"}`}
                        alt=""
                      />
                    </div>
                    <p>{point.label}</p>
                    <a
                      target="_blank"
                      href={`https://admin.shopify.com/store/the-most-expensive-store-on-the-world/products/${point.id.split("/").pop() ?? ""}`}
                    >
                      see more
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Grid.Cell>
      </Grid>
    </>
  );

  const CreateGalleryPage = (
    <>
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
    </>
  );

  return (
    <Page
      title="Gallery Page"
      backAction={argOfPage.backAction}
      secondaryActions={
        gallery.page === "edit" ? (
          <Button
            tone="critical"
            onClick={handleDeleteGallery}
            loading={loading.loadingDeleteGallery}
          >
            Delete Gallery
          </Button>
        ) : (
          []
        )
      }
    >
      {file || gallery.page === "edit" ? GalleryPage : CreateGalleryPage}
      <SaveBar
        id="save-bar-custom"
        onShow={() => setAcceptNavigate(false)}
        onHide={() => setAcceptNavigate(true)}
      >
        <button
          variant="primary"
          onClick={() => {
            handleUpload();
            shopify.saveBar.hide("save-bar-custom");
          }}
        />
        <button
          onClick={() => {
            shopify.saveBar.hide("save-bar-custom");
            // setProduct(productOld.data);
          }}
        />
      </SaveBar>
    </Page>
  );
}
