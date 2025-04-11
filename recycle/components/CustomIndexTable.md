import { useNavigate } from "@remix-run/react";
import {
  IndexFilters,
  IndexFiltersMode,
  IndexFiltersProps,
  IndexTable,
  TextField,
  Thumbnail,
  useIndexResourceState,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import { formatDate } from "app/common";
import { promotedBulkActions, sortOptions } from "app/constants";
import { useEffect, useMemo, useState } from "react";
import { ModalCustom } from "./Modal";
import { useUpdateParams } from "app/hook/useUpdateParams";
import { useDebounce } from "app/hook/useDebounce";
import { SelectionType } from "@shopify/polaris/build/ts/src/utilities/use-index-resource-state";

type SelectedTypeCustom = {
  selectedResources: string[];
  allResourcesSelected: boolean;
  handleSelectionChange: (
    selectionType: SelectionType,
    isSelecting: boolean,
    selection?: string | [number, number],
    _position?: number,
  ) => void;
  clearSelection: () => void;
};
type argOfCustomIndexTable = {
  galleries: GalleryType[];
  handleDelete: () => void;
  selected: SelectedTypeCustom;
};

export default function CustomIndexTable({
  galleries,
  handleDelete,
  selected,
}: argOfCustomIndexTable) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterType>({
    title: "",
    toDate: "",
    fromDate: "",
    sortSelected: ["date asc"],
  });
  const { mode, setMode } = useSetIndexFiltersMode(IndexFiltersMode.Filtering);

  // custom hooks
  const updateParam = useUpdateParams();
  const debouncedTitle = useDebounce(filters.title);

  const appliedFilters = useMemo(() => {
    const filtersArray: IndexFiltersProps["appliedFilters"] = [];
    if (filters.fromDate || filters.toDate) {
      filtersArray.push({
        key: "dueDate",
        label: `Due Date: ${filters.fromDate || "..."} → ${filters.toDate || "..."}`,
        onRemove: () =>
          setFilters((prev) => ({ ...prev, fromDate: "", toDate: "" })),
      });
    }
    return filtersArray;
  }, [filters.fromDate, filters.toDate]);

  useEffect(() => {
    updateParam("title", debouncedTitle.trim());
    updateParam("fromDate", filters.fromDate.trim());
    updateParam("toDate", filters.toDate.trim());
    updateParam("sort", filters.sortSelected[0]);
  }, [debouncedTitle, filters.fromDate, filters.toDate, filters.sortSelected]);

  // handle functions
  const handleFilterChange = <Key extends keyof FilterType>(
    key: keyof FilterType,
    value: FilterType[Key],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleFiltersClearAll = () => {
    setFilters({
      title: "",
      toDate: "",
      fromDate: "",
      sortSelected: ["date asc"],
    });
  };

  // component funcitons
  const filtersComponent = [
    {
      key: "dueDate",
      label: "Due Date",
      filter: (
        <>
          <TextField
            type="date"
            label="From"
            value={filters.fromDate}
            onChange={(value) => handleFilterChange("fromDate", value)}
            autoComplete="off"
          />
          <TextField
            type="date"
            label="To"
            value={filters.toDate}
            onChange={(value) => handleFilterChange("toDate", value)}
            autoComplete="off"
          />
        </>
      ),
      pinned: true,
    },
  ];
  const rowMarkup = galleries.map(
    ({ _id, title, createdAt, hotspots }: GalleryType, index: number) => {
      const date = formatDate(createdAt);
      return (
        <IndexTable.Row
          id={_id}
          key={_id}
          selected={selected.selectedResources.includes(_id)}
          position={index}
          onClick={() => {
            navigate(`/app/gallery/${_id}`);
          }}
        >
          <IndexTable.Cell>
            <Thumbnail
              source="https://burst.shopifycdn.com/photos/black-leather-choker-necklace_373x@2x.jpg"
              size="medium"
              alt="Black choker necklace"
            />
          </IndexTable.Cell>
          <IndexTable.Cell>{title}</IndexTable.Cell>
          <IndexTable.Cell>{date}</IndexTable.Cell>
          <IndexTable.Cell>{hotspots.length}</IndexTable.Cell>
        </IndexTable.Row>
      );
    },
  );

  return (
    <>
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={filters.sortSelected}
        queryValue={filters.title}
        queryPlaceholder="Searching in all"
        onQueryChange={(value) => handleFilterChange("title", value)}
        onQueryClear={() => setFilters((prev) => ({ ...prev, title: "" }))}
        onSort={(value) =>
          setFilters((prev) => ({ ...prev, sortSelected: value }))
        }
        tabs={[]}
        selected={0}
        onSelect={() => {}}
        filters={filtersComponent}
        appliedFilters={appliedFilters}
        onClearAll={handleFiltersClearAll}
        mode={mode}
        setMode={setMode}
      />
      <IndexTable
        resourceName={{
          singular: "gallery",
          plural: "galleries",
        }}
        promotedBulkActions={promotedBulkActions}
        itemCount={galleries.length}
        selectedItemsCount={
          selected.allResourcesSelected
            ? "All"
            : selected.selectedResources.length
        }
        onSelectionChange={selected.handleSelectionChange}
        headings={[
          { title: "Thumbnail" },
          { title: "Name" },
          { title: "Date" },
          { title: "Hotspot" },
        ]}
      >
        {rowMarkup}
      </IndexTable>

      <ModalCustom
        text={{
          titleModal: "Delete Products",
          titleMain: `Are you want to delete this product`,
          titleAction: "Delete",
        }}
        handleCancle={() => {
          shopify.modal.hide("modal-custom");
          selected.clearSelection();
        }}
        handleMain={handleDelete}
      />
    </>
  );
}
