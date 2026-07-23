import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../lib/axios";
import { getSocket } from "../lib/socket";

const persistedSoundSetting = localStorage.getItem("imessage-sound-enabled");

function toAiMessages(messages, authUserId) {
  return messages
    .map((message) => ({
      role: String(message.senderId) === String(authUserId) ? "me" : "them",
      text: message.text || "",
    }))
    .filter((message) => message.text.trim());
}

const initialState = {
  users: [],
  conversations: [],
  messages: [],
  isConversationsLoading: false,
  isUsersLoading: false,
  isMessagesLoading: false,
  activeConversationId: null,
  searchQuery: "",
  sidebarTab: "chats",
  composerText: "",
  isSoundEnabled: persistedSoundSetting ? persistedSoundSetting === "true" : true,
  isSendingMedia: false,
  aiAssistant: {
    option: "improve",
    isLoading: false,
    previewText: "",
  },
  smartReplies: {
    items: [],
    isLoading: false,
    lastMessageId: null,
    conversationId: null,
  },
  chatSummary: {
    items: [],
    isLoading: false,
    isOpen: false,
    signature: "",
  },
  translations: {},
};

export const getUsers = createAsyncThunk("chat/getUsers", async () => {
  const res = await axiosInstance.get("/messages/users");
  return res.data;
});

export const getConversations = createAsyncThunk("chat/getConversations", async () => {
  const res = await axiosInstance.get("/messages/conversations");
  return res.data;
});

export const getMessages = createAsyncThunk("chat/getMessages", async (userId) => {
  const res = await axiosInstance.get(`/messages/${userId}`);
  return { userId, messages: res.data };
});

