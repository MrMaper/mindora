"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Input } from "@/components/ui-kit/forms/input";
import { getCommentsAction, createComment, updateComment, deleteComment } from "@/features/comments/actions";
import { getAttachmentsAction, uploadAttachment, deleteAttachment } from "@/features/attachments/actions";
import { EDIT_WINDOW_MS } from "@/features/comments/types";
import { useTranslation } from "@/i18n/provider";
import type { CommentRow } from "@/features/comments/types";
import type { AttachmentRow } from "@/features/attachments/types";
import type { UserRow } from "@/features/users/types";

interface TaskCommentsProps {
  taskId: string;
  currentUserId: string;
  users: UserRow[];
}

export function TaskComments({
  taskId,
  currentUserId,
  users,
}: TaskCommentsProps) {
  const t = useTranslation();
  const [comments, setComments] = React.useState<CommentRow[]>([]);
  const [attachments, setAttachments] = React.useState<AttachmentRow[]>([]);
  const [draft, setDraft] = React.useState("");
  const [draftMentions, setDraftMentions] = React.useState<Record<string, string>>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function loadComments() {
    const data = await getCommentsAction(taskId);
    setComments(data);
  }
  async function loadAttachments() {
    setIsLoadingAttachments(true);
    const data = await getAttachmentsAction(taskId);
    setAttachments(data);
    setIsLoadingAttachments(false);
  }
  React.useEffect(() => {
    loadComments();
    loadAttachments();
  }, [taskId]);

  function canEdit(c: CommentRow) {
    return c.user.id === currentUserId && Date.now() - new Date(c.createdAt).getTime() < EDIT_WINDOW_MS;
  }
  function canDelete(c: CommentRow) {
    return c.user.id === currentUserId;
  }

  async function onPost() {
    if (!draft.trim()) return;
    setIsPending(true);
    const fd = new FormData();
    fd.append("body", draft);
    Object.entries(draftMentions).forEach(([key, val]) => fd.append("mentions", `${key}:${val}`));
    const res = await createComment(taskId, fd);
    if (res.success) {
      setDraft("");
      setDraftMentions({});
      loadComments();
    }
    setIsPending(false);
  }
  async function startEdit(c: CommentRow) {
    setEditingId(c.id);
    setEditDraft(c.body);
  }
  async function saveEdit(c: CommentRow) {
    if (!editDraft.trim()) return;
    const fd = new FormData();
    fd.append("body", editDraft);
    const res = await updateComment(c.id, fd);
    if (res.success) {
      setEditingId(null);
      setEditDraft("");
      loadComments();
    }
  }
  async function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }
  async function onDeleteComment(c: CommentRow) {
    if (!confirm(t.comments.delete)) return;
    const res = await deleteComment(c.id);
    if (res.success) loadComments();
  }

  async function onUploadAttachment(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadAttachment(taskId, fd);
    if (res.success) loadAttachments();
  }
  async function onDeleteAttachment(a: AttachmentRow) {
    if (!confirm(t.comments.delete)) return;
    const res = await deleteAttachment(a.id);
    if (res.success) loadAttachments();
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) onUploadAttachment(e.target.files[0]);
    e.target.value = "";
  }

  function selectMention(user: UserRow) {
    const mentionKey = `@${user.name}`;
    setDraft(prev => prev + mentionKey + " ");
    setDraftMentions(prev => ({ ...prev, [mentionKey]: user.id }));
    textareaRef.current?.focus();
  }
  function handleDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
  }

  function formatDate(date: Date | string) {
    return new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* ── Attachments ──────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)" }}>
            {t.comments.attachments}
          </span>
          <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
          <Button variant="ghost" size="sm" icon="paperclip" loading={isLoadingAttachments} onClick={() => fileInputRef.current?.click()}>
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
                <IconButton icon="trash" aria-label={t.common.delete} size="sm" onClick={() => onDeleteAttachment(a)} />
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
              const user = users.find(u => u.id === comment.user.id);
              const isEditing = editingId === comment.id;
              return (
                <div key={comment.id} style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-3)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", background: "var(--bg-surface)" }}>
                  <Avatar name={user?.name ?? "Unknown"} src={user?.avatar ?? undefined} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        <textarea
                          ref={textareaRef}
                          value={editDraft}
                          onChange={e => setEditDraft(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          style={{ width: "100%" }}
                        />
                        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                          <Button size="sm" variant="primary" loading={isPending} onClick={() => saveEdit(comment)}>
                            {t.comments.save}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            {t.comments.cancel}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
                          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                            {user?.name ?? "Unknown"}
                          </span>
                          <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}>
                            {formatDate(comment.createdAt)}
                          </span>
                          {comment.edited && (
                            <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}>
                              {t.comments.edited}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", whiteSpace: "pre-wrap", marginTop: 2 }}>
                          {comment.body}
                        </div>
                        {(canEdit(comment) || canDelete(comment)) && (
                          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                            {canEdit(comment) && (
                              <button
                                type="button"
                                onClick={() => startEdit(comment)}
                                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}
                              >
                                {t.comments.edit}
                              </button>
                            )}
                            {canDelete(comment) && (
                              <button
                                type="button"
                                onClick={() => onDeleteComment(comment)}
                                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}
                              >
                                {t.comments.delete}
                              </button>
                            )}
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
          <textarea
            ref={textareaRef}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-vertical"
            rows={3}
            placeholder={t.comments.placeholder}
            value={draft}
            onChange={handleDraftChange}
            style={{ width: "100%", resize: "vertical" }}
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