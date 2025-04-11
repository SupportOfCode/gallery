import { useRef, useState, useEffect } from "react";

type Hotspot = {
  id: string;
  x: number;
  y: number;
  saved: boolean;
};

export default function HotspotImage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasUnsaved = hotspots.some((h) => !h.saved);

  // Click để thêm hotspot
  const handleImageClick = (e: React.MouseEvent) => {
    if (!imageRef.current) return;

    // Nếu đã có hotspot chưa save, xóa nó
    if (hasUnsaved) {
      setHotspots((prev) => prev.filter((h) => h.saved));
    }

    const img = imageRef.current;

    const { offsetX, offsetY } = e.nativeEvent as MouseEvent;

    const x = (offsetX / img.width) * 100;
    const y = (offsetY / img.height) * 100;

    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substring(2),
      x,
      y,
      saved: false,
    };
    setHotspots((prev) => [...prev, newHotspot]);
  };

  // Kéo thả
  const handleMouseDown = (id: string) => {
    const spot = hotspots.find((h) => h.id === id);
    if (spot?.saved) return;
    setDraggingId(id);
  };

  const HOTSPOT_SIZE = 16;

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingId || !imageRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Tính toạ độ theo %
    const x = (mouseX / rect.width) * 100;
    const y = (mouseY / rect.height) * 100;

    // Tính giới hạn để hotspot không ra ngoài ảnh
    const hotspotHalfXPercent = (HOTSPOT_SIZE / 2 / rect.width) * 100;
    const hotspotHalfYPercent = (HOTSPOT_SIZE / 2 / rect.height) * 100;

    const clampedX = Math.max(
      hotspotHalfXPercent,
      Math.min(x, 100 - hotspotHalfXPercent),
    );
    const clampedY = Math.max(
      hotspotHalfYPercent,
      Math.min(y, 100 - hotspotHalfYPercent),
    );

    setHotspots((prev) =>
      prev.map((h) =>
        h.id === draggingId ? { ...h, x: clampedX, y: clampedY } : h,
      ),
    );
  };

  const handleMouseUp = () => setDraggingId(null);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const saveHotspot = () => {
    setHotspots((prev) =>
      prev.map((h) => (h.saved ? h : { ...h, saved: true })),
    );
  };
  const cancelHotspot = () => {
    setHotspots((prev) => prev.filter((h) => h.saved)); // Xóa hotspot chưa save
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Hotspot trên ảnh</h2>

      <div
        className="relative inline-block"
        onClick={handleImageClick}
        style={{ height: "80vh" }}
      >
        <img
          ref={imageRef}
          src="https://picsum.photos/1000/700"
          alt="Ảnh demo"
          className="border rounded"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            maxHeight: "80vh",
            objectFit: "cover",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {hotspots.map((spot) => (
          <div
            key={spot.id}
            onMouseDown={() => handleMouseDown(spot.id)}
            style={{
              position: "absolute",
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              transform: "translate(-50%, -50%)",
              width: `${HOTSPOT_SIZE}px`,
              height: `${HOTSPOT_SIZE}px`,
              borderRadius: "9999px",
              backgroundColor: spot.saved ? "black" : "yellow",
              cursor: "grab",
              zIndex: 10,
            }}
          />
        ))}
      </div>

      {hasUnsaved && (
        <div className="space-x-2">
          <button
            onClick={saveHotspot}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save Hotspot
          </button>
          <button
            onClick={cancelHotspot}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
