export const inPersonBookingQueryKeys = {
  all: ["in-person-booking"] as const,
  activeList: () => [...inPersonBookingQueryKeys.all, "active-list"] as const,
};
