import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../api/axios";


export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, thunkAPI) => {
    try {
      
      const response = await axiosInstance.get("/users/current-user"); 
      return response.data.data; 
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Session expired"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    status: false,
    userData: null,
    isLoading: true, 
  },
  reducers: {
    login: (state, action) => {
      state.status = true;
      state.userData = action.payload?.userData ?? action.payload;
    },
    logout: (state) => {
      state.status = false;
      state.userData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = true;
        state.userData = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.status = false;
        state.userData = null;
      });
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;