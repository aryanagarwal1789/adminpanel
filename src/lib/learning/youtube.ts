/** Extract an 11-char YouTube video id from any common URL shape, or null. */
export function youTubeIdFrom(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] ?? null;
    if (u.pathname.includes("/embed/"))
      return u.pathname.split("/embed/")[1]?.split(/[/?#]/)[0] ?? null;
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    return null;
  } catch {
    return null;
  }
}

/** ISO 8601 duration ("PT1H5M3S") to the "h:mm:ss" / "mm:ss" format lessons store. */
export function formatIsoDuration(iso: string): string | null {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const h = parseInt(m[1] ?? "0", 10);
  const mi = parseInt(m[2] ?? "0", 10);
  const s = parseInt(m[3] ?? "0", 10);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(mi).padStart(2, "0")}:${ss}` : `${mi}:${ss}`;
}

const YOUTUBE_API_KEY = import.meta.env?.VITE_YOUTUBE_API_KEY ?? "";

/** A YouTube video's duration, formatted; null on any failure (no key, private video...). */
export async function fetchYouTubeDuration(videoId: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return null;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${YOUTUBE_API_KEY}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: { contentDetails?: { duration?: string } }[] };
    const iso = data.items?.[0]?.contentDetails?.duration;
    return iso ? formatIsoDuration(iso) : null;
  } catch {
    return null;
  }
}
