// A hand-rolled renderer rather than a Markdown library: notes only ever
// need bold text and lists, so a full parser (with its own dependency and
// bundle weight) would be solving a much bigger problem than the one here.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

const BULLET_RE = /^[-*]\s+(.*)$/;
const NUMBERED_RE = /^\d+\.\s+(.*)$/;

export function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim() === "") {
      i++;
      continue;
    }

    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = (lines[i] ?? "").match(BULLET_RE);
        if (!match) break;
        items.push(`<li>${renderInline(match[1] ?? "")}</li>`);
        i++;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    const numberedMatch = line.match(NUMBERED_RE);
    if (numberedMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = (lines[i] ?? "").match(NUMBERED_RE);
        if (!match) break;
        items.push(`<li>${renderInline(match[1] ?? "")}</li>`);
        i++;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i] ?? "";
      if (current.trim() === "" || BULLET_RE.test(current) || NUMBERED_RE.test(current)) break;
      paraLines.push(renderInline(current));
      i++;
    }
    blocks.push(`<p>${paraLines.join("<br />")}</p>`);
  }

  return blocks.join("");
}

export interface TextSelection {
  start: number;
  end: number;
}

export interface ToolbarResult {
  value: string;
  selection: TextSelection;
}

export function applyBold(value: string, sel: TextSelection): ToolbarResult {
  const selected = value.slice(sel.start, sel.end);
  const inner = selected || "bold text";
  const replacement = `**${inner}**`;
  const newValue = value.slice(0, sel.start) + replacement + value.slice(sel.end);

  return {
    value: newValue,
    selection: selected
      ? { start: sel.start, end: sel.start + replacement.length }
      : { start: sel.start + 2, end: sel.start + 2 + inner.length },
  };
}

function applyLinePrefix(value: string, sel: TextSelection, prefixFor: (lineIndex: number) => string): ToolbarResult {
  const lineStart = value.lastIndexOf("\n", sel.start - 1) + 1;
  const nextBreak = value.indexOf("\n", sel.end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;

  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const prefixed = lines.map((line, index) => `${prefixFor(index)}${line}`).join("\n");

  const newValue = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
  const delta = prefixed.length - block.length;

  return { value: newValue, selection: { start: lineStart, end: lineEnd + delta } };
}

export function applyBulletList(value: string, sel: TextSelection): ToolbarResult {
  return applyLinePrefix(value, sel, () => "- ");
}

export function applyNumberedList(value: string, sel: TextSelection): ToolbarResult {
  let n = 1;
  return applyLinePrefix(value, sel, () => `${n++}. `);
}
