import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createNote,
  getUserNotes,
  getNoteById,
  updateNote,
  deleteNote,
  uploadNoteImage,
  deleteNoteImage,
} from "../controllers/notes.controller.js";

const router = Router();

// Apply verifyJWT to all note endpoints as they are private/secured
router.use(verifyJWT);

// Routes for notes collection
router.route("/").get(getUserNotes).post(createNote);

// Notion-like inline rich text image upload & delete endpoints
router.route("/upload-image").post(upload.single("image"), uploadNoteImage);
router.route("/delete-image").delete(deleteNoteImage);

// Routes for individual note by ID
router.route("/:noteId").get(getNoteById).patch(updateNote).delete(deleteNote);

export default router;
