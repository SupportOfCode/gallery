import { connectDB } from "app/db.server";
import Gallery, { IHotspot } from "app/model/Gallery.model.server";
import { FilterQuery } from "mongoose";

connectDB();

type ParamsGetGalleries = {
  title: string;
  fromDate: string;
  toDate: string;
  sort: string;
};

type ParamsAddGallery = {
  title: string;
  imageUrl?: string;
  hotspots?: Omit<IHotspot, "_id">[];
};

type ParamsAddHotspot = {
  galleryId: string;
  hotspot: Omit<IHotspot, "_id">;
};

export const getGalleries = async (params: ParamsGetGalleries) => {
  try {
    const filter: FilterQuery<GalleryType> = {};
    if (params?.title) {
      filter.title = { $regex: params.title, $options: "i" };
    }
    if (params?.fromDate || params?.toDate) {
      filter.createdAt = {};
      if (params.fromDate) {
        filter.createdAt.$gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        filter.createdAt.$lte = new Date(params.toDate);
      }
    }

    let sortOption: Record<string, 1 | -1> = {};
    if (params.sort) {
      switch (params.sort) {
        case "gallery asc":
          sortOption = { title: 1 };
          break;
        case "gallery desc":
          sortOption = { title: -1 };
          break;
        case "date asc":
          sortOption = { createdAt: 1 };
          break;
        case "date desc":
          sortOption = { createdAt: -1 };
          break;
        case "Hotspot asc":
          sortOption = { hotspotCount: 1 };
          break;
        case "Hotspot desc":
          sortOption = { hotspotCount: -1 };
          break;
        default:
          sortOption = {};
      }
    }
    return (await Gallery.find(filter).sort(sortOption).lean()).reverse();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Some thing went wrong when you get galleries" + error.message,
      );
    }
  }
};

export const addGallery = async ({
  title,
  imageUrl,
  hotspots = [],
}: ParamsAddGallery) => {
  try {
    const newGallery = await Gallery.create({
      title,
      imageUrl,
      hotspots,
    });

    return newGallery;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Something went wrong while adding gallery: " + error.message,
      );
    }
  }
};

export const deleteGalleries = async (ids: string[]) => {
  try {
    await Gallery.deleteMany({ _id: { $in: ids } });
    return "Delete successfully";
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Some thing went wrong when you delete galleries  /n" + error.message,
      );
    }
  }
};

export const getAllHotspots = async (galleryId: string) => {
  try {
    const gallery = await Gallery.findById(galleryId).select("hotspots").lean();

    if (!gallery) {
      throw new Error("Gallery not found");
    }

    return gallery.hotspots;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Something went wrong while getting hotspots: " + error.message,
      );
    }
  }
};

export const addHotspotToGallery = async ({
  galleryId,
  hotspot,
}: ParamsAddHotspot) => {
  try {
    const updatedGallery = await Gallery.findByIdAndUpdate(
      galleryId,
      { $push: { hotspots: hotspot } },
      { new: true, runValidators: true },
    ).lean();

    if (!updatedGallery) {
      throw new Error("Gallery not found");
    }

    return updatedGallery;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Something went wrong when adding hotspot to gallery:\n" +
          error.message,
      );
    }
  }
};

export const updateHotspot = async (
  galleryId: string,
  hotspotId: string,
  hotspotData: Partial<IHotspot>,
) => {
  try {
    const result = await Gallery.findOneAndUpdate(
      { _id: galleryId, "hotspots._id": hotspotId },
      {
        $set: {
          "hotspots.$.x": hotspotData.x,
          "hotspots.$.y": hotspotData.y,
          "hotspots.$.title": hotspotData.title,
          "hotspots.$.img": hotspotData.img,
          "hotspots.$.productId": hotspotData.productId,
        },
      },
      { new: true, runValidators: true },
    );

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Something went wrong while updating the hotspot: " + error.message,
      );
    }
  }
};

export const deleteHotspot = async (galleryId: string, hotspotId: string) => {
  try {
    const result = await Gallery.findByIdAndUpdate(
      galleryId,
      {
        $pull: {
          hotspots: { _id: hotspotId },
        },
      },
      { new: true },
    );

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Something went wrong while deleting the hotspot: " + error.message,
      );
    }
  }
};
