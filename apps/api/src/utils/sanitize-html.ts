import sanitize from "sanitize-html";

/**
 * Sanitise note HTML content before storing in the database.
 *
 * Allows all tags and attributes produced by the TipTap editor while
 * stripping dangerous elements (<script>, on* handlers, javascript: URLs).
 */
export function sanitizeNoteContent(html: string): string {
  return sanitize(html, {
    // ── Allowed tags ─────────────────────────────────────────
    allowedTags: [
      // Block elements
      "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "pre", "code", "br", "hr", "div",

      // Inline formatting
      "strong", "em", "u", "s", "del", "sub", "sup", "span",

      // Lists (regular + task lists)
      "ul", "ol", "li", "input",

      // Links
      "a",

      // Tables
      "table", "thead", "tbody", "tfoot", "tr", "td", "th", "colgroup", "col",

      // Media
      "img", "audio", "source", "iframe",

      // Math (KaTeX output)
      "math", "semantics", "mrow", "mi", "mo", "mn", "msup", "msub",
      "mfrac", "msqrt", "mover", "munder", "mtable", "mtr", "mtd",
      "mtext", "mspace", "annotation",
    ],

    // ── Allowed attributes ───────────────────────────────────
    allowedAttributes: {
      "*": [
        "class", "id",
        "data-note-id", "data-note-title",
        "data-type", "data-checked",
        "style",
      ],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      audio: ["src", "controls", "preload"],
      source: ["src", "type"],
      iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      col: ["span", "width"],
      input: ["type", "checked", "disabled"],
      code: ["class"],
      pre: ["class"],
      ol: ["start", "type"],
      annotation: ["encoding"],
    },

    // ── Allowed inline styles ────────────────────────────────
    // TipTap uses inline styles for text color, highlight, and alignment
    allowedStyles: {
      "*": {
        color: [/.*/],
        "background-color": [/.*/],
        "text-align": [/^(left|center|right|justify)$/],
      },
    },

    // ── URL filtering ────────────────────────────────────────
    allowedSchemes: ["http", "https", "mailto", "noteflow"],

    allowedIframeHostnames: [
      "www.youtube.com",
      "www.youtube-nocookie.com",
      "youtube.com",
      "youtube-nocookie.com",
    ],

    // Don't strip disallowed tags' text content — only remove the tags
    disallowedTagsMode: "discard",
  });
}
