import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { galleryInit, loadingInit, untileVariableInit } from "./constants";
import type { Common, GalleryType, LoadingType } from "./types";

interface GalleryStore {
  // gallery
  galleryNew: GalleryType;
  setGallery: ({ ...props }: GalleryType) => void;
  resetGallery: () => void;

  // loading
  loading: LoadingType;
  editLoading: ({ ...props }: LoadingType) => void;
  resetLoading: () => void;

  //common
  untilVariable: Common;
  setUntilVariable: ({ ...props }: Common) => void;
  resetUntilVariable: () => void;
}

export const useGalleryStore = create<GalleryStore>()(
  immer((set) => ({
    // gallery
    galleryNew: galleryInit,

    setGallery: ({ title, hotspots, file, error }) => {
      set((state) => {
        state.galleryNew.title = title ?? state.galleryNew.title;
        state.galleryNew.hotspots = hotspots ?? state.galleryNew.hotspots;
        state.galleryNew.file = file ?? state.galleryNew.file;
        state.galleryNew.error = error ?? state.galleryNew.error;
      });
    },

    resetGallery: () =>
      set((state) => {
        state.galleryNew = galleryInit;
      }),

    // loading
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

    // common
    untilVariable: untileVariableInit,
    setUntilVariable: ({ unCheck }) => {
      set((state) => {
        state.untilVariable.unCheck = unCheck;
      });
    },
    resetUntilVariable: () => {
      set((state) => {
        state.untilVariable = untileVariableInit;
      });
    },
  })),
);
