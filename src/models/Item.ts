import mongoose, { Schema, Document } from "mongoose";

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস (সবার উপরে থাকবে)
export interface IItem extends Document {
  title: string;
  shortDesc: string;
  fullDesc: string;
  budget: number;
  location: string;
  category: string;
  imageUrl?: string;
}

// ২. মঙ্গুজ স্কিমা (মাঝখানে থাকবে)
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

// ৩. মডেল এক্সপোর্ট (সবার শেষে একবারই থাকবে)
export const Item =
  mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);
