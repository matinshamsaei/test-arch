import {
  DIFFERENT_CLINIC_GAP_MINUTES,
  SAME_CLINIC_GAP_MINUTES,
} from "../constants.ts";

export function requiredGapMinutes(
  previousClinicId: string,
  nextClinicId: string,
): number {
  return previousClinicId === nextClinicId
    ? SAME_CLINIC_GAP_MINUTES
    : DIFFERENT_CLINIC_GAP_MINUTES;
}
