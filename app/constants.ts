import type { IndexFiltersProps } from "@shopify/polaris";

export const sortOptions: IndexFiltersProps["sortOptions"] = [
  { label: "Gallery", value: "gallery asc", directionLabel: "Ascending" },
  { label: "Gallery", value: "gallery desc", directionLabel: "Descending" },
  { label: "Date", value: "date asc", directionLabel: "A-Z" },
  { label: "Date", value: "date desc", directionLabel: "Z-A" },
  { label: "Hotspot", value: "Hotspot asc", directionLabel: "Ascending" },
  { label: "Hotspot", value: "Hotspot desc", directionLabel: "Descending" },
];

export const promotedBulkActions = [
  {
    destructive: true,
    content: "Delete galleries",
    onAction: () => shopify.modal.show("modal-custom"),
  },
];

export const validImageTypes = ["image/gif", "image/jpeg", "image/png"];

export const loadingInit = {
  loadingNewGallery: false,
  loadingFilter: false,
};

export const dataOfGalleryInit = {
  _id: "",
  hotspots: [],
  idImage: "",
  imageUrl: "",
  title: "",
};

export const untileVariableInit = {
  unCheck: true,
};

export const galleryInit = {
  title: "",
  hotspots: [],
  file: null,
  error: {
    title: "",
  },
};

// img default
export const imgThumbnailDefault =
  "https://burst.shopifycdn.com/photos/black-leather-choker-necklace_373x@2x.jpg";
export const imgInvalid =
  "https://thumbs.dreamstime.com/b/not-valid-red-stamp-text-white-48506534.jpg";
export const imgHotspotDefault =
  "https://www.thewall360.com/uploadImages/ExtImages/images1/def-638240706028967470.jpg";
export const imgUploadDefault =
  "https://s3-alpha-sig.figma.com/plugins/1238846170932800754/55109/d55bc0b1-cef0-4047-a8f9-8ac542f43fe1-cover?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=DyuuhIjIRS~UBk0IPb6iMgUhcbW9eWABtJRhwOsmMhTnBaswHwd2EcENZh4j-7Su-i5au5Y5Uu0VcHgjYkIaN6YCfCD8frw1BrqKhbbMNXGBBTBBKdzO1GUSvG-cA8rXATufuOu6cOJAcSZgsQWU9ounul-SZ758bvmbpkmUitCMyMgOEo5h51m3~OqUcOmdGvm81Bk4Fsi8-etdgsT1O1t4-A2l3JaDNeduMFOF63s3r0h13vlVk76EV8YCRBK1YK8j~31DGF~a8zx0HbIFFv04JZs0M~5aWvZIjyMmK73h-9imDuDfrkXm8KMnMCZ7RLbXuai-vYwaMvsdjl2wzw__";

// url
export const urlProduct =
  "https://admin.shopify.com/store/the-most-expensive-store-on-the-world/products";
