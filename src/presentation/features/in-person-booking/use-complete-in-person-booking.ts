import { useMutation, useQueryClient } from "@tanstack/react-query";

import { inPersonBooking } from "@composition/in-person-booking.ts";

import { messageFor } from "./messages.ts";
import { inPersonBookingQueryKeys } from "./query-keys.ts";

export function useCompleteInPersonBooking() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [...inPersonBookingQueryKeys.all, "complete"],
    mutationFn: (orderCode: string) =>
      inPersonBooking.complete.execute(orderCode),
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
