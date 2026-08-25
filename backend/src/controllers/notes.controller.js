import fs from "fs";
import mongoose, { isValidObjectId } from "mongoose";
import { Note } from "../models/note.model.js";
import { NoteImage } from "../models/noteImage.model.js";
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

  if (typeof title !== "string" || title.trim() === "") {
    throw new ApiError(400, "Title is required");
  }

  try {
    const note = await Note.create({
      title: title.trim(),
      content: content || "",
      owner: req.user?._id,
      version: 1,
    });

    if (!note) {
      throw new ApiError(500, "Something went wrong while creating the note");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, note, "Note created successfully"));
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error?.message || "Something went wrong while creating the note",
        );
  }
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

  if (search && typeof search === "string" && search.trim() !== "") {
    // Sanitize, cap length, and escape regex metacharacters to prevent ReDoS / backtracking attacks
    const sanitizedSearch = search
      .trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (sanitizedSearch) {
      query.$or = [
        { title: { $regex: sanitizedSearch, $options: "i" } },
        { content: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNumber - 1) * limitNumber;
  const sortDirection = sortType === "asc" ? 1 : -1;

  try {
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
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error?.message || "Something went wrong while fetching notes",
        );
  }
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

  try {
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
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error?.message || "Something went wrong while retrieving the note",
        );
  }
});

/**
 * @desc    Update/Edit an existing note
 * @route   PATCH /api/v1/notes/:noteId
 * @access  Private (Protected with verifyJWT)
 */
const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { title, content, revision, version } = req.body;

  if (!isValidObjectId(noteId)) {
    throw new ApiError(400, "Invalid note ID");
  }

  if (title === undefined && content === undefined) {
    throw new ApiError(
      400,
      "At least one field (title or content) is required to update",
    );
  }

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new ApiError(400, "Title must be a non-empty string");
    }
  }

  try {
    const existingNote = await Note.findById(noteId);

    if (!existingNote) {
      throw new ApiError(404, "Note not found");
    }

    if (existingNote.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not authorized to edit this note");
    }

    const incomingRevision = revision ?? version;
    const currentVersion = existingNote.version ?? 0;

    if (incomingRevision !== undefined && incomingRevision !== null) {
      const incomingRevNum = Number(incomingRevision);
      if (
        isNaN(incomingRevNum) ||
        !Number.isInteger(incomingRevNum) ||
        incomingRevNum !== currentVersion + 1
      ) {
        throw new ApiError(
          409,
          "Stale write rejected: revision must advance by one",
        );
      }
    }

    const targetVersion =
      incomingRevision !== undefined && incomingRevision !== null
        ? Number(incomingRevision)
        : currentVersion + 1;

    const updateFields = {
      version: targetVersion,
    };

    if (title !== undefined) {
      updateFields.title = title.trim();
    }

    if (content !== undefined) {
      updateFields.content = content;
    }

    // Atomic update query
    const query = {
      _id: noteId,
      owner: req.user?._id,
      $or: [
        { version: currentVersion },
        { version: { $exists: false } },
      ],
    };

    const updatedNote = await Note.findOneAndUpdate(
      query,
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!updatedNote) {
      throw new ApiError(
        409,
        "Stale write rejected: note was updated concurrently with a newer revision",
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedNote, "Note updated successfully"));
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error?.message || "Something went wrong while updating the note",
        );
  }
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

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      throw new ApiError(404, "Note not found");
    }

    if (note.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not authorized to delete this note");
    }

    // 1. Find all associated image records for this note
    const associatedImages = await NoteImage.find({ note: noteId });

    // 2. Delete each associated image from Cloudinary
    if (associatedImages.length > 0) {
      const successfulImageIds = [];

      await Promise.allSettled(
        associatedImages.map(async (image) => {
          try {
            if (image.publicId) {
              const result = await deleteFromCloudinary(image.publicId);
              if (
                result &&
                (result.result === "ok" || result.result === "not found")
              ) {
                successfulImageIds.push(image._id);
              } else {
                console.error(
                  `Cloudinary deletion failed or returned non-success result for image ${image.publicId}:`,
                  result,
                );
              }
            } else {
              successfulImageIds.push(image._id);
            }
          } catch (cloudinaryError) {
            console.error(
              `Failed to delete image ${image.publicId} from Cloudinary:`,
              cloudinaryError,
            );
          }
        }),
      );

      // 3. Delete only NoteImage records whose Cloudinary deletion succeeded from MongoDB
      if (successfulImageIds.length > 0) {
        await NoteImage.deleteMany({ _id: { $in: successfulImageIds } });
      }
    }

    // 4. Delete the note document
    await Note.findByIdAndDelete(noteId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Note deleted successfully"));
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error?.message || "Something went wrong while deleting the note",
        );
  }
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

  const { noteId } = req.body;

  try {
    const uploadedImage = await uploadOnCloudinary(localFilePath);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    if (!uploadedImage || !uploadedImage.url) {
      throw new ApiError(500, "Failed to upload image to Cloudinary");
    }

    const imageRecord = await NoteImage.create({
      publicId: uploadedImage.public_id,
      url: uploadedImage.secure_url || uploadedImage.url,
      owner: req.user?._id,
      ...(noteId && isValidObjectId(noteId) ? { note: noteId } : {}),
    });

    if (!imageRecord) {
      throw new ApiError(500, "Failed to track uploaded image record");
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

  try {
    // Authorize deletion by checking tracked image ownership
    const imageRecord = await NoteImage.findOne({
      publicId: publicId.trim(),
    });

    if (!imageRecord) {
      throw new ApiError(404, "Image not found");
    }

    if (imageRecord.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not authorized to delete this image");
    }

    const result = await deleteFromCloudinary(publicId.trim());

    if (
      !result ||
      (result.result !== "ok" && result.result !== "not found")
    ) {
      throw new ApiError(500, "Failed to delete image from Cloudinary");
    }

    await NoteImage.findByIdAndDelete(imageRecord._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Image deleted from Cloudinary successfully",
        ),
      );
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(
          500,
          error?.message || "Error while deleting image from Cloudinary",
        );
  }
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
