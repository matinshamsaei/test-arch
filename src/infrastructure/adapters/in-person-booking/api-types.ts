/** Wire shapes mirrored from physician-panel BookingPanel APIs. */

export const BookStatus = {
  Reserved: 1,
  AwaitingPayment: 2,
  Confirmed: 3,
  Rejected: 4,
  Cancelled: 5,
  Completed: 6,
} as const;

export const BookingType = {
  InPerson: 4,
  Services: 5,
} as const;

export const FilterType = {
  CurrentDay: 1,
  CurrentWeek: 2,
  CurrentMonth: 3,
  All: 4,
} as const;

export const ACTIVE_BOOKING_STATUSES = [
  BookStatus.Reserved,
  BookStatus.AwaitingPayment,
  BookStatus.Confirmed,
] as const;

export const IN_PERSON_BOOKING_TYPES = [
  BookingType.InPerson,
  BookingType.Services,
] as const;

export interface ApiInPersonBooking {
  readonly orderCode: string;
  readonly patient: {
    readonly name: string;
    readonly phoneNumber: string;
  };
  readonly bookingType: {
    readonly id: number;
    readonly name: string;
  };
  readonly bookStatus: {
    readonly id: number;
    readonly name: string;
  };
}

export interface GetInPersonBookingsListResponse {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly queryResult: readonly ApiInPersonBooking[];
}

export interface GetDoctorResponse {
  readonly recId: number;
}

export const endpoints = {
  getAll: "/BookingPanel/GetAll",
  completed: "/BookingPanel/Completed",
  cancelled: "/BookingPanel/Cancelled",
  getDoctor: "/Panel/Doctor/GetDoctor",
} as const;
