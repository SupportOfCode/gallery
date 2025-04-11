import mongoose, { Schema, Document } from "mongoose";

export interface IHotspot extends Document {
  x: number;
  y: number;
  productId: string;
  title: string;
  img: string;
}

export interface IGallery extends Document {
  title: string;
  imageUrl: string;
  hotspots: IHotspot[];
}

const HotspotSchema: Schema<IHotspot> = new Schema({
  x: { type: Number },
  y: { type: Number },
  title: { type: String },
  img: { type: String },
  productId: { type: String },
});

const GallerySchema: Schema<IGallery> = new Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String },
    hotspots: [HotspotSchema],
  },
  { timestamps: true },
);

export default mongoose.model<IGallery>("Gallery", GallerySchema);
