import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../api/axios";


export const fetchNotes = createAsyncThunk(
  "notes/fetchNotes",
  async (params = {}, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/notes", { params });
      const data = response.data?.data;
      if (Array.isArray(data)) {
        return data;
      }
      return data?.notes || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch notes"
      );
    }
  }
);

export const createNote = createAsyncThunk(
  "notes/createNote",
  async (payload = { title: "Untitled", content: "" }, thunkAPI) => {
    try {
      const body = {
        title: payload?.title?.trim() || "Untitled",
        content: payload?.content ?? "",
      };
      const response = await axiosInstance.post("/notes", body);
      return response.data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create note"
      );
    }
  }
);


export const deleteNote = createAsyncThunk(
  "notes/deleteNote",
  async (noteId, thunkAPI) => {
    try {
      await axiosInstance.delete(`/notes/${noteId}`);
      return noteId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete note"
      );
    }
  }
);


export const fetchNoteById = createAsyncThunk(
  "notes/fetchNoteById",
  async (noteId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/notes/${noteId}`);
      return response.data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch note"
      );
    }
  }
);

export const updateNote = createAsyncThunk(
  "notes/updateNote",
  async ({ noteId, title, content }, thunkAPI) => {
    try {
      const response = await axiosInstance.patch(`/notes/${noteId}`, {
        title,
        content,
      });
      return response.data?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update note"
      );
    }
  }
);

const initialState = {
  notes: [],
  activeNote: null,
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
    },
    clearActiveNote: (state) => {
      state.activeNote = null;
    },
    clearNotesError: (state) => {
      state.error = null;
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
        state.error = null;
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Fetch Note By ID
      .addCase(fetchNoteById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNoteById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeNote = action.payload;
        if (action.payload) {
          const exists = state.notes.some((note) => note._id === action.payload._id);
          if (!exists) {
            state.notes.push(action.payload);
          } else {
            const index = state.notes.findIndex((n) => n._id === action.payload._id);
            state.notes[index] = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(fetchNoteById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Note
      .addCase(updateNote.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.isSaving = false;
        state.activeNote = action.payload;
        if (action.payload?._id) {
          const index = state.notes.findIndex(
            (note) => note._id === action.payload._id
          );
          if (index !== -1) {
            state.notes[index] = action.payload;
          } else {
            state.notes.unshift(action.payload);
          }
        }
        state.error = null;
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });
  },
});

export const { setActiveNote, clearActiveNote, clearNotesError } = notesSlice.actions;
export default notesSlice.reducer;
