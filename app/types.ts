type FilterType = {
  title: string;
  fromDate: string;
  toDate: string;
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

type AxisType = {
  x: number;
  y: number;
};
