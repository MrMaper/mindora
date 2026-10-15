"use client";

import * as React from "react";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useTranslation } from "@/i18n/provider";

export type ConfirmDialogOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

export type PromptDialogOptions = {
  title: string;
  description?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  inputLabel?: string;
};

type ConfirmState = ConfirmDialogOptions & { kind: "confirm" };
type PromptState = PromptDialogOptions & { kind: "prompt"; inputValue: string };
type ActiveDialog = ConfirmState | PromptState;

type PendingResolver =
  | { kind: "confirm"; resolve: (value: boolean) => void }
  | { kind: "prompt"; resolve: (value: string | null) => void };

type AppDialogsContextValue = {
  confirm: (opts: ConfirmDialogOptions) => Promise<boolean>;
  prompt: (opts: PromptDialogOptions) => Promise<string | null>;
};

const AppDialogsContext = React.createContext<AppDialogsContextValue | null>(
  null,
);

function settlePending(
  pending: PendingResolver | null,
  value: boolean | string | null,
): void {
  if (!pending) return;
  if (pending.kind === "confirm") {
    pending.resolve(value as boolean);
  } else {
    pending.resolve(value as string | null);
  }
}

export function AppDialogsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const t = useTranslation();
  const pendingRef = React.useRef<PendingResolver | null>(null);
  const [dialog, setDialog] = React.useState<ActiveDialog | null>(null);

  const dismiss = React.useCallback((result: boolean | string | null) => {
    settlePending(pendingRef.current, result);
    pendingRef.current = null;
    setDialog(null);
  }, []);

  const preempt = React.useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    settlePending(
      pending,
      pending.kind === "confirm" ? false : null,
    );
    pendingRef.current = null;
    setDialog(null);
  }, []);

  const confirm = React.useCallback(
    (opts: ConfirmDialogOptions): Promise<boolean> => {
      preempt();
      return new Promise<boolean>(resolve => {
        pendingRef.current = { kind: "confirm", resolve };
        setDialog({ kind: "confirm", ...opts });
      });
    },
    [preempt],
  );

  const prompt = React.useCallback(
    (opts: PromptDialogOptions): Promise<string | null> => {
      preempt();
      return new Promise<string | null>(resolve => {
        pendingRef.current = { kind: "prompt", resolve };
        setDialog({
          kind: "prompt",
          ...opts,
          inputValue: opts.defaultValue ?? "",
        });
      });
    },
    [preempt],
  );

  const value = React.useMemo(
    () => ({ confirm, prompt }),
    [confirm, prompt],
  );

  const cancelLabel = dialog?.cancelLabel ?? t.common.cancel;
  const confirmLabel =
    dialog?.confirmLabel ??
    (dialog?.kind === "confirm" ? t.common.confirm : t.common.save);

  const footer =
    dialog === null ? null : (
      <>
        <Button variant="ghost" onClick={() => dismiss(false)}>
          {cancelLabel}
        </Button>
        <Button
          variant={
            dialog.kind === "confirm" && dialog.danger ? "danger" : "primary"
          }
          onClick={() => {
            if (dialog.kind === "confirm") {
              dismiss(true);
            } else {
              dismiss(dialog.inputValue);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </>
    );

  return (
    <AppDialogsContext.Provider value={value}>
      {children}
      {dialog && (
        <Dialog
          open
          onClose={() =>
            dismiss(dialog.kind === "confirm" ? false : null)
          }
          title={dialog.title}
          description={dialog.description}
          footer={footer}
        >
          {dialog.kind === "prompt" && (
            <Input
              autoFocus
              label={dialog.inputLabel}
              value={dialog.inputValue}
              onChange={event => {
                const next = event.target.value;
                setDialog(current =>
                  current?.kind === "prompt"
                    ? { ...current, inputValue: next }
                    : current,
                );
              }}
              onKeyDown={event => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  dismiss(dialog.inputValue);
                }
              }}
            />
          )}
        </Dialog>
      )}
    </AppDialogsContext.Provider>
  );
}

export function useAppDialogs(): AppDialogsContextValue {
  const ctx = React.useContext(AppDialogsContext);
  if (!ctx) {
    throw new Error("useAppDialogs must be used within AppDialogsProvider");
  }
  return ctx;
}
