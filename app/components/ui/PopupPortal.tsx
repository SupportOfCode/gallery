import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function PopupPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
