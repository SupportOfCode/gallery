import mongoose from "mongoose";
import { connectDB } from "app/db.server";
import Gallery from "app/model/Gallery.model.server";
import type { IHotspot } from "app/model/Gallery.model.server";
import type { FilterQuery, PipelineStage } from "mongoose";

connectDB();

type ParamsGetGalleries = {
  title?: string;
  dateOfPicker?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

type ParamsAddGallery = {
  title: string;
  imageUrl?: string;
  idImage?: string;
  hotspots?: Omit<IHotspot, "_id">[];
};

type ParamsEditGallery = {
  id: string;
  title?: string;
  imageUrl?: string;
  idImage?: string;
  hotspots?: IHotspot[];
};

type ParamsAddHotspot = {
  galleryId: string;
  hotspot: Omit<IHotspot, "_id">;
};

export const getGalleries = async (params: ParamsGetGalleries) => {
  try {
    const filter = {} as FilterQuery<GalleryType>;
    const [fromDate, toDate] = (
      params.dateOfPicker?.trim() === "" ? "->" : (params.dateOfPicker ?? "->")
    ).split("->");

    if (params?.title) {
      filter.title = { $regex: params.title, $options: "i" };
    }
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        const data = new Date(toDate);
        data.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = data;
      }
    }

    // Sort logic
    let sortOption: Record<string, 1 | -1> = {};
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

    const page = params.page ?? 1;
    const limit = params.limit ?? 5;

    const total = await Gallery.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    // Aggregate query
    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $addFields: {
          hotspotCount: { $size: "$hotspots" },
        },
      },
    ];

    if (Object.keys(sortOption).length > 0) {
      pipeline.push({ $sort: sortOption as PipelineStage.Sort["$sort"] });
    }

    pipeline.push(
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          imageUrl: 1,
          hotspots: 1,
          createdAt: 1,
          updatedAt: 1,
          hotspotCount: 1,
        },
      },
    );
    const data = await Gallery.aggregate(pipeline).exec();
    return {
      data,
      total,
      currentPage,
      totalPages,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Something went wrong when getting galleries: " + error.message,
      );
    }
  }
};

export const getGalleryById = async (id: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid gallery ID format");
    }
    const gallery = await Gallery.findById(id).lean();
    if (!gallery) {
      throw new Error("Gallery not found");
    }
    return gallery;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Error fetching gallery by ID: " + error.message);
    }
  }
};

export const addGallery = async ({
  title,
  imageUrl,
  idImage,
  hotspots = [],
}: ParamsAddGallery) => {
  try {
    const newGallery = await Gallery.create({
      title,
      imageUrl,
      idImage,
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

export const editGalleryById = async (params: ParamsEditGallery) => {
  try {
    const { id, title, imageUrl, idImage, hotspots } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid gallery ID format");
    }
    const updateData: Partial<ParamsEditGallery> = {};
    if (title !== undefined) updateData.title = title;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (idImage !== undefined) updateData.idImage = idImage;
    if (hotspots !== undefined) updateData.hotspots = hotspots;

    const updatedGallery = await Gallery.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).lean();

    if (!updatedGallery) {
      throw new Error("Gallery not found");
    }

    return updatedGallery;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Failed to edit gallery: " + error.message);
    }
    throw error;
  }
};

export const deleteGalleryById = async (id: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid gallery ID format");
    }

    const result = await Gallery.findByIdAndDelete(id);

    if (!result) {
      throw new Error("Gallery not found");
    }

    return "Delete successfully";
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Something went wrong when deleting the gallery:\n" + error.message,
      );
    }
    throw error;
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
