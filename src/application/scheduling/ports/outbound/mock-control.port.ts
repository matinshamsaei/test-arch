export type MockMode =
  | "normal"
  | "out-of-order"
  | "transient-error"
  | "capacity-conflict";

export interface MockControlPort {
  setMode(mode: MockMode): void;
  reset(): void;
}
