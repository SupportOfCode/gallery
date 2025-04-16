import type { IHotspot } from "./model/Gallery.model.server";

export type FilterType = {
  title: string;
  dateOfPicker: string;
  sortSelected: string[];
};

export type GalleryTypeOfServer = {
  _id?: string;
  title: string;
  idImage?: string;
  imageUrl?: string;
  hotspots: IHotspot[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type GalleryType = {
  _id?: string;
  title?: string;
  idImage?: string;
  imageUrl?: string;
  hotspots?: Point[];
  createdAt?: Date;
  updatedAt?: Date;
  error?: ErrorOfGallery;
  file?: File | null;
};

export type Point = {
  x: number;
  y: number;
  saved: boolean;
  label: string;
  img: string;
  id: string;
};

export type LoadingType = {
  loadingNewGallery?: boolean;
  loadingFilter?: boolean;
  loadingSave?: boolean;
  loadingDeleteGallery?: boolean;
};

export type ProductResource = {
  id: string;
  title: string;
  images: { id: string; altText?: string; originalSrc?: string }[];
};

export type Common = {
  unCheck: boolean;
};

export type ErrorOfGallery = {
  title: string;
};
