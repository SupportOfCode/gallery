import mongoose from "mongoose";

const MONGO_URL = process.env.MONGO_URL as string;

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};
