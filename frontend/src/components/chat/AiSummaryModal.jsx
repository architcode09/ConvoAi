import { Button, Modal, useOverlayState } from "@heroui/react";
import { CheckIcon, CopyIcon, LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { closeSummaryModal } from "../../store/chatSlice";

export function AiSummaryModal() {
  const dispatch = useAppDispatch();
  const { isOpen, isLoading, items } = useAppSelector((state) => state.chat.chatSummary);
  const modal = useOverlayState({
    isOpen,
    onOpenChange: (open) => {
      if (!open) dispatch(closeSummaryModal());
    },
  });
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) modal.open();
    else modal.close();
  }, [isOpen, modal]);

  useEffect(() => {
    if (!isCopied) return undefined;

    const timeout = window.setTimeout(() => setIsCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(items.join("\n"));
      setIsCopied(true);
      toast.success("Summary copied");
    } catch {
      toast.error("Unable to copy summary");
    }
  };

  return (
    <Modal.Root state={modal}>
      <Modal.Backdrop variant="opaque">
        <Modal.Container size="md" placement="center">
          <Modal.Dialog className="border border-white/10 bg-[#2a2a2c] text-foreground shadow-2xl">
            <Modal.Header className="flex flex-row items-center justify-between gap-3 border-b border-white/10 pb-3">
              <Modal.Heading className="text-lg font-semibold tracking-tight text-white">
                Chat Summary
              </Modal.Heading>
              <Modal.CloseTrigger
                onPress={() => {
                  dispatch(closeSummaryModal());
                }}
              />
            </Modal.Header>

            <Modal.Body className="space-y-4 pt-4">
              {isLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-zinc-200">
                  <LoaderIcon className="size-4 animate-spin text-accent" />
                  <span>Summarizing this conversation...</span>
                </div>
              ) : items.length ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <ul className="space-y-2 text-sm leading-6 text-zinc-100">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-zinc-300">
                  No summary is available yet.
                </p>
              )}
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <Button variant="ghost" onPress={() => dispatch(closeSummaryModal())}>
                Close
              </Button>
              <Button variant="primary" isDisabled={isLoading || !items.length} onPress={handleCopy}>
                {isCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
