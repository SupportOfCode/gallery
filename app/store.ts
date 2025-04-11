import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { axisInit } from "./constants";

interface GalleryStore {
  axis: AxisType;
  editAxis: ({ x, y }: AxisType) => void;
  resetAxis: () => void;
}

export const useGalleryStore = create<GalleryStore>()(
  immer((set) => ({
    axis: axisInit,

    editAxis: ({ x, y }) => {
      set((state) => {
        state.axis.x += x;
        state.axis.y += y;
      });
    },

    resetAxis: () => {
      set((state) => {
        state.axis = axisInit;
      });
    },
  })),
);
