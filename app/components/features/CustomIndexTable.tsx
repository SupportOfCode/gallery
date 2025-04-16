import type { IndexFiltersProps } from "@shopify/polaris";
import {
  IndexFilters,
  IndexFiltersMode,
  IndexTable,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import { promotedBulkActions, sortOptions } from "app/constants";
import { useEffect, useMemo, useState } from "react";
import { ModalCustom } from "../ui/Modal";
import { useUpdateParams } from "app/hook/useUpdateParams";
import { useDebounce } from "app/hook/useDebounce";
import type { SelectionType } from "@shopify/polaris/build/ts/src/utilities/use-index-resource-state";
import CustomRowIndexTabel from "./CustomRowIndexTable";
import { FilterList } from "./FilterList";
import { useGalleryStore } from "app/store";
import { useNavigation } from "@remix-run/react";
import type { FilterType, GalleryType } from "app/types";

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

type galleryType = {
  data: GalleryType[];
  total: number;
  currentPage: number;
  totalPages: number;
};

type argOfCustomIndexTable = {
  galleries: galleryType;
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
    dateOfPicker: "",
    sortSelected: ["date desc"],
  });
  const navigation = useNavigation();
  const { loading, editLoading } = useGalleryStore();
  const { mode, setMode } = useSetIndexFiltersMode(IndexFiltersMode.Filtering);
  // custom hooks
  const updateParam = useUpdateParams();
  const debouncedTitle = useDebounce(filters.title);
  const appliedFilters = useMemo(() => {
    const filtersArray: IndexFiltersProps["appliedFilters"] = [];
    if (filters.dateOfPicker) {
      filtersArray.push({
        key: "dueDate",
        label: `Due Date: ${filters.dateOfPicker}`,
        onRemove: () => setFilters((prev) => ({ ...prev, dateOfPicker: "" })),
      });
    }
    return filtersArray;
  }, [filters.dateOfPicker]);
  useEffect(() => {
    updateParam("title", debouncedTitle.trim());
    updateParam("dateOfPicker", filters.dateOfPicker.trim());
    updateParam("sort", filters.sortSelected[0]);
    editLoading({ loadingFilter: true });
  }, [debouncedTitle, filters.dateOfPicker, filters.sortSelected]);
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
      dateOfPicker: "",
      sortSelected: ["date asc"],
    });
  };
  const handleNextPage = () => {
    const nextPage = galleries.currentPage + 1;
    updateParam("page", nextPage.toString());
    selected.clearSelection();
  };
  const handlePreviousPage = () => {
    const previousPage = galleries.currentPage - 1;
    updateParam("page", previousPage.toString());
    selected.clearSelection();
  };
  // component funcitons
  const rowMarkup = galleries.data.map(
    (
      { _id, title, createdAt, hotspots, imageUrl }: GalleryType,
      index: number,
    ) => {
      return (
        <CustomRowIndexTabel
          key={_id}
          data={{ _id, title, createdAt, hotspots, imageUrl }}
          index={index}
          selectedBool={selected.selectedResources.includes(_id ?? "")}
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
        filters={FilterList(filters.dateOfPicker, handleFilterChange)}
        appliedFilters={appliedFilters}
        onClearAll={handleFiltersClearAll}
        mode={mode}
        setMode={setMode}
        loading={navigation.state === "loading" && loading.loadingFilter}
      />
      <IndexTable
        resourceName={{
          singular: "gallery",
          plural: "galleries",
        }}
        promotedBulkActions={promotedBulkActions}
        itemCount={galleries.data.length}
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
        pagination={{
          label:
            galleries.totalPages > 1 &&
            `page ${galleries.currentPage} / ${galleries.totalPages}`,
          hasNext: galleries.currentPage < galleries.totalPages,
          hasPrevious: galleries.currentPage > 1 && galleries.totalPages > 1,
          onNext: handleNextPage,
          onPrevious: handlePreviousPage,
        }}
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