export const sendTextMessage = createAsyncThunk(
  "chat/sendTextMessage",
  async (_, { getState, rejectWithValue }) => {
    const { activeConversationId, composerText } = getState().chat;

    if (!activeConversationId || !composerText.trim()) {
      return rejectWithValue("Message cannot be empty");
    }

    try {
      const res = await axiosInstance.post(`/messages/send/${activeConversationId}`, {
        text: composerText.trim(),
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to send message");
    }
  },
);

export const sendMediaMessage = createAsyncThunk(
  "chat/sendMediaMessage",
  async (file, { getState, rejectWithValue }) => {
    const { activeConversationId } = getState().chat;
    if (!activeConversationId || !file) {
      return rejectWithValue("No conversation selected");
    }

    const formData = new FormData();
    formData.append("media", file);

    try {
      const res = await axiosInstance.post(`/messages/send/${activeConversationId}`, formData);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to send message");
    }
  },
);

export const rewriteComposerMessage = createAsyncThunk(
  "chat/rewriteComposerMessage",
  async (tone, { getState, rejectWithValue }) => {
    const { composerText } = getState().chat;

    if (!composerText.trim()) {
      return rejectWithValue("Type a message before using AI");
    }

    try {
      const res = await axiosInstance.post("/ai/rewrite", {
        text: composerText.trim(),
        tone,
      });
      return { tone, text: res.data.text };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to generate AI message");
    }
  },
);

export const getSmartReplies = createAsyncThunk(
  "chat/getSmartReplies",
  async ({ conversationId, messages, latestMessageId }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/ai/suggest-replies", { messages });
      return {
        conversationId,
        latestMessageId,
        suggestions: res.data.suggestions,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to generate reply suggestions");
    }
  },
);

export const summarizeActiveConversation = createAsyncThunk(
  "chat/summarizeActiveConversation",
  async ({ signature }, { getState, rejectWithValue }) => {
    const { messages } = getState().chat;
    const authUserId = getState().auth.authUser?._id;

    try {
      const res = await axiosInstance.post("/ai/summarize", {
        messages: toAiMessages(messages, authUserId),
      });
      return { signature, summary: res.data.summary };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to summarize chat");
    }
  },
);

export const translateMessage = createAsyncThunk(
  "chat/translateMessage",
  async ({ messageId, text, language }, { rejectWithValue }) => {
    if (!text?.trim()) {
      return rejectWithValue("This message cannot be translated");
    }

    try {
      const res = await axiosInstance.post("/ai/translate", {
        text: text.trim(),
        language,
      });
      return {
        messageId,
        language,
        text: res.data.text,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to translate message");
    }
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversationId: (state, action) => {
      state.activeConversationId = action.payload;
      state.messages = action.payload ? state.messages : [];
      state.smartReplies =
        action.payload === state.smartReplies.conversationId
          ? state.smartReplies
          : initialState.smartReplies;
      state.chatSummary = initialState.chatSummary;
      state.aiAssistant.previewText = "";
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSidebarTab: (state, action) => {
      state.sidebarTab = action.payload;
    },
    setComposerText: (state, action) => {
      state.composerText = action.payload;
    },
    setAiAssistantOption: (state, action) => {
      state.aiAssistant.option = action.payload;
    },
    acceptAiAssistantPreview: (state) => {
      if (state.aiAssistant.previewText) {
        state.composerText = state.aiAssistant.previewText;
      }
      state.aiAssistant.previewText = "";
    },
    clearAiAssistantPreview: (state) => {
      state.aiAssistant.previewText = "";
    },
    openSummaryModal: (state) => {
      state.chatSummary.isOpen = true;
    },
    closeSummaryModal: (state) => {
      state.chatSummary.isOpen = false;
    },
    setSoundEnabled: (state, action) => {
      state.isSoundEnabled = action.payload;
      localStorage.setItem("imessage-sound-enabled", String(action.payload));
    },
    receiveMessage: (state, action) => {
      const incomingMessage = action.payload;
      const isCurrentConversation =
        String(incomingMessage.senderId) === String(state.activeConversationId) ||
        String(incomingMessage.receiverId) === String(state.activeConversationId);

      if (isCurrentConversation) {
        const exists = state.messages.some((message) => message._id === incomingMessage._id);
        if (!exists) state.messages.push(incomingMessage);
      }

      const participants = [String(incomingMessage.senderId), String(incomingMessage.receiverId)];
      const conversationSet = new Set(state.conversations.map((user) => String(user._id)));
      state.users.forEach((user) => {
        if (participants.includes(String(user._id)) && !conversationSet.has(String(user._id))) {
          state.conversations.unshift(user);
          conversationSet.add(String(user._id));
        }
      });
    },
    clearChatState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.pending, (state) => {
        state.isUsersLoading = true;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isUsersLoading = false;
        state.users = action.payload;
      })
      .addCase(getUsers.rejected, (state) => {
        state.isUsersLoading = false;
      })
      .addCase(getConversations.pending, (state) => {
        state.isConversationsLoading = true;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.isConversationsLoading = false;
        state.conversations = action.payload;
      })
      .addCase(getConversations.rejected, (state) => {
        state.isConversationsLoading = false;
      })
      .addCase(getMessages.pending, (state) => {
        state.isMessagesLoading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.isMessagesLoading = false;
        if (String(state.activeConversationId) === String(action.payload.userId)) {
          state.messages = action.payload.messages;
        }
      })
      .addCase(getMessages.rejected, (state) => {
        state.isMessagesLoading = false;
      })
      .addCase(sendTextMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
        state.composerText = "";
      })
      .addCase(sendMediaMessage.pending, (state) => {
        state.isSendingMedia = true;
      })
      .addCase(sendMediaMessage.fulfilled, (state, action) => {
        state.isSendingMedia = false;
        state.messages.push(action.payload);
      })
      .addCase(sendMediaMessage.rejected, (state) => {
        state.isSendingMedia = false;
      })
      .addCase(rewriteComposerMessage.pending, (state) => {
        state.aiAssistant.isLoading = true;
        state.aiAssistant.previewText = "";
      })
      .addCase(rewriteComposerMessage.fulfilled, (state, action) => {
        state.aiAssistant.isLoading = false;
        state.aiAssistant.option = action.payload.tone;
        state.aiAssistant.previewText = action.payload.text;
      })
      .addCase(rewriteComposerMessage.rejected, (state) => {
        state.aiAssistant.isLoading = false;
      })
      .addCase(getSmartReplies.pending, (state) => {
        state.smartReplies.isLoading = true;
      })
      .addCase(getSmartReplies.fulfilled, (state, action) => {
        state.smartReplies.isLoading = false;
        state.smartReplies.items = action.payload.suggestions;
        state.smartReplies.lastMessageId = action.payload.latestMessageId;
        state.smartReplies.conversationId = action.payload.conversationId;
      })
      .addCase(getSmartReplies.rejected, (state) => {
        state.smartReplies.isLoading = false;
      })
      .addCase(summarizeActiveConversation.pending, (state) => {
        state.chatSummary.isLoading = true;
        state.chatSummary.isOpen = true;
      })
      .addCase(summarizeActiveConversation.fulfilled, (state, action) => {
        state.chatSummary.isLoading = false;
        state.chatSummary.isOpen = true;
        state.chatSummary.items = action.payload.summary;
        state.chatSummary.signature = action.payload.signature;
      })
      .addCase(summarizeActiveConversation.rejected, (state) => {
        state.chatSummary.isLoading = false;
        state.chatSummary.isOpen = true;
      })
      .addCase(translateMessage.pending, (state, action) => {
        const { messageId, language } = action.meta.arg;
        state.translations[messageId] ??= {};
        state.translations[messageId][language] = {
          text: "",
          isLoading: true,
        };
      })
      .addCase(translateMessage.fulfilled, (state, action) => {
        const { messageId, language, text } = action.payload;
        state.translations[messageId] ??= {};
        state.translations[messageId][language] = {
          text,
          isLoading: false,
        };
      })
      .addCase(translateMessage.rejected, (state, action) => {
        const { messageId, language } = action.meta.arg;
        state.translations[messageId] ??= {};
        state.translations[messageId][language] = {
          text: "",
          isLoading: false,
        };
      });
  },
});

export const {
  setActiveConversationId,
  setSearchQuery,
  setSidebarTab,
  setComposerText,
  setAiAssistantOption,
  acceptAiAssistantPreview,
  clearAiAssistantPreview,
  openSummaryModal,
  closeSummaryModal,
  setSoundEnabled,
  receiveMessage,
  clearChatState,
} = chatSlice.actions;

export const subscribeToMessages = () => (dispatch) => {
  const socket = getSocket();
  if (!socket) return;

  socket.off("newMessage");
  socket.on("newMessage", (message) => {
    dispatch(receiveMessage(message));
    dispatch(getConversations());
  });
};

export const unsubscribeFromMessages = () => () => {
  const socket = getSocket();
  socket?.off("newMessage");
};

export const resetChatForSignOut = () => (dispatch) => {
  dispatch(clearChatState());
};

export default chatSlice.reducer;
