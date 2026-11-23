/** How a captured or extracted claim was obtained. */
export type Provenance = "measured" | "observed" | "inferred" | "unavailable";

export type Provenanced<T> = {
  value: T;
  provenance: Provenance;
  /** Required when provenance is inferred */
  confidence?: number;
  method?: string;
  extractorVersion?: string;
};
