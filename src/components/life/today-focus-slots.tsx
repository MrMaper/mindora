"use client";

import * as React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { formatNumber, cn } from "@/lib/utils";
import { focusPickGroup } from "@/features/life/focus-slots";
import type { TaskRow } from "@/features/tasks/types";

export function TodayFocusSlots({
  slots,
  candidates,
  todayKey,
  disabled,
  onPlace,
  onDone,
  onOpen,
}: {
  slots: (TaskRow | null)[];
  candidates: TaskRow[];
  todayKey: string;
  disabled?: boolean;
  onPlace: (index: number, taskId: string | null) => void;
  onDone: (taskId: string) => void;
  onOpen: (task: TaskRow) => void;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const [openPicker, setOpenPicker] = React.useState<number | null>(null);

  return (
    <ol className="flex flex-1 flex-col justify-center gap-2 px-3 py-3">
      {[0, 1, 2].map(index => {
        const task = slots[index] ?? null;
        const number = formatNumber(index + 1, language);
        const label = t.dashboard.focusSlot.replace("{n}", number);
        return (
          <FocusSlot
            key={index}
            index={index}
            number={number}
            label={label}
            task={task}
            disabled={disabled}
            pickerOpen={openPicker === index}
            candidates={candidates}
            todayKey={todayKey}
            pickLabel={t.dashboard.focusPick}
            emptyPick={t.dashboard.focusPickEmpty}
            overdueLabel={t.dashboard.focusPickOverdue}
            todayLabel={t.dashboard.focusPickToday}
            undatedLabel={t.dashboard.focusPickUndated}
            doneLabel={t.dashboard.markDone}
            removeLabel={t.dashboard.focusRemove}
            onOpenPicker={() => setOpenPicker(openPicker === index ? null : index)}
            onClosePicker={() => setOpenPicker(null)}
            onPlace={taskId => {
              setOpenPicker(null);
              onPlace(index, taskId);
            }}
            onDone={() => task && onDone(task.id)}
            onOpen={() => task && onOpen(task)}
            onRemove={() => onPlace(index, null)}
          />
        );
      })}
    </ol>
  );
}

function FocusSlot({
  index,
  number,
  label,
  task,
  disabled,
  pickerOpen,
  candidates,
  todayKey,
  pickLabel,
  emptyPick,
  overdueLabel,
  todayLabel,
  undatedLabel,
  doneLabel,
  removeLabel,
  onOpenPicker,
  onClosePicker,
  onPlace,
  onDone,
  onOpen,
  onRemove,
}: {
  index: number;
  number: string;
  label: string;
  task: TaskRow | null;
  disabled?: boolean;
  pickerOpen: boolean;
  candidates: TaskRow[];
  todayKey: string;
  pickLabel: string;
  emptyPick: string;
  overdueLabel: string;
  todayLabel: string;
  undatedLabel: string;
  doneLabel: string;
  removeLabel: string;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onPlace: (taskId: string) => void;
  onDone: () => void;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `focus:${index}` });
  const done = task?.status === "DONE";

  return (
    <li
      ref={setNodeRef}
      className={cn(
        "relative min-h-14 min-w-0 rounded-lg border px-2.5 py-2",
        isOver ? "border-primary bg-primary/5" : "border-border-default bg-bg-sunken/40",
        done && "border-emerald-600/30 bg-emerald-500/5",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            done
              ? "bg-emerald-600 text-white"
              : "bg-background text-muted-foreground border",
          )}
        >
          {done ? "✓" : number}
        </span>
        {task ? (
          <FilledSlot
            task={task}
            done={!!done}
            disabled={disabled}
            doneLabel={doneLabel}
            removeLabel={removeLabel}
            onDone={onDone}
            onOpen={onOpen}
            onRemove={onRemove}
          />
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <button
              type="button"
              disabled={disabled}
              onMouseDown={event => event.stopPropagation()}
              onClick={onOpenPicker}
              className="mt-0.5 text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              + {pickLabel}
            </button>
          </div>
        )}
      </div>
      {pickerOpen && !task ? (
        <Picker
          candidates={candidates}
          todayKey={todayKey}
          emptyPick={emptyPick}
          overdueLabel={overdueLabel}
          todayLabel={todayLabel}
          undatedLabel={undatedLabel}
          onPlace={onPlace}
          onClose={onClosePicker}
        />
      ) : null}
    </li>
  );
}

