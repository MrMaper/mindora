import { Node, mergeAttributes } from "@tiptap/core";

export interface FootnoteOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    footnote: {
      insertFootnote: (text?: string) => ReturnType;
    };
  }
}

/**
 * Inline footnote marker. Content is stored in data-footnote;
 * rendered as a superscript number.
 */
export const Footnote = Node.create<FootnoteOptions>({
  name: "footnote",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      "data-footnote": {
        default: "",
        parseHTML: el => el.getAttribute("data-footnote") ?? "",
        renderHTML: attrs => ({
          "data-footnote": attrs["data-footnote"] || "",
        }),
      },
      "data-fn-index": {
        default: "1",
        parseHTML: el => el.getAttribute("data-fn-index") ?? "1",
        renderHTML: attrs => ({
          "data-fn-index": attrs["data-fn-index"] || "1",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "sup[data-footnote]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const index = String(HTMLAttributes["data-fn-index"] ?? "1");
    return [
      "sup",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "doc-footnote",
        title: HTMLAttributes["data-footnote"] || undefined,
      }),
      index,
    ];
  },

  addCommands() {
    return {
      insertFootnote:
        (text = "") =>
        ({ chain, state }) => {
          let max = 0;
          state.doc.descendants(node => {
            if (node.type.name === "footnote") {
              const n = Number(node.attrs["data-fn-index"] ?? 0);
              if (n > max) max = n;
            }
          });
          const next = String(max + 1);
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                "data-footnote": text || `پاورقی ${next}`,
                "data-fn-index": next,
              },
            })
            .run();
        },
    };
  },
});
