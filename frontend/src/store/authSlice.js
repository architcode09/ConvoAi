import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../lib/axios";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";

const initialState = {
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],
};

export const checkAuth = createAsyncThunk("auth/checkAuth", async (_, { dispatch }) => {
  const res = await axiosInstance.get("/auth/check");
  dispatch(initializeSocket(res.data));
  return res.data;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState: (state) => {
      state.authUser = null;
      state.isCheckingAuth = false;
      state.onlineUsers = [];
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.authUser = action.payload;
        state.isCheckingAuth = false;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.authUser = null;
        state.isCheckingAuth = false;
        state.onlineUsers = [];
      });
  },
});

export const { clearAuthState, setOnlineUsers } = authSlice.actions;

export const initializeSocket = (user) => (dispatch) => {
  if (!user?._id) return;

  const socket = connectSocket(user._id);
  if (!socket) return;

  socket.off("getOnlineUsers");
  socket.on("getOnlineUsers", (userIds) => {
    dispatch(setOnlineUsers(userIds));
  });
};

export const clearAuth = () => (dispatch) => {
  const socket = getSocket();
  socket?.off("getOnlineUsers");
  disconnectSocket();
  dispatch(clearAuthState());
};

export default authSlice.reducer;
