import { useMutation, useQueryClient } from "@tanstack/react-query";

import { inPersonBooking } from "@composition/in-person-booking.ts";
import type { CancellationReason } from "@domain/in-person-booking/types";

import { messageFor } from "./messages.ts";
import { inPersonBookingQueryKeys } from "./query-keys.ts";

export interface CancelInPersonBookingVariables {
  readonly orderCode: string;
  readonly reason: CancellationReason;
}

export function useCancelInPersonBooking() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [...inPersonBookingQueryKeys.all, "cancel"],
    mutationFn: (variables: CancelInPersonBookingVariables) =>
      inPersonBooking.cancel.execute(variables),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: inPersonBookingQueryKeys.activeList(),
      });
    },
  });

  return {
    ...mutation,
    actionError: mutation.error ? messageFor(mutation.error) : null,
  };
}
