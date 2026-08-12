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


router.use(verifyJWT);


router.route("/").get(getUserNotes).post(createNote);


router.route("/upload-image").post(upload.single("image"), uploadNoteImage);
router.route("/delete-image").delete(deleteNoteImage);


router.route("/:noteId").get(getNoteById).patch(updateNote).delete(deleteNote);

export default router;
