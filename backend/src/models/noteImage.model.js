import mongoose, { Schema } from "mongoose";

const noteImageSchema = new Schema(
  {
    publicId: {
      type: String,
      required: [true, "Public ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    url: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      index: true,
    },
  },
  { timestamps: true },
);

export const NoteImage = mongoose.model("NoteImage", noteImageSchema);
