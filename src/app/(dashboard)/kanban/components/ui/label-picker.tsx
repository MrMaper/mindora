"use client";

import * as React from "react";
import { Tag } from "@/components/ui-kit/data-display/tag";
import { cn } from "@/lib/utils";
import type { LabelRow } from "@/features/labels/types";

interface LabelPickerProps {
  labels: LabelRow[];
  selected: string[];
  onToggle: (id: string) => void;
  title: string;
  addLabel: string;
}

export function LabelPicker({
  labels,
  selected,
  onToggle,
  title,
  addLabel,
}: LabelPickerProps) {
  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-caps text-text-tertiary mb-2">
        {title}
      </div>
      {labels.length === 0 ? (
        <div className="text-sm text-text-tertiary">{addLabel}</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {labels.map(l => {
            const active = selected.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onToggle(l.id)}
                className={cn(
                  "opacity-45 hover:opacity-100 transition-opacity",
                  active && "opacity-100"
                )}
              >
                <Tag color={l.color}>{l.name}</Tag>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}