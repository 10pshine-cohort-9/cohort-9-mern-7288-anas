import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  fetchNoteById,
  updateNote,
} from '../store/notesSlice.js';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    [{ color: [] }, { background: [] }],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'blockquote',
  'code-block',
  'color',
  'background',
  'link',
];

const NoteEditorForm = ({ note }) => {
  const dispatch = useDispatch();

  const { isSaving } = useSelector((state) => state.notes);

  // Local state for smooth and responsive typing
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const debounceTimerRef = useRef(null);
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const revisionRef = useRef(Number(note?.version ?? note?.revision ?? 1));

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    const noteRev = Number(note?.version ?? note?.revision ?? 1);
    revisionRef.current = Math.max(revisionRef.current, noteRev);
  }, [note?.version, note?.revision]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const performSave = useCallback(
    async (overrideTitle, overrideContent) => {
      if (!note?._id) return;

      const titleToSave =
        (overrideTitle !== undefined ? overrideTitle : titleRef.current)?.trim() ||
        'Untitled';
      const contentToSave =
        overrideContent !== undefined ? overrideContent : contentRef.current ?? '';

      revisionRef.current += 1;
      const currentRevision = revisionRef.current;

      setSaveStatus('saving');
      try {
        await dispatch(
          updateNote({
            noteId: note._id,
            title: titleToSave,
            content: contentToSave,
            revision: currentRevision,
            version: currentRevision,
          })
        ).unwrap();

        // Only mark saved if this dispatch was not superseded by a newer one
        if (revisionRef.current === currentRevision) {
          setSaveStatus('saved');
          setLastSavedAt(new Date());
        }
      } catch (err) {
        // If superseded by a newer save, do not display error for this stale dispatch
        if (revisionRef.current === currentRevision) {
          console.error('Failed to update note:', err);
          setSaveStatus('error');
        }
      }
    },
    [dispatch, note]
  );

  const triggerDebouncedSave = (newTitle, newContent) => {
    setSaveStatus('unsaved');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      performSave(newTitle, newContent);
    }, 1000);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerDebouncedSave(newTitle, content);
  };

  const handleContentChange = (value) => {
    setContent(value);
    triggerDebouncedSave(title, value);
  };

  const handleManualSave = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSave(title, content);
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Top Action Bar (Save status, manual save button, sync indicator) */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 sm:px-12 md:px-16 py-2 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-850">
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

        {/* Save Status & Action Button */}
        <div className="flex items-center space-x-3">
          {saveStatus === 'saving' || isSaving ? (
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
          ) : saveStatus === 'unsaved' ? (
            <button
              onClick={handleManualSave}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              <span>Save</span>
            </button>
          ) : saveStatus === 'error' ? (
            <button
              onClick={handleManualSave}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Retry Save</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 text-xs text-zinc-400 dark:text-zinc-500">
              <svg
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Document Canvas */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 md:px-16 pt-8 pb-32">
          {/* Borderless Title Input */}
          <div className="mb-4">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled"
              className="w-full bg-transparent text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 border-none outline-none focus:outline-none focus:ring-0 p-0 transition-colors"
            />
          </div>

          {/* Seamless React Quill Editor */}
          <div className="notion-quill-wrapper">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Write your note here..."
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

  const { notes, activeNote, isLoading, error } = useSelector((state) => state.notes);

  const existingNote = notes.find((n) => n._id === noteId);

  // Fetch if note is not present in Redux notes array or activeNote
  useEffect(() => {
    if (noteId && !existingNote && activeNote?._id !== noteId) {
      dispatch(fetchNoteById(noteId));
    }
  }, [noteId, existingNote, activeNote, dispatch]);

  const currentNote = existingNote || (activeNote?._id === noteId ? activeNote : null);

  // Skeleton Loader when note is fetching
  if (isLoading && !currentNote) {
    return (
      <div className="max-w-4xl mx-auto px-6 sm:px-12 md:px-16 pt-8 pb-20 animate-pulse">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4 mb-6" />
        <div className="h-8 bg-zinc-100 dark:bg-zinc-850 rounded-md w-full mb-8" />
        <div className="space-y-3">
          <div className="h-4 bg-zinc-100 dark:bg-zinc-850 rounded w-full" />
          <div className="h-4 bg-zinc-100 dark:bg-zinc-850 rounded w-5/6" />
          <div className="h-4 bg-zinc-100 dark:bg-zinc-850 rounded w-4/6" />
        </div>
      </div>
    );
  }

  // Not Found State
  if (!currentNote && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center text-2xl mb-4">
          🔍
        </div>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">
          Note not found
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm">
          {error ||
            'The note you are trying to view does not exist or you do not have permission to access it.'}
        </p>
        <button
          onClick={() => navigate('/dashboard')}
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
