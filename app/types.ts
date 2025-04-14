type FilterType = {
  title: string;
  dateOfPicker: string;
  sortSelected: string[];
};

type GalleryType = {
  _id: string;
  title: string;
  imageUrl?: string;
  hotspots: any[];
  shop?: string;
  createdAt: Date;
};

type Point = {
  x: number;
  y: number;
  saved: boolean;
  label: string;
  img: string;
  id: string;
};

type LoadingType = {
  loadingNewGallery?: boolean;
  loadingFilter?: boolean;
  loadingSave?: boolean;
  loadingDeleteGallery?: boolean;
};

type ProductResource = {
  id: string;
  title: string;
  images: { id: string; altText?: string; originalSrc?: string }[];
};
