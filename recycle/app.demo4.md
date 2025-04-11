import { Page } from "@shopify/polaris";
import React, { useState, useRef } from "react";

type Point = { x: number; y: number; saved: boolean; label: string };

export default function AppDemo() {
  const [hotspots, setHotspots] = useState<Point[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [originalHotspot, setOriginalHotspot] = useState<Point | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null); // 👈 New
  const draggingIndex = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (editingIndex !== null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newHotspot: Point = { x, y, saved: false, label: "" };
    setHotspots([...hotspots, newHotspot]);
    setEditingIndex(hotspots.length);
    setInputValue("");
    setOriginalHotspot(null);
    setViewIndex(null);
  };

  const handleSave = (index: number) => {
    const updated = [...hotspots];
    updated[index] = {
      ...updated[index],
      saved: true,
      label: inputValue || `Hotspot ${index + 1}`,
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
    setInputValue(hotspots[index].label);
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

  return (
    <Page title="Gallery Page">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 16,
          gap: 24,
        }}
      >
        <div
          style={{
            minWidth: 250,
            maxHeight: "80vh",
            overflowY: "auto",
            paddingRight: 8,
          }}
        >
          <h3>Danh sách Hotspot</h3>
          {hotspots.map((point, index) => (
            <div
              key={index}
              style={{
                marginBottom: 12,
                padding: 10,
                border: "1px solid #ddd",
                borderRadius: 6,
                backgroundColor: "#f8f9fa",
              }}
            >
              {editingIndex === index ? (
                <div>
                  <input
                    type="text"
                    value={inputValue}
                    placeholder="Nhập mô tả hotspot..."
                    onChange={(e) => setInputValue(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      margin: "8px 0",
                      borderRadius: 4,
                      border: "1px solid #ccc",
                    }}
                  />
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <label>
                      X:
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={point.x}
                        onChange={(e) =>
                          handlePositionChange(
                            index,
                            "x",
                            Number(e.target.value),
                          )
                        }
                      />
                    </label>
                    <label>
                      Y:
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={point.y}
                        onChange={(e) =>
                          handlePositionChange(
                            index,
                            "y",
                            Number(e.target.value),
                          )
                        }
                      />
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => handleSave(index)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                      }}
                    >
                      💾 Lưu
                    </button>
                    <button
                      onClick={handleCancel}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#dc3545",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                      }}
                    >
                      ❌ Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    {point.label || `Hotspot tại vị trí thứ ${index + 1}`}
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span>X: {Math.round(point.x)}</span>
                    <span>Y: {Math.round(point.y)}</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => handleEdit(index)}
                      style={{
                        marginRight: 6,
                        padding: "4px 10px",
                        backgroundColor: "#ffc107",
                        border: "none",
                        borderRadius: 4,
                        color: "#000",
                        cursor: "pointer",
                      }}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      style={{
                        padding: "4px 10px",
                        backgroundColor: "#dc3545",
                        border: "none",
                        borderRadius: 4,
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      🗑 Xóa
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div>
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
              src="https://ik.imagekit.io/9whbrtwm9/gallery/upload_e_nsIN6al.jpg"
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
                  width: 12,
                  height: 12,
                  backgroundColor:
                    editingIndex === index
                      ? "red"
                      : point.saved
                        ? "black"
                        : "gray",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  cursor: point.saved ? "pointer" : "move",
                  userSelect: "none",
                }}
              >
                {viewIndex === index && point.saved && (
                  <div
                    style={{
                      position: "absolute",
                      top: -40,
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#fff",
                      border: "1px solid #333",
                      borderRadius: 4,
                      padding: "4px 10px",
                      whiteSpace: "nowrap",
                      fontSize: 14,
                      zIndex: 10000,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  >
                    {point.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
