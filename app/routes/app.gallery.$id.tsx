import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { IHotspot } from "app/model/Gallery.model.server";
import {
  redirect,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import {
  addGallery,
  deleteGalleryById,
  editGalleryById,
  getGalleryById,
} from "app/utils/galleries.server";
import {
  DeleteImageFromImageKit,
  UploadImageToImageKit,
} from "app/utils/imagekit.server";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { useState, useEffect } from "react";
import { SaveBar } from "@shopify/app-bridge-react";
import { Button, Page } from "@shopify/polaris";
import { dataOfGalleryInit } from "app/constants";
import { ModalCustom } from "app/components/ui/Modal";
import GalleryUpdate from "app/components/features/GalleryUpdate";
import { useGalleryStore } from "app/store";
import GalleryAdd from "app/components/features/GalleryAdd";

export const loader: LoaderFunction = async ({ params }) => {
  try {
    if (params.id === "new")
      return {
        page: "new",
        data: dataOfGalleryInit,
      };
    return {
      page: "edit",
      data: await getGalleryById(params.id as string),
    };
  } catch (error) {
    console.error("Loader Error:", error);
    throw new Error("Internal Server Error");
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  try {
    if (request.method === "POST" || request.method === "PUT") {
      // handle save image
      const uploadHandler = unstable_createMemoryUploadHandler({
        maxPartSize: 10_000_000,
      });
      const formData = await unstable_parseMultipartFormData(
        request,
        uploadHandler,
      );
      const file = formData.get("file");
      const data = JSON.parse(formData.get("data") as string);
      const result = await UploadImageToImageKit(file as File);
      if (request.method === "POST") {
        await addGallery({
          title: data.title,
          hotspots: data.hotspots,
          imageUrl: result.url,
          idImage: result.fileId,
        });
        return "created success";
      }
      if (request.method === "PUT") {
        await Promise.all([
          DeleteImageFromImageKit(data.idImg),
          editGalleryById({
            id: params.id as string,
            title: data.title,
            imageUrl: result.url,
            idImage: result.fileId,
            hotspots: data.hotspots,
          }),
        ]);
        return "updated success";
      }
    }
    if (request.method === "DELETE") {
      const formData = await request.formData();
      const idImg = formData.get("idImg");
      await Promise.all([
        DeleteImageFromImageKit(idImg as string),
        deleteGalleryById(params.id as string),
      ]);
      return redirect("/app");
    }
  } catch (err) {
    console.error("ImageKit Upload Error", err);
    return Response.json({ error: "Failed to upload image" }, { status: 500 });
  }
};

export default function Gallery() {
  const gallery = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [acceptNavigate, setAcceptNavigate] = useState(true);
  const { galleryNew, untilVariable, setGallery, resetGallery } =
    useGalleryStore();

  const handleUpload = () => {
    if (!galleryNew.file) return;
    if (!galleryNew.title?.trim()) {
      setGallery({ error: { title: "Title is required" } });
      return;
    }
    const formData = new FormData();
    formData.append("file", galleryNew.file);
    const data = {
      title: galleryNew.title,
      hotspots: (galleryNew.hotspots ?? []).map((h) => ({
        x: h.x,
        y: h.y,
        title: h.label,
        img: h.img,
        productId: h.id,
      })),
      idImg: gallery.data.idImage,
    };
    formData.append("data", JSON.stringify(data));
    fetcher.submit(formData, {
      method: gallery.page === "new" ? "post" : "put",
      encType: "multipart/form-data",
    });
    shopify.loading(true);
  };

  const handleDeleteGallery = () => {
    const formData = new FormData();
    formData.append("idImg", gallery.data.idImage as string);
    fetcher.submit(formData, { method: "delete" });
    shopify.loading(true);
    shopify.modal.hide("modal-custom");
  };

  const handleDiscard = () => {
    if (gallery.page === "edit") {
      const hotspots = gallery.data.hotspots.map((h: IHotspot) => ({
        id: h.productId,
        x: h.x,
        y: h.y,
        saved: true,
        label: h.title,
        img: h.img,
      }));
      setGallery({ hotspots: hotspots });
    } else {
      setGallery({ hotspots: [] });
    }
    setGallery({ title: gallery.data.title });
    shopify.saveBar.hide("save-bar-custom");
  };

  const argOfPage = {
    title: "Gallery Page",
    backAction: {
      onAction: () => {
        if (acceptNavigate) navigate("/app");
      },
    },
  };

  useEffect(() => {
    resetGallery();
  }, []);

  useEffect(() => {
    if (navigation.state === "loading" || fetcher.state !== "idle") {
      shopify.loading(true);
    } else {
      shopify.loading(false);
    }
    if (fetcher.data === "updated success") navigate("/app");
    if (fetcher.data === "created success") navigate("/app");
    if (fetcher.state === "loading") {
      if (
        fetcher.state === "loading" &&
        fetcher.data !== "created success" &&
        fetcher.data !== "updated success"
      ) {
        shopify.toast.show("deleted success");
      } else {
        shopify.toast.show(fetcher.data as string);
      }
    }
  }, [fetcher.data, navigation.state, fetcher.state]);

  return (
    <Page
      title="Gallery Page"
      backAction={argOfPage.backAction}
      secondaryActions={
        gallery.page === "edit" ? (
          <Button
            tone="critical"
            onClick={() => {
              shopify.modal.show("modal-custom");
            }}
          >
            Delete Gallery
          </Button>
        ) : (
          []
        )
      }
    >
      {galleryNew.file || (gallery.page === "edit" && untilVariable) ? (
        <GalleryUpdate gallery={gallery} />
      ) : (
        <GalleryAdd />
      )}
      <ModalCustom
        text={{
          titleModal: "Delete Products",
          titleMain: `Are you want to delete this product`,
          titleAction: "Delete",
        }}
        handleCancle={() => shopify.modal.hide("modal-custom")}
        handleMain={handleDeleteGallery}
      />
      <SaveBar
        id="save-bar-custom"
        onShow={() => setAcceptNavigate(false)}
        onHide={() => setAcceptNavigate(true)}
      >
        <button
          variant="primary"
          onClick={() => {
            handleUpload();
            shopify.saveBar.hide("save-bar-custom");
          }}
        />
        <button onClick={handleDiscard} />
      </SaveBar>
    </Page>
  );
}
