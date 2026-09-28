export class InvalidScheduleQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidScheduleQueryError';
  }
}
