import { useQuery } from "@tanstack/react-query";

import { inPersonBooking } from "@composition/in-person-booking.ts";

import { messageFor } from "./messages.ts";
import { inPersonBookingQueryKeys } from "./query-keys.ts";

export function useActiveInPersonBookings() {
  const query = useQuery({
    queryKey: inPersonBookingQueryKeys.activeList(),
    queryFn: () => inPersonBooking.listActive.execute(),
    refetchInterval: 10_000,
    refetchOnMount: "always",
  });

  return {
    ...query,
    items: query.data ?? [],
    loadError: query.error ? messageFor(query.error) : null,
  };
}
