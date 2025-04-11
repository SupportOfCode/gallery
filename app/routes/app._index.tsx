import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useIndexResourceState, Page, Card, Button } from "@shopify/polaris";
import { deleteGalleries, getGalleries } from "app/utils/galleries.server";
import CustomIndexTable from "../components/CustomIndexTable";
import { useState } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const title = url.searchParams.get("title") || "";
    const fromDate = url.searchParams.get("fromDate") || "";
    const toDate = url.searchParams.get("toDate") || "";
    const sort = url.searchParams.get("sort") || "";
    const data = await getGalleries({ title, fromDate, toDate, sort });
    return data;
  } catch (error) {
    throw new Response(error as string);
  }
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
  const [loading, setLoading] = useState(false);

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection,
  } = useIndexResourceState(galleries, {
    resourceIDResolver: (galleries) => String(galleries._id),
  });

  const handleDelete = () => {
    const formData = new FormData();
    selectedResources.forEach((id) => formData.append("ids", id));
    fetcher.submit(formData, { method: "delete" });
    shopify.modal.hide("modal-custom");
    clearSelection();
  };

  const argOfPage = {
    title: "Gallery List",
    primaryAction: (
      <Button
        url="/app/gallery/new"
        variant="primary"
        loading={loading}
        onClick={() => setLoading(true)}
      >
        New Gallery
      </Button>
    ),
  };

  return (
    <Page title={argOfPage.title} primaryAction={argOfPage.primaryAction}>
      <Card>
        <CustomIndexTable
          galleries={galleries}
          handleDelete={handleDelete}
          selected={{
            selectedResources,
            allResourcesSelected,
            handleSelectionChange,
            clearSelection,
          }}
        />
      </Card>
    </Page>
  );
}
