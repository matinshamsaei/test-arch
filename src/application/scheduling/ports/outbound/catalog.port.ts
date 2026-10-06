import type { Service } from "@domain/scheduling/types";

export interface CatalogPort {
  getServices(): Promise<readonly Service[]>;
}
