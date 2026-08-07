import { WEEKDAY_LABELS } from "@sandboxanita1/core";

// "single" is used for weekly/fortnightly/four-weekly — picking a day
// there is purely a convenience for computing the first due date
// (nothing is persisted), so choosing a new one replaces the selection.
// "multi" is used for daily, where the selection *is* the persisted rule
// restricting which weekdays it fires on.
export function DayOfWeekPicker({
  mode,
  value,
  onChange,
}: {
  mode: "single" | "multi";
  value: number[];
  onChange: (days: number[]) => void;
}) {
  function toggle(day: number) {
    if (mode === "single") {
      onChange([day]);
      return;
    }
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b));
  }

  return (
    <div className="chip-group" role="group" aria-label="Day of week">
      {WEEKDAY_LABELS.map((label, day) => (
        <button
          key={day}
          type="button"
          className={`chip ${value.includes(day) ? "active" : ""}`}
          aria-pressed={value.includes(day)}
          onClick={() => toggle(day)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
