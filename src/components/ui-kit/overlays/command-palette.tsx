"use client";

import * as React from "react";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

export interface CommandItem {
  label: string;
  icon?: IconName;
  meta?: string;
  kbd?: string;
  onSelect?: () => void;
}

export interface CommandGroup {
  label?: string;
  items: CommandItem[];
}

export interface CommandPaletteProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  placeholder?: string;
  groups: CommandGroup[];
}

export function CommandPalette({
  open,
  onClose,
  placeholder = "Search or run a command…",
  groups = [],
  className = "",
  ...rest
}: CommandPaletteProps): React.JSX.Element | null {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const flat: CommandItem[] = [];
  const filteredGroups = groups
    .map((g) => {
      const items = g.items.filter((it) =>
        it.label.toLowerCase().includes(query.toLowerCase())
      );
      items.forEach((it) => flat.push(it));
      return { ...g, items };
    })
    .filter((g) => g.items.length > 0);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  React.useEffect(() => { setActive(0); }, [query]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, flat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        const it = flat[active];
        if (it) { it.onSelect?.(); onClose?.(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, flat, active, onClose]);

  if (!open) return null;

  let idx = -1;

  return (
    <div
      className="sf-cmd-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`sf-cmd${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        {...rest}
      >
        <div className="sf-cmd__search">
          <Icon name="search" size={17} style={{ color: "var(--text-tertiary)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
          />
          <span className="sf-cmd__esc">ESC</span>
        </div>

        <div className="sf-cmd__list">
          {filteredGroups.length === 0 && (
            <div className="sf-cmd__empty">No results for &ldquo;{query}&rdquo;</div>
          )}
          {filteredGroups.map((g, gi) => (
            <div key={gi}>
              {g.label && <div className="sf-cmd__group-label">{g.label}</div>}
              {g.items.map((it, ii) => {
                idx++;
                const isActive = idx === active;
                const myIdx = idx;
                return (
                  <div
                    key={ii}
                    className={`sf-cmd__item${isActive ? " sf-cmd__item--active" : ""}`}
                    onMouseEnter={() => setActive(myIdx)}
                    onClick={() => { it.onSelect?.(); onClose?.(); }}
                  >
                    <span className="sf-cmd__item-ico">
                      <Icon name={it.icon ?? "circle"} size={16} />
                    </span>
                    <span className="sf-cmd__item-label">{it.label}</span>
                    {it.meta && <span className="sf-cmd__item-meta">{it.meta}</span>}
                    {it.kbd && <span className="sf-cmd__item-kbd">{it.kbd}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sf-cmd__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
