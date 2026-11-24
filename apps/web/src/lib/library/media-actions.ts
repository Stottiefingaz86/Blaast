/** Download / clipboard helpers for theater Save · Copy · More menus. */

export async function downloadImageUrl(
  url: string,
  filename: string,
): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    return true;
  } catch {
    return false;
  }
}

/** Prefer clipboard image; fall back to file download. */
export async function copyImageAsPng(
  url: string,
  filename: string,
): Promise<"clipboard" | "download" | "failed"> {
  try {
    const res = await fetch(url);
    if (!res.ok) return "failed";
    let blob = await res.blob();
    if (!blob.type.includes("png")) {
      // ClipboardItem often wants image/png — re-wrap if needed
      blob = new Blob([blob], { type: blob.type || "image/png" });
    }
    if (
      typeof ClipboardItem !== "undefined" &&
      navigator.clipboard &&
      "write" in navigator.clipboard
    ) {
      try {
        const type = blob.type || "image/png";
        await navigator.clipboard.write([
          new ClipboardItem({ [type]: blob }),
        ]);
        return "clipboard";
      } catch {
        /* fall through to download */
      }
    }
    const ok = await downloadImageUrl(url, filename);
    return ok ? "download" : "failed";
  } catch {
    return "failed";
  }
}
