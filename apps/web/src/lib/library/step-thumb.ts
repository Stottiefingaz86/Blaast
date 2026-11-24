/**
 * Pick a representative frame for journey mosaics / carousel thumbs.
 * Early frames of signup/event clips are often still Home — bias later.
 */
export function stepThumbSeekMs(step: {
  label?: string;
  atMs?: number;
  clipWindow?: { startMs: number; endMs: number };
  durationMs?: number;
}): number {
  if (step.atMs != null && Number.isFinite(step.atMs)) {
    return Math.max(200, Math.round(step.atMs));
  }

  const label = (step.label ?? "").toLowerCase();
  const start = step.clipWindow?.startMs ?? 0;
  const end =
    step.clipWindow?.endMs ??
    step.durationMs ??
    (start > 0 ? start + 8000 : 12000);
  const span = Math.max(800, end - start);

  // Form / register: researcher usually lands later after home chrome
  if (/form|filled|sign-?up steps|register|sign up$/.test(label)) {
    return Math.round(start + span * 0.7);
  }
  // Event / lobby / game: skip open transition
  if (/event|betslip|lobby|game|match|tracker|promotions|vip|deposit/.test(label)) {
    return Math.round(start + span * 0.4);
  }
  // Default: mid window (or ~2.5s into clip)
  if (step.clipWindow) {
    return Math.round(start + span * 0.45);
  }
  return 2500;
}

export function stepThumbSeekSec(
  step: Parameters<typeof stepThumbSeekMs>[0],
): number {
  return Math.max(0.2, stepThumbSeekMs(step) / 1000);
}
