import type { InPersonBookingDependencies } from "@application/in-person-booking/dependencies.ts";
import { createCancelInPersonBooking } from "@application/in-person-booking/use-cases/cancel-booking.ts";
import { createCompleteInPersonBooking } from "@application/in-person-booking/use-cases/complete-booking.ts";
import { createListActiveInPersonBookings } from "@application/in-person-booking/use-cases/list-active-bookings.ts";
import type { InPersonBookingRepository } from "@application/in-person-booking/repositories";
import { createHttpInPersonBookingApi } from "@infrastructure/adapters/in-person-booking/http-api.ts";
import { createInMemoryInPersonBookingApi } from "@infrastructure/adapters/in-person-booking/in-memory-api.ts";
import { createHttpClient, readAccessToken } from "@infrastructure/http";

export type InPersonBookingTransport = "memory" | "http";

export interface InPersonBookingContainerOptions {
  readonly transport?: InPersonBookingTransport;
  readonly baseUrl?: string;
  readonly providerId?: string;
  readonly accessToken?: string | null;
}

function resolveTransport(
  options: InPersonBookingContainerOptions,
): InPersonBookingTransport {
  if (options.transport) return options.transport;
  const baseUrl = options.baseUrl ?? import.meta.env.VITE_BASE_URL;
  return baseUrl?.trim() ? "http" : "memory";
}

function createRepository(
  options: InPersonBookingContainerOptions,
): InPersonBookingRepository {
  const transport = resolveTransport(options);
  if (transport === "memory") {
    return createInMemoryInPersonBookingApi();
  }

  const baseUrl = (options.baseUrl ?? import.meta.env.VITE_BASE_URL)?.trim();
  if (!baseUrl) {
    throw new Error(
      "VITE_BASE_URL is required when in-person booking transport is http.",
    );
  }

  const http = createHttpClient({
    baseUrl,
    getAccessToken: () =>
      options.accessToken === undefined
        ? readAccessToken()
        : options.accessToken,
  });

  return createHttpInPersonBookingApi({
    http,
    providerId:
      options.providerId ?? import.meta.env.VITE_PROVIDER_ID?.trim() ?? undefined,
  });
}

export function createInPersonBookingContainer(
  options: InPersonBookingContainerOptions = {},
): InPersonBookingDependencies {
  const api = createRepository(options);

  return {
    listActive: createListActiveInPersonBookings(api),
    complete: createCompleteInPersonBooking(api),
    cancel: createCancelInPersonBooking(api),
  };
}

/** App-wide use cases for presentation React Query hooks (no React context). */
export const inPersonBooking = createInPersonBookingContainer();
