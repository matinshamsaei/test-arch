import type { Service } from "@domain/scheduling/types";
import { persianDigits, serviceTitle } from "../../formatting";
import { secondaryButtonClass } from "../../styles.ts";

type VisitOrderRowProps = {
  serviceId: string;
  rank: number;
  services: readonly Service[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  locked: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function VisitOrderRow({
  serviceId,
  rank,
  services,
  canMoveUp,
  canMoveDown,
  locked,
  onMoveUp,
  onMoveDown,
}: VisitOrderRowProps) {
  const title = serviceTitle(services, serviceId);

  return (
    <li className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-stone-50 px-3">
      <span>
        {persianDigits(rank)}. {title}
      </span>

      <span className="flex gap-2">
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={locked || !canMoveUp}
          aria-label={`انتقال ${title} به بالا`}
          onClick={onMoveUp}
        >
          بالا
        </button>

        <button
          type="button"
          className={secondaryButtonClass}
          disabled={locked || !canMoveDown}
          aria-label={`انتقال ${title} به پایین`}
          onClick={onMoveDown}
        >
          پایین
        </button>
      </span>
    </li>
  );
}
