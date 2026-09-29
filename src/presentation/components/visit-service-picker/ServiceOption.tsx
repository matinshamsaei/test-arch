import type { Service } from "@domain/scheduling/types";
import { persianDigits } from "../../formatting";

type ServiceOptionProps = {
  service: Service;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
};

export function ServiceOption({
  service,
  checked,
  disabled,
  onToggle,
}: ServiceOptionProps) {
  return (
    <li>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-3">
        <input
          type="checkbox"
          className="size-4 accent-teal-800"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
        />

        <span className="font-medium">{service.title}</span>

        <span className="text-sm text-stone-600">
          {persianDigits(service.durationMinutes)} دقیقه
        </span>
      </label>
    </li>
  );
}
