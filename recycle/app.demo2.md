import { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";

type Hotspot = {
  id: string;
  x: number; // phần trăm
  y: number; // phần trăm
  saved: boolean;
};

export default function HotspotImage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const addHotspot = (e: React.MouseEvent) => {
    if (!imageRef.current || !wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const x = (offsetX / rect.width) * 100;
    const y = (offsetY / rect.height) * 100;

    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substring(2),
      x,
      y,
      saved: false,
    };
    setHotspots([...hotspots, newHotspot]);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Hotspot Image with Moveable
      </h2>
      <div
        className="relative inline-block border rounded"
        onClick={addHotspot}
        ref={wrapperRef}
        style={{ width: "100%", maxHeight: "80vh", overflow: "hidden" }}
      >
        <img
          ref={imageRef}
          src="https://picsum.photos/1000/700"
          alt="Ảnh demo"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            objectFit: "cover",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {hotspots.map((spot) => {
          return (
            <div
              key={spot.id}
              ref={(el) => {
                if (!spot.saved && el) setTarget(el);
              }}
              style={{
                position: "absolute",
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                transform: "translate(-50%, -50%)",
                width: 16,
                height: 16,
                backgroundColor: spot.saved ? "black" : "yellow",
                borderRadius: "9999px",
              }}
            />
          );
        })}

        {/* Moveable chỉ hiển thị khi có target */}
        {target && (
          <Moveable
            target={target}
            container={wrapperRef.current!}
            draggable
            onDrag={({ left, top }) => {
              if (!wrapperRef.current) return;
              const rect = wrapperRef.current.getBoundingClientRect();
              const x = (left / rect.width) * 100;
              const y = (top / rect.height) * 100;

              setHotspots((prev) =>
                prev.map((h) => (h.saved ? h : { ...h, x, y })),
              );
            }}
            bounds={{ left: 0, top: 0, right: 100, bottom: 100 }}
          />
        )}
      </div>
    </div>
  );
}
