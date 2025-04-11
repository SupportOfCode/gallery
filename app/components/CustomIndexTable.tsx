import {
  IndexFilters,
  IndexFiltersMode,
  IndexFiltersProps,
  IndexTable,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import { promotedBulkActions, sortOptions } from "app/constants";
import { useEffect, useMemo, useState } from "react";
import { ModalCustom } from "./Modal";
import { useUpdateParams } from "app/hook/useUpdateParams";
import { useDebounce } from "app/hook/useDebounce";
import { SelectionType } from "@shopify/polaris/build/ts/src/utilities/use-index-resource-state";
import CustomRowIndexTabel from "./CustomRowIndexTable";
import { FilterList } from "./FilterList";

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
  const rowMarkup = galleries.map(
    ({ _id, title, createdAt, hotspots }: GalleryType, index: number) => {
      return (
        <CustomRowIndexTabel
          data={{ _id, title, createdAt, hotspots }}
          index={index}
          selectedBool={selected.selectedResources.includes(_id)}
        />
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
        filters={FilterList(
          filters.fromDate,
          filters.toDate,
          handleFilterChange,
        )}
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
