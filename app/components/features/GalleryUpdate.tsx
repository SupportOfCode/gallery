import {
  Box,
  Button,
  Card,
  Grid,
  RangeSlider,
  Scrollable,
  Text,
  TextField,
} from "@shopify/polaris";
import { PopupPortal } from "../ui/PopupPortal";
import {
  imgHotspotDefault,
  imgInvalid,
  urlProduct,
  validImageTypes,
} from "app/constants";
import styles from "../../css/components/gallery-update.module.css";
import { useEffect, useRef, useState } from "react";
import { useGalleryStore } from "app/store";
import type { GalleryTypeOfServer, Point, ProductResource } from "app/types";
import { useParams } from "@remix-run/react";

type GalleryPageProps = {
  gallery: {
    page: string;
    data: GalleryTypeOfServer;
  };
};

export default function GalleryUpdate({ gallery }: GalleryPageProps) {
  const param = useParams();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [originalHotspot, setOriginalHotspot] = useState<Point | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [popupPos, setPopupPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const { galleryNew, setGallery, untilVariable, setUntilVariable } =
    useGalleryStore();
  const draggingIndex = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleAddHotspot = (newHotspot: Point) => {
    setGallery({ hotspots: [newHotspot, ...(galleryNew.hotspots ?? [])] });
    setEditingIndex(0);
    setOriginalHotspot(null);
    setViewIndex(null);
  };

  const handleClickAddHotspot = (newHotspot: Point) => {
    if (!(galleryNew.hotspots ?? []).some((hot) => hot.saved === false))
      handleAddHotspot(newHotspot);
  };

  const handlePick = async (index: number) => {
    try {
      const selected = await shopify.resourcePicker({ type: "product" });
      const products = selected as ProductResource[];
      const updated = [...(galleryNew.hotspots ?? [])];
      updated[index] = {
        ...updated[index],
        id: products?.[0]?.id,
        label: products?.[0]?.title ?? "New Hotspot",
        img: products?.[0]?.images?.[0]?.originalSrc ?? "",
      };
      setGallery({ hotspots: updated });
    } catch (error) {
      console.log("Người dùng đã hủy chọn");
    }
  };

  const handlePositionChange = (
    index: number,
    axis: "x" | "y",
    value: number,
  ) => {
    const updated = [...(galleryNew.hotspots ?? [])];
    updated[index] = { ...updated[index], [axis]: value };
    setGallery({ hotspots: updated });
  };

  const handleSave = (index: number) => {
    const updated = [...(galleryNew.hotspots ?? [])];
    updated[index] = {
      ...updated[index],
      saved: true,
    };
    setGallery({ hotspots: updated });
    setEditingIndex(null);
    setOriginalHotspot(null);
  };

  const handleCancel = () => {
    if (editingIndex === null) return;
    if (originalHotspot) {
      const updated = [...(galleryNew.hotspots ?? [])];
      updated[editingIndex] = originalHotspot;
      setGallery({ hotspots: updated });
    } else {
      const updated = [...(galleryNew.hotspots ?? [])];
      updated.splice(editingIndex, 1);
      setGallery({ hotspots: updated });
    }
    setEditingIndex(null);
    setOriginalHotspot(null);
  };

  const handleEdit = (index: number) => {
    setOriginalHotspot({ ...(galleryNew.hotspots ?? [])[index] });
    setEditingIndex(index);
    setViewIndex(null);
  };

  const handleDelete = (index: number) => {
    const updated = (galleryNew.hotspots ?? []).filter((_, i) => i !== index);
    setGallery({ hotspots: updated });
    setEditingIndex(null);
    setOriginalHotspot(null);
    setViewIndex(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingIndex.current === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const updated = [...(galleryNew.hotspots ?? [])];
    updated[draggingIndex.current] = {
      ...updated[draggingIndex.current],
      x,
      y,
    };
    setGallery({ hotspots: updated });
  };

  const handleMouseUp = () => {
    draggingIndex.current = null;
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

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    if (editingIndex === index) {
      draggingIndex.current = index;
    }
    e.stopPropagation();
  };

  const toggleViewPopup = (index: number) => {
    if (viewIndex === index) {
      setViewIndex(null);
      setPopupPos(null);
    } else {
      const rect = containerRef.current?.getBoundingClientRect();
      const point = (galleryNew.hotspots ?? [])[index];
      if (rect) {
        const top = rect.top + (rect.height * point.y) / 100;
        const left = rect.left + (rect.width * point.x) / 100;
        setPopupPos({ top, left });
      }
      setViewIndex(viewIndex === index ? null : index);
    }
  };

  console.log(param.id);

  useEffect(() => {
    if (gallery.page === "edit") {
      const hotspots = gallery.data.hotspots.map((h) => ({
        id: h.productId,
        x: h.x,
        y: h.y,
        saved: true,
        label: h.title,
        img: h.img,
      }));
      setGallery({
        hotspots: hotspots,
        title: gallery.page === "edit" ? gallery.data.title : "",
      });
    }
  }, []);

  useEffect(() => {
    if (galleryNew.title !== "") shopify.saveBar.show("save-bar-custom");
  }, [galleryNew.title]);

  return (
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
              setGallery({ file: null });
              setUntilVariable({ unCheck: false });
            }}
          >
            UnCheck Image
          </Button>

          <Box paddingBlock={"200"} />
          <TextField
            label=""
            placeholder="Gallery Title"
            autoComplete="off"
            value={galleryNew.title ?? ""}
            error={galleryNew.error?.title}
            onChange={(value) => {
              setGallery({ title: value, error: { title: "" } });
            }}
          />
        </Box>
        <Scrollable style={{ height: "80vh" }}>
          {(galleryNew.hotspots ?? []).map((point, index) => (
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
              gallery.page === "edit" && untilVariable.unCheck
                ? gallery.data.imageUrl
                : validImageTypes.includes(
                      (galleryNew.file && (galleryNew.file.type as string)) ??
                        "",
                    )
                  ? window.URL.createObjectURL(galleryNew.file as File)
                  : imgInvalid
            }
            alt=""
            onClick={handleImageClick}
          />
          {(galleryNew.hotspots ?? []).map((point, index) => (
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
}
