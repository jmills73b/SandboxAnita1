import { applyBold, applyBulletList, applyNumberedList, type TextSelection } from "./markdown";

export function MarkdownToolbar({
  textareaRef,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
}) {
  function apply(fn: (value: string, sel: TextSelection) => { value: string; selection: TextSelection }) {
    const el = textareaRef.current;
    if (!el) return;
    const sel = { start: el.selectionStart, end: el.selectionEnd };
    const result = fn(el.value, sel);
    onChange(result.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selection.start, result.selection.end);
    });
  }

  return (
    <div className="notes-toolbar" role="toolbar" aria-label="Formatting">
      <button type="button" className="secondary" onClick={() => apply(applyBold)}>
        <strong>B</strong>
      </button>
      <button type="button" className="secondary" onClick={() => apply(applyBulletList)}>
        • List
      </button>
      <button type="button" className="secondary" onClick={() => apply(applyNumberedList)}>
        1. List
      </button>
    </div>
  );
}
