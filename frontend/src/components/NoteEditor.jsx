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

/**
 * Custom hook to debounce state updates for autosave
 */
function useDebounce(value, delay = 1000) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Helper to check if note HTML content is functionally empty.
 * Returns true if content contains no images and text stripped of tags is empty.
 */
const isContentEmpty = (html) => {
  if (!html || typeof html !== "string") return true;
  if (/<img[^>]*>/i.test(html)) return false;
  const cleanText = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return cleanText.length === 0;
};

/**
 * Helper to strictly compare content strings, accounting for empty HTML tags.
 */
const isSameContent = (c1, c2) => {
  if (c1 === c2) return true;
  if (isContentEmpty(c1) && isContentEmpty(c2)) return true;
  return false;
};

/**
 * Stable format configuration defined outside component render function
 */
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
 */
const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const uploadIndex = pathname.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let rest = pathname.substring(uploadIndex + "/upload/".length);
    const segments = rest.split("/").filter(Boolean);

    const versionIndex = segments.findIndex((seg) => /^v\d+$/.test(seg));

    let publicIdSegments = [];
    if (versionIndex !== -1) {
      publicIdSegments = segments.slice(versionIndex + 1);
    } else {
      const firstNonTransformIndex = segments.findIndex(
        (seg) =>
          !/^[a-z]_[a-zA-Z0-9_,-]+$/.test(seg) &&
          !/^[a-zA-Z0-9_,-]+=[a-zA-Z0-9_,-]+$/.test(seg),
      );
      publicIdSegments =
        firstNonTransformIndex !== -1
          ? segments.slice(firstNonTransformIndex)
          : segments;
    }

    if (publicIdSegments.length === 0) return null;

    let fullPublicId = publicIdSegments.join("/");
    const lastDot = fullPublicId.lastIndexOf(".");
    if (lastDot !== -1) {
      fullPublicId = fullPublicId.substring(0, lastDot);
    }

    return fullPublicId ? decodeURIComponent(fullPublicId) : null;
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

  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [saveStatus, setSaveStatus] = useState("saved");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const [isAiAutocompleteEnabled, setIsAiAutocompleteEnabled] = useState(true);
  const [suggestion, setSuggestion] = useState("");
  const [suggestionBounds, setSuggestionBounds] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(null);

  const quillRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const saveRequestIdRef = useRef(0);

  const noteIdRef = useRef(note?._id);
  const lastSavedTitleRef = useRef(note?.title || "");
  const lastSavedContentRef = useRef(note?.content || "");

  const currentImagesRef = useRef(getImageUrlsMap(note?.content || ""));
  const savedImagesRef = useRef(getImageUrlsMap(note?.content || ""));
  const urlToPublicIdRef = useRef(new Map());

  const suggestionRef = useRef(suggestion);
  const cursorPositionRef = useRef(cursorPosition);

  // Debounce title and content for autosave
  const debouncedTitle = useDebounce(title, 1000);
  const debouncedContent = useDebounce(content, 1000);

  useEffect(() => {
    suggestionRef.current = suggestion;
  }, [suggestion]);

  useEffect(() => {
    cursorPositionRef.current = cursorPosition;
  }, [cursorPosition]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    noteIdRef.current = note?._id;
  }, [note?._id]);

  useEffect(() => {
    if (note?.content) {
      currentImagesRef.current = getImageUrlsMap(note.content);
      savedImagesRef.current = getImageUrlsMap(note.content);
    }
  }, [note?.content]);

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

  const showErrorToastRef = useRef(showErrorToast);
  useEffect(() => {
    showErrorToastRef.current = showErrorToast;
  }, [showErrorToast]);

  const getSafeEditor = useCallback(() => {
    try {
      if (!quillRef.current) return null;
      if (quillRef.current.editor) {
        return quillRef.current.editor;
      }
      if (typeof quillRef.current.getEditor === "function") {
        return quillRef.current.getEditor();
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  const getSafeEditorRef = useRef(getSafeEditor);
  useEffect(() => {
    getSafeEditorRef.current = getSafeEditor;
  }, [getSafeEditor]);

  const clearSuggestion = useCallback(() => {
    setSuggestion("");
    setSuggestionBounds(null);
    setCursorPosition(null);
    suggestionRef.current = "";
    cursorPositionRef.current = null;
  }, []);

  const acceptAiSuggestion = useCallback(() => {
    const currentSuggestion = suggestionRef.current;
    const cursorPos = cursorPositionRef.current;
    const editor = getSafeEditor();

    if (currentSuggestion && cursorPos !== null && editor) {
      editor.insertText(cursorPos, currentSuggestion, "user");
      editor.setSelection(cursorPos + currentSuggestion.length, 0, "user");

      const newContent = editor.root.innerHTML;
      contentRef.current = newContent;
      setContent(newContent);
      setSaveStatus("unsaved");

      clearSuggestion();
    }
  }, [getSafeEditor, clearSuggestion]);

  const handleToggleAiAutocomplete = useCallback(() => {
    setIsAiAutocompleteEnabled((prev) => {
      const nextState = !prev;
      if (!nextState) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        clearSuggestion();
      }
      return nextState;
    });
  }, [clearSuggestion]);

  const handleEditorKeyDownCapture = useCallback(
    (e) => {
      const isSuggestionActive = Boolean(suggestionRef.current);

      if (e.key === "Escape" && isSuggestionActive) {
        clearSuggestion();
        return;
      }

      if (e.key === "Tab" && isSuggestionActive) {
        e.preventDefault();
        e.stopPropagation();
        acceptAiSuggestion();
      }
    },
    [acceptAiSuggestion, clearSuggestion],
  );

  // Saves note content with guard clauses for empty/identical content
  const performSave = useCallback(
    async (overrideTitle, overrideContent) => {
      const noteId = noteIdRef.current;
      if (!noteId) return;

      const titleToSave =
        (overrideTitle !== undefined
          ? overrideTitle
          : titleRef.current
        )?.trim() || "Untitled";
      const contentToSave =
        overrideContent !== undefined
          ? overrideContent
          : (contentRef.current ?? "");

      // Guard Clause: skip network request if title and content are unchanged from last saved state
      const isTitleUnchanged = titleToSave === lastSavedTitleRef.current;
      const isContentUnchanged = isSameContent(
        contentToSave,
        lastSavedContentRef.current,
      );

      if (isTitleUnchanged && isContentUnchanged) {
        setSaveStatus("saved");
        return;
      }

      const requestId = ++saveRequestIdRef.current;
      setSaveStatus("saving");

      try {
        await dispatch(
          updateNote({
            noteId,
            title: titleToSave,
            content: contentToSave,
          }),
        ).unwrap();

        if (saveRequestIdRef.current !== requestId) return;

        lastSavedTitleRef.current = titleToSave;
        lastSavedContentRef.current = contentToSave;

        const savedMap = getImageUrlsMap(contentToSave);
        for (const [oldUrl] of savedImagesRef.current) {
          if (!savedMap.has(oldUrl)) {
            const publicId =
              urlToPublicIdRef.current.get(oldUrl) ||
              extractCloudinaryPublicId(oldUrl);
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
        if (saveRequestIdRef.current === requestId) {
          console.error("Failed to update note:", err);
          setSaveStatus("error");
        }
      }
    },
    [dispatch],
  );

  const performSaveRef = useRef(performSave);
  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  // Refactored autosave useEffect strictly comparing debounced values to last saved values
  useEffect(() => {
    const isTitleUnchanged = debouncedTitle === lastSavedTitleRef.current;
    const isContentUnchanged = isSameContent(
      debouncedContent,
      lastSavedContentRef.current,
    );

    if (!isTitleUnchanged || !isContentUnchanged) {
      performSave(debouncedTitle, debouncedContent);
    }
  }, [debouncedTitle, debouncedContent, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const isTitleUnchanged = titleRef.current === lastSavedTitleRef.current;
      const isContentUnchanged = isSameContent(
        contentRef.current,
        lastSavedContentRef.current,
      );
      if (!isTitleUnchanged || !isContentUnchanged) {
        performSaveRef.current?.(titleRef.current, contentRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    titleRef.current = newTitle;
    setTitle(newTitle);
    const isTitleUnchanged = newTitle === lastSavedTitleRef.current;
    const isContentUnchanged = isSameContent(
      contentRef.current,
      lastSavedContentRef.current,
    );
    if (!isTitleUnchanged || !isContentUnchanged) {
      setSaveStatus("unsaved");
    }
  };

  const handleContentChange = useCallback(
    (value, delta, source) => {
      if (suggestionRef.current) {
        clearSuggestion();
      }
      // Use value directly from ReactQuill instead of editor.root.innerHTML
      const updatedValue = value;
      const newImagesMap = getImageUrlsMap(updatedValue);
      currentImagesRef.current = newImagesMap;
      contentRef.current = updatedValue;
      setContent(updatedValue);

      const isTitleUnchanged = titleRef.current === lastSavedTitleRef.current;
      const isContentUnchanged = isSameContent(
        updatedValue,
        lastSavedContentRef.current,
      );
      if (!isTitleUnchanged || !isContentUnchanged) {
        setSaveStatus("unsaved");
      }

      if (source !== "user" || !isAiAutocompleteEnabled) return;
      const editor = getSafeEditor();
      if (!editor) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(async () => {
        const currentQuill = getSafeEditor();
        if (!currentQuill) return;

        try {
          const range = currentQuill.getSelection();
          if (!range) return;
          const currentPosition = range.index;

          const plainText = currentQuill.getText(0, currentPosition);
          const previousText = plainText.slice(-200);

          if (!previousText || !previousText.trim()) return;

          const response = await axiosInstance.post("/ai/autocomplete", {
            title: titleRef.current,
            previousText,
          });

          const suggestionText =
            response.data?.suggestion || response.data?.data?.suggestion;

          if (
            suggestionText &&
            typeof suggestionText === "string" &&
            suggestionText.trim()
          ) {
            const selection = currentQuill.getSelection();
            const activeIndex = selection ? selection.index : currentPosition;
            const bounds = currentQuill.getBounds(activeIndex);
            const containerTop = currentQuill.container?.offsetTop || 0;
            const containerLeft = currentQuill.container?.offsetLeft || 0;

            const calculatedBounds = {
              ...bounds,
              top: bounds.top + containerTop,
              left: bounds.left + containerLeft,
            };

            setSuggestion(suggestionText);
            setSuggestionBounds(calculatedBounds);
            setCursorPosition(activeIndex);
            suggestionRef.current = suggestionText;
            cursorPositionRef.current = activeIndex;
          }
        } catch (error) {
          console.error("AI Autocomplete fetch error:", error);
        }
      }, 1000);
    },
    [isAiAutocompleteEnabled, clearSuggestion, getSafeEditor],
  );

  const handleManualSave = useCallback(() => {
    performSave(titleRef.current, contentRef.current);
  }, [performSave]);

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

  // Image handler with empty dependency array using refs to prevent module re-creation
  const imageHandler = useCallback(() => {
    const noteId = noteIdRef.current;
    if (!noteId) {
      showErrorToastRef.current?.(
        "Cannot upload image: Note is not loaded yet",
      );
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
        showErrorToastRef.current?.(
          "Please select a valid image file (PNG, JPEG, WebP, GIF, etc.)",
        );
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showErrorToastRef.current?.("Image size exceeds 10MB limit");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("noteId", noteId);

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
        const publicId =
          response.data?.data?.public_id || response.data?.public_id;

        if (!uploadedUrl) {
          throw new Error("Image URL was not returned by server");
        }

        if (uploadedUrl && publicId) {
          urlToPublicIdRef.current.set(uploadedUrl, publicId);
        }

        const editor = getSafeEditorRef.current?.();
        if (editor) {
          const range = editor.getSelection(true) || {
            index: editor.getLength(),
          };
          const insertIndex = range.index ?? editor.getLength();
          editor.insertEmbed(insertIndex, "image", uploadedUrl);
          editor.setSelection(insertIndex + 1);

          const updatedHtml = editor.root.innerHTML;
          currentImagesRef.current = getImageUrlsMap(updatedHtml);
          contentRef.current = updatedHtml;
          setContent(updatedHtml);
          setSaveStatus("unsaved");
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to upload image. Please try again.";
        showErrorToastRef.current?.(errorMessage, 5000);
      } finally {
        setIsUploadingImage(false);
      }
    };
  }, []);

  // Memoized modules with stable reference across re-renders
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
      keyboard: {
        bindings: {
          tab: {
            key: 9,
            handler: function () {
              const currentSuggestion = suggestionRef.current;
              const cursorPos = cursorPositionRef.current;

              if (currentSuggestion && cursorPos !== null) {
                acceptAiSuggestion();
                return false;
              }
              return true;
            },
          },
        },
      },
    }),
    [imageHandler, acceptAiSuggestion],
  );

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
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

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleToggleAiAutocomplete}
            title={
              isAiAutocompleteEnabled
                ? "Click to disable AI Autocomplete"
                : "Click to enable AI Autocomplete"
            }
            className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
              isAiAutocompleteEnabled
                ? "bg-indigo-50/80 text-indigo-600 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shadow-xs"
                : "bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-500 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 ${
                isAiAutocompleteEnabled
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>
              AI Autocomplete:{" "}
              <span className="font-bold">
                {isAiAutocompleteEnabled ? "ON" : "OFF"}
              </span>
            </span>
          </button>
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

      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto w-full pt-10 px-8 pb-32">
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

          <div
            className="relative notion-quill-wrapper text-slate-700 text-lg leading-relaxed"
            onKeyDownCapture={handleEditorKeyDownCapture}
          >
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={modules}
              formats={quillFormats}
              placeholder="Start typing your note here..."
            />
            {suggestion && suggestionBounds && (
              <div
                style={{
                  position: "absolute",
                  left: `${suggestionBounds.left}px`,
                  top: `${suggestionBounds.top}px`,
                  pointerEvents: "none",
                  color: "#9ca3af",
                  whiteSpace: "pre",
                  zIndex: 20,
                }}
                className="inline-flex items-center text-slate-400 select-none opacity-80"
              >
                <span>{suggestion}</span>
                <span className="ml-2 text-[10px] font-sans font-medium bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 shadow-xs">
                  Tab ↹
                </span>
              </div>
            )}
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
  const currentNote =
    existingNote || (activeNote?._id === noteId ? activeNote : null);
  const shouldFetch = Boolean(
    noteId && !existingNote && activeNote?._id !== noteId,
  );

  const [isFetchingLocal, setIsFetchingLocal] = useState(shouldFetch);

  useEffect(() => {
    let isMounted = true;
    if (shouldFetch) {
      dispatch(fetchNoteById(noteId)).finally(() => {
        if (isMounted) setIsFetchingLocal(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [noteId, shouldFetch, dispatch]);

  const isStillLoading = isLoading || (isFetchingLocal && !currentNote);

  if (isStillLoading && !currentNote) {
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

  if (!currentNote && !isStillLoading) {
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
