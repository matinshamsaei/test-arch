import type { MockMode } from "@application/scheduling/ports";

type MockModeOptionProps = {
  mode: MockMode;
  label: string;
  checked: boolean;
  onSelect: () => void;
};

export function MockModeOption({
  mode,
  label,
  checked,
  onSelect,
}: MockModeOptionProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input
        type="radio"
        name="mock-mode"
        className="size-4 accent-teal-800"
        value={mode}
        checked={checked}
        onChange={onSelect}
      />
      {label}
    </label>
  );
}
