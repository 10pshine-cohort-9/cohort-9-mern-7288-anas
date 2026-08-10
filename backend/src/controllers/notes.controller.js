import fs from "fs";
import mongoose, { isValidObjectId } from "mongoose";
import { Note } from "../models/note.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

/**
 * @desc    Create a new note
 * @route   POST /api/v1/notes
 * @access  Private (Protected with verifyJWT)
 */
const createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!title || title.trim() === "") {
    throw new ApiError(400, "Title is required");
  }

  const note = await Note.create({
    title: title.trim(),
    content: content || "",
    owner: req.user?._id,
  });

  if (!note) {
    throw new ApiError(500, "Something went wrong while creating the note");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, note, "Note created successfully"));
});

/**
 * @desc    Get all notes for logged-in user with pagination and optional search
 * @route   GET /api/v1/notes
 * @access  Private (Protected with verifyJWT)
 */
const getUserNotes = asyncHandler(async (req, res) => {
  const {
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const query = {
    owner: req.user?._id,
  };

  if (search && search.trim() !== "") {
    query.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { content: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNumber - 1) * limitNumber;
  const sortDirection = sortType === "asc" ? 1 : -1;

  const [notes, totalNotes] = await Promise.all([
    Note.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limitNumber),
    Note.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalNotes / limitNumber);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notes,
        totalNotes,
        page: pageNumber,
        totalPages,
        limit: limitNumber,
      },
      "User notes fetched successfully",
    ),
  );
});

/**
 * @desc    Get a single note by ID
 * @route   GET /api/v1/notes/:noteId
 * @access  Private (Protected with verifyJWT)
 */
const getNoteById = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  if (!isValidObjectId(noteId)) {
    throw new ApiError(400, "Invalid note ID");
  }

  const note = await Note.findById(noteId);

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  if (note.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to view this note");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note retrieved successfully"));
});

/**
 * @desc    Update/Edit an existing note
 * @route   PATCH /api/v1/notes/:noteId
 * @access  Private (Protected with verifyJWT)
 */
const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { title, content } = req.body;

  if (!isValidObjectId(noteId)) {
    throw new ApiError(400, "Invalid note ID");
  }

  if (!title && content === undefined) {
    throw new ApiError(
      400,
      "At least one field (title or content) is required to update",
    );
  }

  const note = await Note.findById(noteId);

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  if (note.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to edit this note");
  }

  if (title !== undefined) {
    if (title.trim() === "") {
      throw new ApiError(400, "Title cannot be empty");
    }
    note.title = title.trim();
  }

  if (content !== undefined) {
    note.content = content;
  }

  await note.save();

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note updated successfully"));
});

/**
 * @desc    Delete a note
 * @route   DELETE /api/v1/notes/:noteId
 * @access  Private (Protected with verifyJWT)
 */
const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  if (!isValidObjectId(noteId)) {
    throw new ApiError(400, "Invalid note ID");
  }

  const note = await Note.findById(noteId);

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  if (note.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this note");
  }

  await Note.findByIdAndDelete(noteId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Note deleted successfully"));
});

/**
 * @desc    Upload an image inline for rich text editor (Notion-like)
 *          Saves temporarily via Multer -> Uploads to Cloudinary -> Deletes local temp file
 * @route   POST /api/v1/notes/upload-image
 * @access  Private (Protected with verifyJWT, upload.single("image"))
 */
const uploadNoteImage = asyncHandler(async (req, res) => {
  const localFilePath = req.file?.path;

  if (!localFilePath) {
    throw new ApiError(400, "Image file is required");
  }

  try {
    const uploadedImage = await uploadOnCloudinary(localFilePath);

    // Delete local temporary file once uploaded to Cloudinary
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    if (!uploadedImage || !uploadedImage.url) {
      throw new ApiError(500, "Failed to upload image to Cloudinary");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          url: uploadedImage.secure_url || uploadedImage.url,
          public_id: uploadedImage.public_id,
        },
        "Image uploaded successfully",
      ),
    );
  } catch (error) {
    // Ensure local file is cleaned up in case of an error
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error instanceof ApiError
      ? error
      : new ApiError(500, error?.message || "Error while uploading image");
  }
});

/**
 * @desc    Delete an image from Cloudinary (optional cleanup when removed from rich text)
 * @route   DELETE /api/v1/notes/delete-image
 * @access  Private (Protected with verifyJWT)
 */
const deleteNoteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;

  if (!publicId || publicId.trim() === "") {
    throw new ApiError(400, "Public ID is required");
  }

  const result = await deleteFromCloudinary(publicId.trim());

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Image deleted from Cloudinary successfully",
      ),
    );
});

export {
  createNote,
  getUserNotes,
  getNoteById,
  updateNote,
  deleteNote,
  uploadNoteImage,
  deleteNoteImage,
};
