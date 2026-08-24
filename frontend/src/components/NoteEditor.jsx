import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  fetchNoteById,
  updateNote,
  deleteNoteImage,
} from "../store/notesSlice.js";
import axiosInstance from "../utils/axiosInstance.js";

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "code-block",
  "color",
  "background",
  "link",
  "image",
];

/**
 * Extract Cloudinary publicId from a given image URL
 * Handles version paths, nested folders, and transformations
 */
const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;

  try {
    const regex =
      /\/image\/upload\/(?:[a-zA-Z0-9_,-]+\/)*(?:v\d+\/)?([^.?#]+)(?:\.[a-zA-Z0-9]+)?/;
    const match = url.match(regex);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }

    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const uploadIndex = pathname.indexOf("/upload/");
    if (uploadIndex !== -1) {
      let rest = pathname.substring(uploadIndex + "/upload/".length);
      rest = rest.replace(/^v\d+\//, "");
      const lastDot = rest.lastIndexOf(".");
      if (lastDot !== -1) {
        rest = rest.substring(0, lastDot);
      }
      return rest ? decodeURIComponent(rest) : null;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Parses an HTML string and returns a Map of image URL -> occurrence count
 */
const getImageUrlsMap = (html) => {
  const map = new Map();
  if (!html || typeof html !== "string") return map;
  const imgRegex = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (src) {
      map.set(src, (map.get(src) || 0) + 1);
    }
  }
  return map;
};

const NoteEditorForm = ({ note }) => {
  const dispatch = useDispatch();

  const { isSaving } = useSelector((state) => state.notes);

  // Local state for title, content, and save status
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Image upload state & error toast
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const quillRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const saveRequestIdRef = useRef(0);

  // Ref tracking current image URLs present in editor
  const currentImagesRef = useRef(getImageUrlsMap(note?.content || ""));
  const savedImagesRef = useRef(getImageUrlsMap(note?.content || ""));

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (note?.content) {
      currentImagesRef.current = getImageUrlsMap(note.content);
      savedImagesRef.current = getImageUrlsMap(note.content);
    }
  }, [note]);

  const showErrorToast = useCallback((message, duration = 5000) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setErrorToast(message);
    if (duration > 0) {
      toastTimeoutRef.current = setTimeout(() => {
        setErrorToast(null);
      }, duration);
    }
  }, []);

  const performSave = useCallback(
    async (overrideTitle, overrideContent) => {
      if (!note?._id) return;

      const titleToSave =
        (overrideTitle !== undefined
          ? overrideTitle
          : titleRef.current
        )?.trim() || "Untitled";
      const contentToSave =
        overrideContent !== undefined
          ? overrideContent
          : (contentRef.current ?? "");

      const requestId = ++saveRequestIdRef.current;

      setSaveStatus("saving");
      try {
        await dispatch(
          updateNote({
            noteId: note._id,
            title: titleToSave,
            content: contentToSave,
          }),
        ).unwrap();

        if (saveRequestIdRef.current !== requestId) {
          return;
        }

        // Compare the persisted snapshot against the content just confirmed by the server
        const savedMap = getImageUrlsMap(contentToSave);
        for (const [oldUrl] of savedImagesRef.current) {
          if (!savedMap.has(oldUrl)) {
            const publicId = extractCloudinaryPublicId(oldUrl);
            if (publicId) {
              dispatch(deleteNoteImage({ publicId }))
                .unwrap()
                .catch((err) =>
                  console.error(
                    `Failed to delete orphaned image (${publicId}):`,
                    err,
                  ),
                );
            }
          }
        }
        savedImagesRef.current = savedMap;

        setSaveStatus("saved");
        setLastSavedAt(new Date());
      } catch (err) {
        // If superseded by a newer save, do not display error for this stale dispatch
        if (saveRequestIdRef.current === requestId) {
          console.error("Failed to update note:", err);
          setSaveStatus("error");
        }
      }
    },
    [dispatch, note],
  );

  // Flush any pending save, then clear timers on unmount.
  const performSaveRef = useRef(null);
  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        performSaveRef.current?.(titleRef.current, contentRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Warn before browser navigation/tab close if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === "unsaved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveStatus]);

  const triggerDebouncedSave = useCallback(
    (newTitle, newContent) => {
      setSaveStatus("unsaved");
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        performSave(newTitle, newContent);
      }, 10000);
    },
    [performSave],
  );

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    titleRef.current = newTitle;
    setTitle(newTitle);
    triggerDebouncedSave(newTitle, contentRef.current);
  };

  /**
   * Handle content change
   */
  const handleContentChange = useCallback(
    (value) => {
      const newImagesMap = getImageUrlsMap(value);
      currentImagesRef.current = newImagesMap;
      contentRef.current = value;
      setContent(value);
      triggerDebouncedSave(titleRef.current, value);
    },
    [triggerDebouncedSave],
  );

  const handleManualSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSave(titleRef.current, contentRef.current);
  }, [performSave]);

  // Global keyboard shortcut: Ctrl+S / Cmd+S for manual save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleManualSave]);

  /**
   * Custom Image Upload Handler for React Quill
   */
  const imageHandler = useCallback(() => {
    if (!note?._id) {
      showErrorToast("Cannot upload image: Note is not loaded yet");
      return;
    }

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showErrorToast(
          "Please select a valid image file (PNG, JPEG, WebP, GIF, etc.)",
        );
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showErrorToast("Image size exceeds 10MB limit");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("noteId", note._id);

      setIsUploadingImage(true);

      try {
        const response = await axiosInstance.post(
          "/notes/upload-image",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const uploadedUrl = response.data?.data?.url || response.data?.url;

        if (!uploadedUrl) {
          throw new Error("Image URL was not returned by server");
        }

        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection(true) || {
            index: editor.getLength(),
          };
          const insertIndex = range.index ?? editor.getLength();
          editor.insertEmbed(insertIndex, "image", uploadedUrl);
          editor.setSelection(insertIndex + 1);

          const updatedHtml = editor.root.innerHTML;
          // Update images map with newly inserted image
          currentImagesRef.current = getImageUrlsMap(updatedHtml);
          setContent(updatedHtml);
          triggerDebouncedSave(titleRef.current, updatedHtml);
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to upload image. Please try again.";
        showErrorToast(errorMessage, 5000);
      } finally {
        setIsUploadingImage(false);
      }
    };
  }, [note, showErrorToast, triggerDebouncedSave]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          [{ color: [] }, { background: [] }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [imageHandler],
  );

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 sm:px-12 md:px-16 py-2 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center space-x-2 text-xs text-zinc-400 dark:text-zinc-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/80" />
          <span>Notion Editor</span>
          {lastSavedAt && (
            <>
              <span>•</span>
              <span>Saved at {formatTime(lastSavedAt)}</span>
            </>
          )}
        </div>

        {/* Single Consolidated Status Indicator & Manual Save Actions */}
        <div className="flex items-center space-x-2">
          {isUploadingImage ? (
            <div className="flex items-center space-x-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              <svg
                className="w-3.5 h-3.5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Uploading Image...</span>
            </div>
          ) : saveStatus === "saving" || isSaving ? (
            <div className="flex items-center space-x-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <svg
                className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Saving...</span>
            </div>
          ) : saveStatus === "unsaved" ? (
            <button
              type="button"
              onClick={handleManualSave}
              title="Save changes now (Ctrl+S)"
              className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              <span>Save</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono bg-indigo-700/80 px-1 py-0.2 rounded">
                Ctrl+S
              </kbd>
            </button>
          ) : saveStatus === "error" ? (
            <button
              type="button"
              onClick={handleManualSave}
              title="Retry saving note (Ctrl+S)"
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Retry Save</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono bg-red-200 dark:bg-red-800/60 px-1 py-0.2 rounded">
                Ctrl+S
              </kbd>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-xs text-zinc-400 dark:text-zinc-500">
                <svg
                  className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Saved</span>
              </div>
              <button
                type="button"
                onClick={handleManualSave}
                title="Save now (Ctrl+S)"
                className="flex items-center space-x-1 px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                <span>Save</span>
                <kbd className="hidden sm:inline-block text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                  Ctrl+S
                </kbd>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Toast Notification (Only shown on errors) */}
      {errorToast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-medium bg-red-600 text-white border border-red-500 shadow-red-950/20 animate-in fade-in slide-in-from-bottom-2"
          role="alert"
          aria-live="assertive"
        >
          <svg
            className="w-4 h-4 shrink-0 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="pr-1">{errorToast}</span>
          <button
            onClick={() => setErrorToast(null)}
            className="p-1 hover:bg-white/20 rounded transition-colors cursor-pointer"
            aria-label="Dismiss error"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Document Canvas (The Canvas: max-w-3xl mx-auto w-full pt-10 px-8) */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto w-full pt-10 px-8 pb-32">
          {/* Borderless Title Input: Massive tracking-tight H1 */}
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Note"
              className="w-full bg-transparent text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 placeholder-slate-300 border-none outline-none focus:outline-none focus:ring-0 p-0 transition-colors"
              aria-label="Note title"
            />
          </div>

          {/* Minimal Rich Text Toolbar & Text Area */}
          <div className="notion-quill-wrapper text-slate-700 text-lg leading-relaxed">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={modules}
              formats={quillFormats}
              placeholder="Start typing your note here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const NoteEditor = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { notes, activeNote, isLoading, error } = useSelector(
    (state) => state.notes,
  );

  const existingNote = notes.find((n) => n._id === noteId);

  // Fetch if note is not present in Redux notes array or activeNote
  useEffect(() => {
    if (noteId && !existingNote && activeNote?._id !== noteId) {
      dispatch(fetchNoteById(noteId));
    }
  }, [noteId, existingNote, activeNote, dispatch]);

  const currentNote =
    existingNote || (activeNote?._id === noteId ? activeNote : null);

  // Skeleton Loader when note is fetching
  if (isLoading && !currentNote) {
    return (
      <div className="max-w-4xl mx-auto px-6 sm:px-12 md:px-16 pt-8 pb-20 animate-pulse">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4 mb-6" />
        <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-md w-full mb-8" />
        <div className="space-y-3">
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6" />
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-4/6" />
        </div>
      </div>
    );
  }

  // Not Found State
  if (!currentNote && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl mb-4">
          🔍
        </div>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">
          Note not found
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm">
          {error ||
            "The note you are trying to view does not exist or you do not have permission to access it."}
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <NoteEditorForm key={currentNote._id} note={currentNote} />;
};

export default NoteEditor;
