import { Button, TextArea } from "@heroui/react";
import { LoaderIcon, ImageIcon, SendHorizontalIcon, SparklesIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import useKeyboardSound from "../../hooks/useKeyboardSound";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  acceptAiAssistantPreview,
  clearAiAssistantPreview,
  getConversations,
  rewriteComposerMessage,
  sendMediaMessage,
  sendTextMessage,
  setAiAssistantOption,
  setComposerText,
} from "../../store/chatSlice";

const AI_OPTIONS = [
  ["improve", "Improve Writing"],
  ["professional", "Professional"],
  ["friendly", "Friendly"],
  ["formal", "Formal"],
  ["casual", "Casual"],
  ["grammar", "Fix Grammar"],
  ["shorter", "Shorter"],
  ["longer", "Longer"],
];

export function ChatComposer() {
  const dispatch = useAppDispatch();
  const composerText = useAppSelector((state) => state.chat.composerText);
  const isSoundEnabled = useAppSelector((state) => state.chat.isSoundEnabled);
  const isSendingMedia = useAppSelector((state) => state.chat.isSendingMedia);
  const aiAssistant = useAppSelector((state) => state.chat.aiAssistant);
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const mediaInputRef = useRef(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  const selectedOptionLabel = useMemo(
    () => AI_OPTIONS.find(([value]) => value === aiAssistant.option)?.[1] || "Improve Writing",
    [aiAssistant.option],
  );

  const playSoundIfEnabled = () => {
    if (isSoundEnabled) playRandomKeyStrokeSound();
  };

  const handleSend = async () => {
    const action = await dispatch(sendTextMessage());
    if (sendTextMessage.fulfilled.match(action)) {
      dispatch(getConversations());
      playSoundIfEnabled();
    } else if (action.payload) {
      toast.error(action.payload);
    }
  };

  const handleComposerTextChange = (event) => {
    dispatch(setComposerText(event.target.value));
    playSoundIfEnabled();
  };

  const handleMediaPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const action = await dispatch(sendMediaMessage(file));
    if (sendMediaMessage.fulfilled.match(action)) {
      dispatch(getConversations());
      playSoundIfEnabled();
    } else if (action.payload) {
      toast.error(action.payload);
    }
  };

  const handleAiGenerate = async () => {
    const action = await dispatch(rewriteComposerMessage(aiAssistant.option));
    if (rewriteComposerMessage.rejected.match(action) && action.payload) {
      toast.error(action.payload);
    }
  };

  return (
    <footer className="shrink-0 border-t border-border px-1.5 pb-2 pt-2 sm:px-2">
      {isAiPanelOpen ? (
        <div className="mx-auto mb-2 max-w-full rounded-2xl border border-border bg-surface/90 p-3 shadow-sm backdrop-blur">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">AI Message Assistant</p>
              <p className="text-xs text-muted">Refine your draft before sending.</p>
            </div>
            <Button variant="ghost" size="sm" onPress={() => setIsAiPanelOpen(false)}>
              Close
            </Button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {AI_OPTIONS.map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={aiAssistant.option === value ? "primary" : "ghost"}
                onPress={() => dispatch(setAiAssistantOption(value))}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              isDisabled={!composerText.trim() || aiAssistant.isLoading}
              onPress={handleAiGenerate}
            >
              {aiAssistant.isLoading ? <LoaderIcon className="size-4 animate-spin" /> : null}
              Generate {selectedOptionLabel}
            </Button>
            {aiAssistant.previewText ? (
              <Button size="sm" variant="ghost" onPress={() => dispatch(clearAiAssistantPreview())}>
                Clear Preview
              </Button>
            ) : null}
          </div>
          {aiAssistant.previewText ? (
            <div className="mt-3 rounded-2xl border border-accent/20 bg-accent/5 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                AI Suggestion
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {aiAssistant.previewText}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="primary" onPress={() => dispatch(acceptAiAssistantPreview())}>
                  Accept
                </Button>
                <Button size="sm" variant="ghost" onPress={() => dispatch(clearAiAssistantPreview())}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {isSendingMedia ? (
        <div className="mx-auto mb-2 flex max-w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
          <LoaderIcon
            className="size-4 shrink-0 animate-spin text-accent"
            strokeWidth={2}
            aria-hidden
          />
          <span className="truncate">Uploading media...</span>
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-full items-end gap-1.5 px-0.5 sm:gap-2 sm:px-1">
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          disabled={isSendingMedia}
          tabIndex={-1}
          aria-hidden
          onChange={handleMediaPick}
        />
        <Button
          variant={isAiPanelOpen ? "primary" : "ghost"}
          isIconOnly
          isDisabled={isSendingMedia}
          className="size-9 shrink-0 touch-manipulation self-end text-accent"
          onPress={() => setIsAiPanelOpen((open) => !open)}
        >
          <SparklesIcon className="size-5 sm:size-6" strokeWidth={2} />
        </Button>
        <Button
          variant="ghost"
          isIconOnly
          isDisabled={isSendingMedia}
          className="size-9 shrink-0 touch-manipulation self-end text-accent"
          onPress={() => mediaInputRef.current?.click()}
        >
          <ImageIcon className="size-5 sm:size-6" strokeWidth={2} />
        </Button>
        <TextArea
          fullWidth
          variant="secondary"
          placeholder="Message with AI help"
          rows={1}
          value={composerText}
          onChange={handleComposerTextChange}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 rounded-full"
        />

        <Button variant="primary" isIconOnly isDisabled={!composerText.trim()} onPress={handleSend}>
          <SendHorizontalIcon className="size-5" />
        </Button>
      </div>
    </footer>
  );
}
