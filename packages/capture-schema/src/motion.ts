import type { Provenanced } from "./provenance.js";

export type MotionHints = {
  extractorVersion: string;
  canvasOrWebglDetected: boolean;
  animations: MotionAnimation[];
};

export type MotionAnimation = {
  nodeId?: string;
  name: Provenanced<string>;
  durationMs?: Provenanced<number>;
  delayMs?: Provenanced<number>;
  easing?: Provenanced<string>;
  iterationCount?: Provenanced<string>;
  /** CSS transition property if applicable */
  transitionProperty?: Provenanced<string>;
  source: "css_animation" | "css_transition" | "web_animations_api";
};
