import { Button } from "@heroui/react";
import { LanguagesIcon, LoaderIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { translateMessage } from "../../store/chatSlice";
import { withTransform } from "../../lib/imagekit";
import { MessageVideo } from "./MessageVideo";

// Compress + size images for the bubble (q-auto works for images; f-auto picks WebP/AVIF).
const IMAGE_TRANSFORM = "q-auto,w-640,f-auto";

const TRANSLATION_OPTIONS = [
  ["en", "English"],
  ["hi", "Hindi"],
  ["es", "Spanish"],
];

export function MessageBubble({ message, suggestions = [], showSuggestions = false, onSuggestionSelect }) {
  const dispatch = useAppDispatch();
  const translationState = useAppSelector((state) => state.chat.translations[message.id] || {});
  const isOwnMessage = message.role === "me";
  const hasImage = Boolean(message.imageUrl);
  const hasVideo = Boolean(message.videoUrl);
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);

  const handleTranslate = async (language) => {
    if (translationState[language]?.text) {
      return;
    }

    const action = await dispatch(
      translateMessage({
        messageId: message.id,
        text: message.text,
        language,
      }),
    );

    if (translateMessage.rejected.match(action) && action.payload) {
      toast.error(action.payload);
    }
  };

  return (
    <div className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(90%,28rem)] rounded-2xl px-3 py-2 text-[15px] leading-snug sm:max-w-[min(75%,28rem)] sm:px-3.5 ${
          isOwnMessage
            ? "rounded-br-md bg-accent text-accent-foreground"
            : "rounded-bl-md bg-surface"
        }`}
      >
        {hasImage ? (
          <img
            src={withTransform(message.imageUrl, IMAGE_TRANSFORM)}
            alt=""
            className="mb-1.5 max-h-40 max-w-full rounded-lg object-cover sm:max-h-52 sm:rounded-xl"
          />
        ) : null}
        {hasVideo ? <MessageVideo src={message.videoUrl} /> : null}
        {message.text ? (
          <p className="whitespace-pre-wrap wrap-break-word">{message.text}</p>
        ) : null}
        {message.text ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 min-w-0 px-2 text-[11px]"
              onPress={() => setIsTranslateOpen((open) => !open)}
            >
              <LanguagesIcon className="size-3.5" />
              Translate
            </Button>
            {isTranslateOpen
              ? TRANSLATION_OPTIONS.map(([value, label]) => (
                  <Button
                    key={value}
                    size="sm"
                    variant="ghost"
                    className="h-7 min-w-0 px-2 text-[11px]"
                    isDisabled={translationState[value]?.isLoading}
                    onPress={() => handleTranslate(value)}
                  >
                    {translationState[value]?.isLoading ? (
                      <LoaderIcon className="size-3.5 animate-spin" />
                    ) : null}
                    {label}
                  </Button>
                ))
              : null}
          </div>
        ) : null}
        {TRANSLATION_OPTIONS.map(([value, label]) => {
          const translated = translationState[value]?.text;
          if (!translated) return null;

          return (
            <div key={value} className="mt-2 rounded-xl bg-black/10 px-2.5 py-2 text-sm">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide opacity-70">
                {label}
              </p>
              <p className="whitespace-pre-wrap">{translated}</p>
            </div>
          );
        })}
        {showSuggestions ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.length ? (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-left text-inherit transition hover:bg-white/15"
                  onClick={() => onSuggestionSelect?.(suggestion)}
                >
                  {suggestion}
                </button>
              ))
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium">
                <LoaderIcon className="size-3.5 animate-spin" />
                Generating replies...
              </div>
            )}
          </div>
        ) : null}
        <p
          className={`mt-1 text-[11px] tabular-nums ${
            isOwnMessage ? "text-accent-foreground/75" : "text-muted"
          }`}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}
