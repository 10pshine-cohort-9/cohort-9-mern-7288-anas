import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance.js";

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/users/current-user");
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Session expired",
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, username, password }, { rejectWithValue }) => {
    try {
      const identifier = (email || username).trim();
      const payload = {
        password,
        ...(identifier.includes("@")
          ? { email: identifier }
          : { username: identifier }),
      };
      const response = await axiosInstance.post("/users/login", payload);
      return response.data?.data?.user || response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred",
      );
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password,
      };
      const response = await axiosInstance.post("/users/register", payload);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred",
      );
    }
  },
);

// Backward-compatible named exports
export const loginUser = login;
export const registerUser = register;

const initialState = {
  status: false,
  userData: null,
  isInitialLoading: true,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.status = true;
      state.userData = action.payload?.userData ?? action.payload;
      state.error = null;
    },
    logout: (state) => {
      state.status = false;
      state.userData = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getCurrentUser
      .addCase(getCurrentUser.pending, (state) => {
        state.isInitialLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isInitialLoading = false;
        state.status = true;
        state.userData = action.payload;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isInitialLoading = false;
        state.status = false;
        state.userData = null;
      })

      // login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = true;
        state.userData = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.status = false;
        state.userData = null;
        state.error = action.payload;
      })

      // register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, logout, clearError, clearAuthError } =
  authSlice.actions;
export default authSlice.reducer;
