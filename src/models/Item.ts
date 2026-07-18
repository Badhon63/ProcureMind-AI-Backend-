import mongoose, { Schema, Document } from "mongoose";

export interface IItem extends Document {
  title: string;
  shortDesc: string;
  fullDesc: string;
  budget: number;
  location: string;
  category: string;
  imageUrl?: string;
}

const ItemSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    shortDesc: { type: String, required: true },
    fullDesc: { type: String, required: true },
    budget: { type: Number, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true },
    imageUrl: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Item ||
  mongoose.model<IItem>("Item", ItemSchema);
