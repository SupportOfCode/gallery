import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { loadingInit } from "./constants";

interface GalleryStore {
  loading: LoadingType;
  editLoading: ({ ...props }: LoadingType) => void;
  resetLoading: () => void;
}

export const useGalleryStore = create<GalleryStore>()(
  immer((set) => ({
    loading: loadingInit,

    editLoading: ({
      loadingNewGallery,
      loadingFilter,
      loadingSave,
      loadingDeleteGallery,
    }) => {
      set((state) => {
        state.loading.loadingNewGallery = loadingNewGallery ?? false;
        state.loading.loadingFilter = loadingFilter ?? false;
        state.loading.loadingSave = loadingSave ?? false;
        state.loading.loadingDeleteGallery = loadingDeleteGallery ?? false;
      });
    },

    resetLoading: () => {
      set((state) => {
        state.loading = loadingInit;
      });
    },
  })),
);
