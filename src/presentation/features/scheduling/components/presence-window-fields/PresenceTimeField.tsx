import { fieldClass } from "../../../../shared/styles.ts";

type PresenceTimeFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function PresenceTimeField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: PresenceTimeFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>

      <input
        id={id}
        className={`${fieldClass} text-left`}
        dir="ltr"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
