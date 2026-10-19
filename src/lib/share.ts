import { toast } from "@/stores/toast";

/** Native share when available, otherwise copy the text to the clipboard. */
export async function share(text: string, path?: string) {
  const url = typeof window !== "undefined" && path ? window.location.origin + path : undefined;
  try {
    if (typeof navigator !== "undefined" && navigator.share) await navigator.share({ title: "PR Show", text, url });
    else { await navigator.clipboard.writeText(url ? `${text} ${url}` : text); toast.success("Copied to clipboard"); }
  } catch { /* share sheet dismissed */ }
}
