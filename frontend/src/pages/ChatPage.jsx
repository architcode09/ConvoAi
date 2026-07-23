import { useWallpaper } from "../context/wallpaper";
import { useSelectedConversation } from "../hooks/useSelectedConversation";
import { useEffect } from "react";
import { AppFooter } from "../components/AppFooter";
import ChatSidebar from "../components/chat/ChatSidebar";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageList } from "../components/chat/MessageList";
import { ChatComposer } from "../components/chat/ChatComposer";
import { AiSummaryModal } from "../components/chat/AiSummaryModal";
import { useAppDispatch } from "../app/hooks";
import {
  getConversations,
  getMessages,
  getUsers,
  subscribeToMessages,
  unsubscribeFromMessages,
} from "../store/chatSlice";

function ChatPage() {
  const { frameStyle } = useWallpaper();
  const dispatch = useAppDispatch();
  const { activeConversation, activeConversationId, isLargeScreen } = useSelectedConversation();

  useEffect(() => {
    dispatch(getUsers());
    dispatch(getConversations());
  }, [dispatch]);

  useEffect(() => {
    if (!activeConversationId) return;

    dispatch(getMessages(activeConversationId));
    dispatch(subscribeToMessages());

    // cleanup
    return () => dispatch(unsubscribeFromMessages());
  }, [dispatch, activeConversationId]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden p-2 sm:p-3 md:p-8" style={frameStyle}>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
        <div className="flex flex-1 overflow-hidden">
          <ChatSidebar />

          <div
            className={`flex-1 flex-col overflow-hidden ${
              !isLargeScreen && !activeConversationId ? "hidden lg:flex" : "flex"
            }`}
          >
            <ChatHeader />
            <MessageList />
            <AiSummaryModal />

            {activeConversation ? <ChatComposer /> : null}
          </div>
        </div>
        <AppFooter />
      </div>
    </div>
  );
}
export default ChatPage;
