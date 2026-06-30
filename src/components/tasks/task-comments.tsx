"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { getCommentsAction, createComment, updateComment, deleteComment } from "@/features/comments/actions";
import { getAttachmentsAction, uploadAttachment, deleteAttachment } from "@/features/attachments/actions";
import { EDIT_WINDOW_MS } from "@/features/comments/types";
import { getTranslations } from "@/i18n";
import type { CommentRow } from "@/features/comments/types";
import type { AttachmentRow } from "@/features/attachments/types";
import type { UserRow } from "@/features/users/types";
import type { Language } from "@/types/db";

interface TaskCommentsProps {
  taskId: string;
  currentUserId: string;
  users: UserRow[];
  language: Language;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderBody(body: string, users: UserRow[]): React.ReactNode {
  if (users.length === 0) return body;
  const names = [...users]
    .map(u => u.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  if (names.length === 0) return body;

  const re = new RegExp(`@(${names.join("|")})\\b`, "g");
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(body)) !== null) {
    if (match.index > lastIndex) parts.push(body.slice(lastIndex, match.index));
    parts.push(
      <span key={key++} style={{ color: "var(--text-link)", fontWeight: "var(--weight-medium)" }}>
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) parts.push(body.slice(lastIndex));
  return parts;
}

function timeAgo(date: Date, language: Language): string {
  return new Date(date).toLocaleString(language === "FA" ? "fa-IR" : undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskComments({ taskId, currentUserId, users, language }: TaskCommentsProps) {
  const t = getTranslations(language);

  const [comments, setComments] = React.useState<CommentRow[] | null>(null);
  const [attachments, setAttachments] = React.useState<AttachmentRow[] | null>(null);
  const [draft, setDraft] = React.useState("");
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [uploading, setUploading] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const reload = React.useCallback(async () => {
    const [c, a] = await Promise.all([getCommentsAction(taskId), getAttachmentsAction(taskId)]);
    setComments(c);
    setAttachments(a);
  }, [taskId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [c, a] = await Promise.all([getCommentsAction(taskId), getAttachmentsAction(taskId)]);
      if (!cancelled) {
        setComments(c);
        setAttachments(a);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  function handleDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setDraft(value);
    const cursor = e.target.selectionStart ?? value.length;
    const upToCursor = value.slice(0, cursor);
    const atIndex = upToCursor.lastIndexOf("@");
    if (atIndex === -1) {
      setMentionQuery(null);
      return;
    }
    const afterAt = upToCursor.slice(atIndex + 1);
    if (/\s/.test(afterAt)) {
      setMentionQuery(null);
      return;
    }
    setMentionQuery(afterAt);
  }

  function selectMention(user: UserRow) {
    const cursor = textareaRef.current?.selectionStart ?? draft.length;
    const upToCursor = draft.slice(0, cursor);
    const atIndex = upToCursor.lastIndexOf("@");
    if (atIndex === -1) return;
    const before = draft.slice(0, atIndex);
    const after = draft.slice(cursor);
    setDraft(`${before}@${user.name} ${after}`);
    setMentionQuery(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  const mentionMatches = mentionQuery !== null
    ? users.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)
    : [];

  function onPost() {
    if (!draft.trim()) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("body", draft.trim());
      const result = await createComment(taskId, fd);
      if (!result.success) {
        setError(result.error ?? "Failed to post comment.");
        return;
      }
      setDraft("");
      await reload();
    });
  }

  function startEdit(comment: CommentRow) {
    setEditingId(comment.id);
    setEditDraft(comment.body);
    setError(null);
  }

  function onSaveEdit(commentId: string) {
    if (!editDraft.trim()) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("body", editDraft.trim());
      const result = await updateComment(commentId, fd);
      if (!result.success) {
        setError(result.error ?? "Failed to update comment.");
        return;
      }
      setEditingId(null);
      await reload();
    });
  }

  function onDeleteComment(commentId: string) {
    startTransition(async () => {
      const result = await deleteComment(commentId);
      if (!result.success) setError(result.error ?? "Failed to delete comment.");
      else await reload();
    });
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadAttachment(taskId, fd);
    setUploading(false);
    if (!result.success) {
      setError(result.error ?? "Upload failed.");
      return;
    }
    await reload();
  }

  function onDeleteAttachment(attachmentId: string) {
    startTransition(async () => {
      await deleteAttachment(attachmentId);
      await reload();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {error && (
        <div className="auth-card__alert auth-card__alert--error" role="alert">
          {error}
        </div>
      )}

      {/* ── Attachments ──────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)" }}>
            {t.comments.attachments}
          </span>
          <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />
          <Button variant="ghost" size="sm" icon="paperclip" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            {t.comments.addAttachment}
          </Button>
        </div>
        {!attachments || attachments.length === 0 ? (
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{t.comments.noAttachments}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {attachments.map(a => (
              <div
                key={a.id}
                style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-1) var(--space-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-control)" }}
              >
                <Icon name="paperclip" size={13} />
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "var(--text-sm)", color: "var(--text-link)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {a.filename}
                </a>
                <IconButton icon="trash" aria-label={t.common.delete} size="sm" onClick={() => onDeleteAttachment(a.id)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Comments ─────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", marginBottom: "var(--space-2)" }}>
          {t.comments.title}
        </div>

        {!comments || comments.length === 0 ? (
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }}>
            {t.comments.noComments}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
            {comments.map(comment => {
              const canEdit = comment.user.id === currentUserId;
              const withinWindow = new Date().getTime() - new Date(comment.createdAt).getTime() <= EDIT_WINDOW_MS;
              return (
                <div key={comment.id} style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Avatar name={comment.user.name} src={comment.user.avatar ?? undefined} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                        {comment.user.name}
                      </span>
                      <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}>
                        {timeAgo(comment.createdAt, language)}
                        {comment.edited && ` ${t.comments.edited}`}
                      </span>
                    </div>

                    {editingId === comment.id ? (
                      <div style={{ marginTop: "var(--space-1)" }}>
                        <textarea
                          className="sf-textarea"
                          rows={2}
                          value={editDraft}
                          onChange={e => setEditDraft(e.target.value)}
                          style={{ width: "100%" }}
                        />
                        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                          <Button size="sm" variant="primary" loading={isPending} onClick={() => onSaveEdit(comment.id)}>
                            {t.comments.save}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            {t.comments.cancel}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", whiteSpace: "pre-wrap", marginTop: 2 }}>
                          {renderBody(comment.body, users)}
                        </div>
                        {canEdit && (
                          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                            {withinWindow && (
                              <button
                                type="button"
                                onClick={() => startEdit(comment)}
                                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}
                              >
                                {t.comments.edit}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteComment(comment.id)}
                              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}
                            >
                              {t.comments.delete}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Composer ───────────────────────────────────────────── */}
        <div style={{ position: "relative" }}>
          {mentionMatches.length > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                insetInlineStart: 0,
                marginBottom: 4,
                width: 220,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-control)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
                zIndex: 5,
              }}
            >
              {mentionMatches.map(u => (
                <div
                  key={u.id}
                  onMouseDown={e => {
                    e.preventDefault();
                    selectMention(u);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2)", cursor: "pointer" }}
                >
                  <Avatar name={u.name} src={u.avatar ?? undefined} size="sm" />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{u.name}</span>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            className="sf-textarea"
            rows={3}
            placeholder={t.comments.placeholder}
            value={draft}
            onChange={handleDraftChange}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
          <Button variant="primary" size="sm" loading={isPending} disabled={!draft.trim()} onClick={onPost}>
            {t.comments.post}
          </Button>
        </div>
      </div>
    </div>
  );
}
