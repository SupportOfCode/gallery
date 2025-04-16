import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { IHotspot } from "app/model/Gallery.model.server";
import {
  redirect,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import {
  addGallery,
  deleteGalleryById,
  editGalleryById,
  getGalleryById,
} from "app/utils/galleries.server";
import {
  DeleteImageFromImageKit,
  UploadImageToImageKit,
} from "app/utils/imagekit.server";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
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
import {
  dataOfGalleryInit,
  imgHotspotDefault,
  imgInvalid,
  urlProduct,
  validImageTypes,
} from "app/constants";
import { ModalCustom } from "app/components/ui/Modal";
import { PopupPortal } from "app/components/ui/PopupPortal";
import styles from "../css/components/gallery.module.css";
import GalleryUpdate from "app/components/features/GalleryUpdate";

export const loader: LoaderFunction = async ({ params }) => {
  try {
    if (params.id === "new")
      return {
        page: "new",
        data: dataOfGalleryInit,
      };
    return {
      page: "edit",
      data: await getGalleryById(params.id as string),
    };
  } catch (error) {
    console.error("Loader Error:", error);
    throw new Error("Internal Server Error");
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  try {
    if (request.method === "POST" || request.method === "PUT") {
      // handle save image
      const uploadHandler = unstable_createMemoryUploadHandler({
        maxPartSize: 10_000_000,
      });
      const formData = await unstable_parseMultipartFormData(
        request,
        uploadHandler,
      );
      const file = formData.get("file");
      const data = JSON.parse(formData.get("data") as string);
      const result = await UploadImageToImageKit(file as File);
      if (request.method === "POST") {
        await addGallery({
          title: data.title,
          hotspots: data.hotspots,
          imageUrl: result.url,
          idImage: result.fileId,
        });
        return "created success";
      }
      if (request.method === "PUT") {
        await Promise.all([
          DeleteImageFromImageKit(data.idImg),
          editGalleryById({
            id: params.id as string,
            title: data.title,
            imageUrl: result.url,
            idImage: result.fileId,
            hotspots: data.hotspots,
          }),
        ]);
        return "updated success";
      }
    }
    if (request.method === "DELETE") {
      const formData = await request.formData();
      const idImg = formData.get("idImg");
      await Promise.all([
        DeleteImageFromImageKit(idImg as string),
        deleteGalleryById(params.id as string),
      ]);
      return redirect("/app");
    }
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
  const [hotspots, setHotspots] = useState<Point[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [originalHotspot, setOriginalHotspot] = useState<Point | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [tilte, setTitle] = useState<string>("");
  const [error, setError] = useState({
    title: "",
  });
  const [uncheck, setUnCheck] = useState(true);
  const [acceptNavigate, setAcceptNavigate] = useState(true);
  const [file, setFile] = useState<File | null>();
  const [popupPos, setPopupPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
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
    if (viewIndex === index) {
      setViewIndex(null);
      setPopupPos(null);
    } else {
      const rect = containerRef.current?.getBoundingClientRect();
      const point = hotspots[index];
      if (rect) {
        const top = rect.top + (rect.height * point.y) / 100;
        const left = rect.left + (rect.width * point.x) / 100;
        setPopupPos({ top, left });
      }
      setViewIndex(viewIndex === index ? null : index);
    }

    console.log("hotspots[index]", hotspots[index]);
    console.log("popupPos", popupPos);
  };

  const handleUpload = () => {
    if (!file) return;
    if (!tilte.trim()) {
      setError({ title: "Title is required" });
      return;
    }
    const formData = new FormData();
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
      idImg: gallery.data.idImage,
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
    shopify.modal.hide("modal-custom");
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
    if (fetcher.data === "updated success") navigate("/app");
    if (fetcher.data === "created success") navigate("/app");
    if (fetcher.state === "loading") {
      if (
        fetcher.state === "loading" &&
        fetcher.data !== "created success" &&
        fetcher.data !== "updated success"
      ) {
        shopify.toast.show("deleted success");
      } else {
        shopify.toast.show(fetcher.data as string);
      }
    }
  }, [fetcher.data, navigation.state, fetcher.state]);

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

  console.log("gallery", gallery);

  // component
  const GalleryPage = (
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
          <Button
            variant="secondary"
            onClick={() => {
              setFile(null);
              setUnCheck(false);
            }}
          >
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
          className={styles["container-gallery"]}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <img
            className={styles["image-gallery"]}
            src={
              gallery.page === "edit" && uncheck
                ? gallery.data.imageUrl
                : validImageTypes.includes(
                      (file && (file.type as string)) ?? "",
                    )
                  ? window.URL.createObjectURL(file as File)
                  : imgInvalid
            }
            alt=""
            onClick={handleImageClick}
          />
          {hotspots.map((point, index) => (
            <div
              className={styles["dot-hotspot"]}
              key={index}
              onMouseDown={handleMouseDown(index)}
              onClick={() => point.saved && toggleViewPopup(index)}
              style={
                {
                  "--pointY": `${point.y}%`,
                  "--pointX": `${point.x}%`,
                  "--pointColor":
                    editingIndex === index
                      ? "#f43f5e"
                      : point.saved
                        ? "#111827"
                        : "#9ca3af",
                  "--pointCursor": point.saved ? "pointer" : "move",
                } as React.CSSProperties
              }
            >
              {viewIndex === index && point.saved && (
                <PopupPortal>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className={styles["popup-gallery"]}
                    style={
                      {
                        "--popupPosTop": popupPos?.top + "px",
                        "--popupPosLeft": popupPos?.left + "px",
                      } as React.CSSProperties
                    }
                  >
                    <div>
                      <img
                        className={styles["image-hotspot"]}
                        src={`${point.img && point.img !== "" ? point.img : imgHotspotDefault}`}
                        alt=""
                      />
                    </div>
                    <p>{point.label}</p>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`${urlProduct}/${point.id.split("/").pop() ?? ""}`}
                    >
                      see more
                    </a>
                  </div>
                </PopupPortal>
              )}
            </div>
          ))}
        </div>
      </Grid.Cell>
    </Grid>
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
            onClick={() => {
              shopify.modal.show("modal-custom");
            }}
          >
            Delete Gallery
          </Button>
        ) : (
          []
        )
      }
    >
      {file || (gallery.page === "edit" && uncheck) ? (
        <GalleryUpdate gallery={gallery} />
      ) : (
        CreateGalleryPage
      )}
      <ModalCustom
        text={{
          titleModal: "Delete Products",
          titleMain: `Are you want to delete this product`,
          titleAction: "Delete",
        }}
        handleCancle={() => shopify.modal.hide("modal-custom")}
        handleMain={handleDeleteGallery}
      />
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
            } else {
              setHotspots([]);
            }
            setTitle(gallery.data.title);
            shopify.saveBar.hide("save-bar-custom");
          }}
        />
      </SaveBar>
    </Page>
  );
}
