"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { hasModule, type ModuleFlags } from "@/lib/modules";
import { cn } from "@/lib/utils";
import {
  guideCopy,
  type GuideBlock,
  type GuideCopy,
  type GuideSection,
} from "@/features/guide/content";

type Access = "open" | "off" | "member-only";

function sectionAccess(
  section: GuideSection,
  isAdmin: boolean,
  flags: ModuleFlags | null,
): Access {
  if (isAdmin && section.href) return "member-only";
  if (section.module && section.module !== "dashboard" && flags && !hasModule(flags, section.module)) {
    return "off";
  }
  return "open";
}

function blockText(block: GuideBlock): string {
  if (block.type === "steps") return [block.title, ...block.items].join(" ");
  if (block.type === "details") {
    return [block.title, ...block.items.flatMap(item => [item.name, item.body])].join(" ");
  }
  if (block.type === "tip") return block.body;
  return block.items.map(item => item.label).join(" ");
}

function matches(section: GuideSection, query: string) {
  if (!query) return true;
  const haystack = [section.group, section.title, section.summary, ...section.blocks.map(blockText)]
    .join(" ")
    .toLocaleLowerCase();
  return haystack.includes(query);
}

export function GuideView({
  language,
  isAdmin,
  flags,
}: {
  language: "FA" | "EN";
  isAdmin: boolean;
  flags: ModuleFlags | null;
}) {
  const copy = guideCopy(language);
  const fa = language === "FA";
  const [query, setQuery] = React.useState("");
  const [activeId, setActiveId] = React.useState(copy.sections[0]?.id ?? "");
  const [showTop, setShowTop] = React.useState(false);
  const normalized = query.trim().toLocaleLowerCase();
  const sections = React.useMemo(
    () => copy.sections.filter(section => isAdmin || !section.adminOnly),
    [copy.sections, isAdmin],
  );
  const visible = React.useMemo(
    () => sections.filter(section => matches(section, normalized)),
    [sections, normalized],
  );

  const groups = React.useMemo(() => {
    const order: string[] = [];
    for (const section of visible) {
      if (!order.includes(section.group)) order.push(section.group);
    }
    return order.map(group => ({
      group,
      sections: visible.filter(section => section.group === group),
    }));
  }, [visible]);

  React.useEffect(() => {
    const root = document.querySelector("main");
    const nodes = visible
      .map(section => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!root || nodes.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        const visibleEntries = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visibleEntries[0]?.target.id;
        if (top) setActiveId(top);
      },
      { root, rootMargin: "-10% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  React.useEffect(() => {
    const main = document.querySelector("main");
    const onScroll = () => {
      const top = Math.max(window.scrollY, main?.scrollTop ?? 0);
      setShowTop(top > 480);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    main?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      main?.removeEventListener("scroll", onScroll);
    };
  }, []);

  function jump(id: string) {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToTop() {
    const main = document.querySelector("main");
    if (main && main.scrollTop > 0) main.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const num = (value: number) => value.toLocaleString(fa ? "fa-IR" : "en-US");

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
          {copy.kicker}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
          {copy.intro}
        </p>
      </header>

      {isAdmin ? (
        <p className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm leading-7">
          {copy.adminBanner}
        </p>
      ) : null}

      <section className="mt-6" aria-label={copy.startTitle}>
        <h2 className="mb-2 text-xs font-medium text-muted-foreground">{copy.startTitle}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {copy.starts.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => jump(item.id)}
              className="rounded-xl border bg-card p-3 text-start transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-[11px] font-semibold text-primary">{num(index + 1)}</span>
              <span className="mt-1 block text-sm font-medium">{item.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.text}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="relative mt-6">
        <Icon
          name="search"
          size={15}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          aria-label={copy.searchPlaceholder}
          className="h-11 w-full rounded-xl border bg-card ps-9 pe-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <nav
          aria-label={copy.tocLabel}
          className="sticky top-0 z-20 -mx-3 border-b bg-background/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4 lg:top-2 lg:mx-0 lg:max-h-[calc(100dvh-1.5rem)] lg:overflow-y-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
        >
          <div className="flex gap-1.5 overflow-x-auto lg:block lg:space-y-4">
            {groups.map(group => (
              <div key={group.group} className="flex shrink-0 gap-1.5 lg:block lg:space-y-0.5">
                <div className="hidden px-2.5 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground/80 uppercase lg:block">
                  {group.group}
                </div>
                {group.sections.map(section => {
                  const active = section.id === activeId;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => jump(section.id)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium lg:flex lg:w-full lg:rounded-md lg:px-2.5 lg:py-1.5 lg:text-[13px]",
                        active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground lg:bg-transparent",
                      )}
                      aria-current={active ? "true" : undefined}
                    >
                      {section.title}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <div className="mt-5 min-w-0 space-y-4 lg:mt-0">
          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              {copy.searchEmpty}
            </p>
          ) : (
            visible.map(section => (
              <SectionCard
                key={section.id}
                section={section}
                index={sections.findIndex(item => item.id === section.id)}
                access={sectionAccess(section, isAdmin, flags)}
                copy={copy}
                fa={fa}
              />
            ))
          )}
        </div>
      </div>

      {showTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={copy.backToTop}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-5 z-30 flex size-11 items-center justify-center rounded-full border bg-card text-foreground shadow-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="arrow-up" size={18} />
        </button>
      ) : null}
    </div>
  );
}

function SectionCard({
  section,
  index,
  access,
  copy,
  fa,
}: {
  section: GuideSection;
  index: number;
  access: Access;
  copy: GuideCopy;
  fa: boolean;
}) {
  const num = (value: number) => value.toLocaleString(fa ? "fa-IR" : "en-US");
  const showOpen = access === "open" && Boolean(section.href);

  return (
    <article
      id={section.id}
      className="scroll-mt-16 rounded-2xl border bg-card p-4 sm:scroll-mt-6 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {num(index + 1)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
            {section.adminOnly ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {copy.adminBadge}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{section.summary}</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {section.blocks.map((block, blockIndex) => (
          <BlockView key={blockIndex} block={block} fa={fa} />
        ))}
      </div>

      {showOpen && section.href ? (
        <Link
          href={section.href}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {copy.open}
          <Icon name={fa ? "chevron-left" : "chevron-right"} size={14} />
        </Link>
      ) : null}
      {access === "off" ? <Note>{copy.off}</Note> : null}
    </article>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 rounded-lg bg-muted/70 px-3 py-2 text-xs leading-6 text-muted-foreground">
      {children}
    </p>
  );
}

function BlockView({ block, fa }: { block: GuideBlock; fa: boolean }) {
  const num = (value: number) => value.toLocaleString(fa ? "fa-IR" : "en-US");

  if (block.type === "steps") {
    return (
      <div>
        <h3 className="text-sm font-semibold">{block.title}</h3>
        <ol className="mt-2 space-y-2">
          {block.items.map((item, index) => (
            <li key={item} className="flex gap-2.5 text-sm leading-6">
              <span className="mt-0.5 w-5 shrink-0 text-xs font-semibold text-primary">
                {num(index + 1)}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (block.type === "details") {
    return (
      <div>
        <h3 className="text-sm font-semibold">{block.title}</h3>
        <dl className="mt-2 divide-y rounded-xl border">
          {block.items.map(item => (
            <div key={item.name} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
              <dt className="text-sm font-medium">{item.name}</dt>
              <dd className="text-sm leading-6 text-muted-foreground">{item.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (block.type === "tip") {
    return (
      <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm leading-7">
        {block.body}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {block.items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-accent"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
