import { Document, Model, Schema, model } from "mongoose";

export type PageSlug = "about" | "help" | "support" | "faq";

export interface IPageContent extends Document {
  slug: PageSlug;
  title: string;
  content: string; // plain text for about/help/support; JSON string for faq
  updatedBy?: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IPageContentModel extends Model<IPageContent> {}

const pageContentSchema = new Schema<IPageContent>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ["about", "help", "support", "faq"],
      index: true,
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const PageContent = model<IPageContent, IPageContentModel>("PageContent", pageContentSchema);