function FilledSlot({
  task,
  done,
  disabled,
  doneLabel,
  removeLabel,
  onDone,
  onOpen,
  onRemove,
}: {
  task: TaskRow;
  done: boolean;
  disabled?: boolean;
  doneLabel: string;
  removeLabel: string;
  onDone: () => void;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task:${task.id}`,
    disabled: disabled || done,
  });

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1", isDragging && "opacity-40")}>
      <button
        type="button"
        ref={setNodeRef}
        className="shrink-0 cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-accent disabled:cursor-default"
        aria-label={task.title}
        disabled={disabled || done}
        {...listeners}
        {...attributes}
      >
        <Icon name="grip-vertical" size={14} />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "min-w-0 flex-1 text-start text-sm font-medium truncate hover:text-primary",
          done && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </button>
      {done ? null : (
        <button
          type="button"
          disabled={disabled}
          onClick={onDone}
          className="shrink-0 rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
        >
          {doneLabel}
        </button>
      )}
      <IconButton
        icon="x"
        size="sm"
        aria-label={removeLabel}
        disabled={disabled}
        onClick={onRemove}
      />
    </div>
  );
}

function pickAreaLabel(
  area: TaskRow["area"],
  labels: { phd: string; lang: string; work: string; life: string },
): string | null {
  if (area === "PHD") return labels.phd;
  if (area === "LANG") return labels.lang;
  if (area === "WORK") return labels.work;
  if (area === "LIFE") return labels.life;
  return null;
}

function Picker({
  candidates,
  todayKey,
  emptyPick,
  overdueLabel,
  todayLabel,
  undatedLabel,
  onPlace,
  onClose,
}: {
  candidates: TaskRow[];
  todayKey: string;
  emptyPick: string;
  overdueLabel: string;
  todayLabel: string;
  undatedLabel: string;
  onPlace: (taskId: string) => void;
  onClose: () => void;
}) {
  const t = useTranslation();
  const ref = React.useRef<HTMLDivElement>(null);
  const areaLabels = {
    phd: t.dashboard.areaPhd,
    lang: t.dashboard.areaLang,
    work: t.dashboard.areaWork,
    life: t.dashboard.areaLife,
  };

  React.useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose();
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute inset-x-2 top-full z-20 mt-1 max-h-52 overflow-auto rounded-lg border bg-popover p-1 shadow-md"
    >
      {candidates.length === 0 ? (
        <p className="px-2 py-3 text-xs text-muted-foreground">{emptyPick}</p>
      ) : (
        [
          { label: overdueLabel, tasks: candidates.filter(task => focusPickGroup(task, todayKey) === "overdue") },
          { label: todayLabel, tasks: candidates.filter(task => focusPickGroup(task, todayKey) === "today") },
          { label: undatedLabel, tasks: candidates.filter(task => focusPickGroup(task, todayKey) === "undated") },
        ].map(group =>
          group.tasks.length === 0 ? null : (
            <div key={group.label} className="py-1">
              <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              {group.tasks.map(task => {
                const area = pickAreaLabel(task.area, areaLabels);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onPlace(task.id)}
                    className="block w-full truncate rounded-md px-2 py-2 text-start text-sm hover:bg-accent"
                  >
                    {task.title}
                    {area ? (
                      <span className="text-muted-foreground"> · {area}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ),
        )
      )}
    </div>
  );
}
