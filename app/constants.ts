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

export const axisInit = {
  x: 471,
  y: 321,
};
