import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../api/axios";

export const fetchNotes = createAsyncThunk(
  "notes/fetchNotes",
  async (params, thunkAPI) => {
    const queryParams = params || {};
    
    try {
      const response = await axiosInstance.get("/notes", { params: queryParams });
      const data = response.data?.data;
      
      if (Array.isArray(data)) {
        return data;
      }
      return data?.notes || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch notes",
      );
    }
  },
);

export const createNote = createAsyncThunk(
  "notes/createNote",
  async (payload, thunkAPI) => {
    try {
      const body = {
        title: payload?.title?.trim() || "Untitled",
        content: payload?.content ?? "",
      };
      const response = await axiosInstance.post("/notes", body);
      return response.data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create note",
      );
    }
  },
);

export const deleteNote = createAsyncThunk(
  "notes/deleteNote",
  async (noteId, thunkAPI) => {
    try {
      await axiosInstance.delete(`/notes/${noteId}`);
      return noteId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete note",
      );
    }
  },
);

export const fetchNoteById = createAsyncThunk(
  "notes/fetchNoteById",
  async (noteId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/notes/${noteId}`);
      return response.data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch note",
      );
    }
  },
);

const updateQueues = new Map();

export const updateNote = createAsyncThunk(
  "notes/updateNote",
  async ({ noteId, title, content, revision, version }, thunkAPI) => {
    const priorPromise = updateQueues.get(noteId) || Promise.resolve();

    let resolveCurrent;
    const currentPromise = new Promise((resolve) => {
      resolveCurrent = resolve;
    });

    updateQueues.set(
      noteId,
      priorPromise.then(() => currentPromise).catch(() => currentPromise),
    );

    let revToSend;
    try {
      await priorPromise.catch(() => {});

      revToSend = revision ?? version;
      if (revToSend === undefined || revToSend === null) {
        const state = thunkAPI.getState()?.notes;
        const noteInState =
          state?.notes?.find((n) => n._id === noteId) ||
          (state?.activeNote?._id === noteId ? state?.activeNote : null);
        const currentRev =
          state?.latestDispatchedRevision?.[noteId] ??
          noteInState?.version ??
          noteInState?.revision ??
          1;
        revToSend = Number(currentRev) + 1;
      }

      thunkAPI.dispatch(reserveRevision({ noteId, revision: revToSend }));

      const body = {
        revision: Number(revToSend),
        version: Number(revToSend),
      };
      if (title !== undefined) body.title = title;
      if (content !== undefined) body.content = content;

      const response = await axiosInstance.patch(`/notes/${noteId}`, body);
      return response.data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.message || "Failed to update note",
        noteId,
        revision: revToSend ?? null,
      });
    } finally {
      resolveCurrent();
    }
  },
);

export const deleteNoteImage = createAsyncThunk(
  "notes/deleteNoteImage",
  async ({ publicId }, thunkAPI) => {
    try {
      const response = await axiosInstance.delete("/notes/delete-image", {
        data: { publicId },
      });
      return { publicId, data: response.data?.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete image",
      );
    }
  },
);

const initialState = {
  notes: [],
  activeNote: null,
  latestDispatchedRevision: {},
  isLoading: false,
  isCreating: false,
  isSaving: false,
  error: null,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    setActiveNote: (state, action) => {
      state.activeNote = action.payload;
      if (action.payload?._id) {
        const rev = action.payload.version ?? action.payload.revision ?? 1;
        state.latestDispatchedRevision[action.payload._id] = Math.max(
          state.latestDispatchedRevision[action.payload._id] || 0,
          Number(rev),
        );
      }
    },
    clearActiveNote: (state) => {
      state.activeNote = null;
    },
    clearNotesError: (state) => {
      state.error = null;
    },
    reserveRevision: (state, action) => {
      const { noteId, revision } = action.payload || {};
      if (noteId && revision !== undefined && revision !== null) {
        state.latestDispatchedRevision[noteId] = Math.max(
          state.latestDispatchedRevision[noteId] || 0,
          Number(revision),
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchNotes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notes = action.payload;
        if (Array.isArray(action.payload)) {
          action.payload.forEach((note) => {
            if (note?._id) {
              const rev = note.version ?? note.revision ?? 1;
              state.latestDispatchedRevision[note._id] = Math.max(
                state.latestDispatchedRevision[note._id] || 0,
                Number(rev),
              );
            }
          });
        }
        state.error = null;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(createNote.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.isCreating = false;
        state.notes.unshift(action.payload);
        state.activeNote = action.payload;
        if (action.payload?._id) {
          const rev = action.payload.version ?? action.payload.revision ?? 1;
          state.latestDispatchedRevision[action.payload._id] = Number(rev);
        }
        state.error = null;
      })
      .addCase(createNote.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      .addCase(deleteNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter((note) => note._id !== action.payload);
        if (state.activeNote?._id === action.payload) {
          state.activeNote = null;
        }
        if (action.payload) {
          delete state.latestDispatchedRevision[action.payload];
        }
        state.error = null;
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(fetchNoteById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNoteById.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?._id) {
          const fetchedRev = Number(
            action.payload.version ?? action.payload.revision ?? 1,
          );
          const currentDispatched =
            state.latestDispatchedRevision[action.payload._id] || 0;
          state.latestDispatchedRevision[action.payload._id] = Math.max(
            currentDispatched,
            fetchedRev,
          );

          const index = state.notes.findIndex(
            (n) => n._id === action.payload._id,
          );
          const isMissingLocally =
            index === -1 && state.activeNote?._id !== action.payload._id;

          if (isMissingLocally || fetchedRev >= currentDispatched) {
            state.activeNote = action.payload;
            if (index === -1) {
              state.notes.push(action.payload);
            } else {
              state.notes[index] = action.payload;
            }
          }
        }
        state.error = null;
      })
      .addCase(fetchNoteById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(updateNote.pending, (state, action) => {
        const noteId = action.meta?.arg?.noteId;
        const dispatchedRev =
          action.meta?.arg?.revision ?? action.meta?.arg?.version;
        if (noteId && dispatchedRev !== undefined && dispatchedRev !== null) {
          state.latestDispatchedRevision[noteId] = Math.max(
            state.latestDispatchedRevision[noteId] || 0,
            Number(dispatchedRev),
          );
        }
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.isSaving = false;
        const noteId = action.payload?._id || action.meta?.arg?.noteId;
        if (!noteId) {
          state.error = null;
          return;
        }

        const fulfilledRevision = Number(
          action.payload?.version ??
            action.payload?.revision ??
            action.meta?.arg?.revision ??
            action.meta?.arg?.version ??
            0,
        );

        const latestDispatched = state.latestDispatchedRevision[noteId] || 0;
        const currentActiveRev =
          state.activeNote?._id === noteId
            ? Number(state.activeNote.version ?? state.activeNote.revision ?? 0)
            : 0;
        const existingNoteIndex = state.notes.findIndex(
          (n) => n._id === noteId,
        );
        const currentListRev =
          existingNoteIndex !== -1
            ? Number(
                state.notes[existingNoteIndex].version ??
                  state.notes[existingNoteIndex].revision ??
                  0,
              )
            : 0;

        if (
          fulfilledRevision < latestDispatched ||
          fulfilledRevision < currentActiveRev ||
          fulfilledRevision < currentListRev
        ) {
          return;
        }

        if (state.activeNote?._id === noteId) {
          state.activeNote = action.payload;
        }

        if (existingNoteIndex !== -1) {
          state.notes[existingNoteIndex] = action.payload;
        } else {
          state.notes.unshift(action.payload);
        }

        state.latestDispatchedRevision[noteId] = Math.max(
          state.latestDispatchedRevision[noteId] || 0,
          fulfilledRevision,
        );
        state.error = null;
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.isSaving = false;
        const noteId = action.meta?.arg?.noteId;
        const rejectedRev = Number(
          action.payload?.revision ??
            action.meta?.arg?.revision ??
            action.meta?.arg?.version ??
            0,
        );
        const latestDispatched = noteId
          ? state.latestDispatchedRevision[noteId] || 0
          : 0;

        if (noteId && rejectedRev < latestDispatched) {
          return;
        }

        if (noteId) {
          const noteInState =
            state.notes.find((n) => n._id === noteId) ||
            (state.activeNote?._id === noteId ? state.activeNote : null);
          const confirmedRev = Number(
            noteInState?.version ?? noteInState?.revision ?? 0,
          );
          state.latestDispatchedRevision[noteId] = confirmedRev;
        }

        const errorMsg =
          typeof action.payload === "string"
            ? action.payload
            : action.payload?.message || "Failed to update note";
        state.error = errorMsg;
      });
  },
});

export const {
  setActiveNote,
  clearActiveNote,
  clearNotesError,
  reserveRevision,
} = notesSlice.actions;
export default notesSlice.reducer;
