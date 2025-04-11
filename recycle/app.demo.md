import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import {
  IndexTable,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Text,
  Page,
  IndexFiltersMode,
  TextField,
  Card,
  IndexFiltersProps,
  Thumbnail,
} from "@shopify/polaris";
import { formatDate } from "app/common";
import { deleteGalleries, getGalleries } from "app/utils/galleries.server";
import { useEffect, useMemo, useState } from "react";
import { ModalCustom } from "./components/Modal";
import { sortOptions } from "app/constants";
import { useDebounce } from "app/hook/useDebounce";
import { useUpdateParams } from "app/hook/useUpdateParams";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") || "";
  const fromDate = url.searchParams.get("fromDate") || "";
  const toDate = url.searchParams.get("toDate") || "";
  const sort = url.searchParams.get("sort") || "";
  const data = await getGalleries({ title, fromDate, toDate, sort });
  return data;
};

export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const ids = formData.getAll("ids") as string[];
    if (request.method === "DELETE") return await deleteGalleries(ids);
  } catch (error) {
    throw new Response(error as string);
  }
};

export default function IndexFiltersDefaultExample() {
  const galleries = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterType>({
    title: "",
    toDate: "",
    fromDate: "",
    sortSelected: ["date asc"],
  });
  const { mode, setMode } = useSetIndexFiltersMode(IndexFiltersMode.Filtering);
  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection,
  } = useIndexResourceState(galleries, {
    resourceIDResolver: (galleries) => String(galleries._id),
  });

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
  const handleDelete = () => {
    const formData = new FormData();
    selectedResources.forEach((id) => formData.append("ids", id));
    fetcher.submit(formData, { method: "delete" });
    shopify.modal.hide("modal-custom");
    clearSelection();
  };

  // component functions
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
          selected={selectedResources.includes(_id)}
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
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {title}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{date}</IndexTable.Cell>
          <IndexTable.Cell>{hotspots.length}</IndexTable.Cell>
        </IndexTable.Row>
      );
    },
  );
  const promotedBulkActions = [
    {
      destructive: true,
      content: "Delete galleries",
      onAction: () => shopify.modal.show("modal-custom"),
    },
  ];

  return (
    <Page>
      <Card>
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
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
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
            clearSelection();
          }}
          handleMain={handleDelete}
        />
      </Card>
    </Page>
  );
}
