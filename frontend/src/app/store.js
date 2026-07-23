import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/authSlice";
import chatReducer from "../store/chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
  },
});
