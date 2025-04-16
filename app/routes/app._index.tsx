import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigation } from "@remix-run/react";
import { useIndexResourceState, Page, Card, Button } from "@shopify/polaris";
import { deleteGalleries, getGalleries } from "app/utils/galleries.server";
import CustomIndexTable from "../components/features/CustomIndexTable";
import { useEffect } from "react";
import { useGalleryStore } from "app/store";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const title = url.searchParams.get("title") || "";
    const dateOfPicker = url.searchParams.get("dateOfPicker") || "";
    const page = Number(url.searchParams.get("page")) || 1;
    const sort = url.searchParams.get("sort") || "";
    const data = await getGalleries({
      title,
      dateOfPicker,
      sort,
      page,
      limit: 5,
    });
    return data;
  } catch (error) {
    throw new Response(error as string);
  }
};
export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const ids = formData.getAll("ids") as string[];
    if (request.method === "DELETE") await deleteGalleries(ids);
    return "Deleted successfully";
  } catch (error) {
    throw new Response(error as string);
  }
};

export default function IndexFiltersDefaultExample() {
  const galleries = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const { loading, editLoading } = useGalleryStore();
  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection,
  } = useIndexResourceState(galleries.data, {
    resourceIDResolver: (galleries) => String(galleries._id),
  });

  useEffect(() => {
    if (fetcher.state !== "idle" || navigation.state === "loading") {
      shopify.loading(true);
    } else {
      shopify.loading(false);
    }
    if (fetcher.state === "loading") shopify.toast.show(fetcher.data as string);
  }, [fetcher.state, fetcher.data, navigation.state]);

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
        loading={loading.loadingNewGallery}
        onClick={() => editLoading({ loadingNewGallery: true })}
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
