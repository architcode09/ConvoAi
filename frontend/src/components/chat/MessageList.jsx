import useScrollToBottom from "../../hooks/useScrollToBottom";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { MessageBubble } from "./MessageBubble";
import { NoConversationPlaceholder } from "./NoConversationPlaceholder";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { getSmartReplies, setComposerText } from "../../store/chatSlice";

export function MessageList() {
  const dispatch = useAppDispatch();
  const { activeConversation, activeConversationId } = useSelectedConversation();
  const isMessagesLoading = useAppSelector((state) => state.chat.isMessagesLoading);
  const smartReplies = useAppSelector((state) => state.chat.smartReplies);

  const lastMessageId = activeConversation?.messages.at(-1)?.id;
  const messagesScrollRef = useScrollToBottom(activeConversationId, lastMessageId);
  const latestIncomingMessage = [...(activeConversation?.messages || [])].reverse().find((message) => message.role === "them" && message.text.trim());

  useEffect(() => {
    if (!activeConversationId || !latestIncomingMessage) return;
    if (
      smartReplies.conversationId === activeConversationId &&
      smartReplies.lastMessageId === latestIncomingMessage.id
    ) {
      return;
    }

    const actionPromise = dispatch(
      getSmartReplies({
        conversationId: activeConversationId,
        latestMessageId: latestIncomingMessage.id,
        messages: activeConversation.messages.map((message) => ({
          role: message.role,
          text: message.text,
        })),
      }),
    );

    actionPromise.then((action) => {
      if (getSmartReplies.rejected.match(action) && action.payload) {
        toast.error(action.payload);
      }
    });
  }, [activeConversation, activeConversationId, dispatch, latestIncomingMessage, smartReplies.conversationId, smartReplies.lastMessageId]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {activeConversation ? (
        <div
          ref={messagesScrollRef}
          className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3 sm:py-4"
        >
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
            Today
          </p>
          {isMessagesLoading ? (
            <p className="px-2 py-4 text-center text-sm text-muted">Loading messages...</p>
          ) : null}
          {activeConversation.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              showSuggestions={
                message.id === latestIncomingMessage?.id &&
                smartReplies.conversationId === activeConversationId &&
                (smartReplies.items.length > 0 || smartReplies.isLoading)
              }
              suggestions={smartReplies.items}
              onSuggestionSelect={(suggestion) => dispatch(setComposerText(suggestion))}
            />
          ))}
        </div>
      ) : (
        <NoConversationPlaceholder />
      )}
    </div>
  );
}
