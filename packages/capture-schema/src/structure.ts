import type { Provenanced } from "./provenance.js";

/** Cap how many nodes we store per step to keep bundles small. */
export const MAX_STRUCTURE_NODES = 120;

export type StructureSnapshot = {
  capturedAt: string;
  documentTitle: string;
  /** CSS custom properties measured on html/theme roots */
  cssVariables: CssVariable[];
  nodes: StructureNode[];
  stylesAvailability: "dom" | "mixed" | "unavailable";
  extractorVersion: string;
};

export type CssVariable = {
  name: string;
  /** Resolved value when measurable */
  value: Provenanced<string>;
  source: "documentElement" | "theme_root" | "element";
};

export type StructureNode = {
  nodeId: string;
  tag: string;
  role?: string;
  /** Stable-ish selector path without attribute values that may hold secrets */
  selectorHint: string;
  /** Truncated visible text; never from password/payment inputs */
  textPreview?: string;
  box: BoundingBox;
  styles: MeasuredStyles;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Only allowlisted computed properties — all measured when present. */
export type MeasuredStyles = {
  display?: string;
  position?: string;
  color?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  borderRadius?: string;
  borderTopWidth?: string;
  borderTopColor?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  gap?: string;
  boxShadow?: string;
  opacity?: string;
  zIndex?: string;
  transform?: string;
  overflow?: string;
};

export const MEASURED_STYLE_KEYS = [
  "display",
  "position",
  "color",
  "backgroundColor",
  "backgroundImage",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "borderRadius",
  "borderTopWidth",
  "borderTopColor",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "gap",
  "boxShadow",
  "opacity",
  "zIndex",
  "transform",
  "overflow",
] as const satisfies readonly (keyof MeasuredStyles)[];
