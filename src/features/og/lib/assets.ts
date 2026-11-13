import { readFile } from "node:fs/promises";
import path from "node:path";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

export async function urlToDataUrl(url: string, fallbackMime = "image/png"): Promise<string> {
  const parsed = new URL(url);
  if (LOCAL_HOSTS.has(parsed.hostname)) {
    const file = path.join(process.cwd(), "public", parsed.pathname.replace(/^\//, ""));
    return `data:${fallbackMime};base64,${toBase64(new Uint8Array(await readFile(file)))}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load image: ${url}`);
  const mime = response.headers.get("content-type") || fallbackMime;
  return `data:${mime};base64,${toBase64(new Uint8Array(await response.arrayBuffer()))}`;
}

export async function validMonsterImages(baseUrl: string, names: string[]): Promise<Set<string>> {
  const checks = await Promise.all(
    names.map(async (name) => {
      try {
        const response = await fetch(`${baseUrl}/monsters/${name}`, { method: "HEAD" });
        return (response.headers.get("content-type") || "").includes("webp") ? null : name;
      } catch {
        return null;
      }
    }),
  );
  return new Set(checks.filter((name): name is string => !!name));
}

export async function loadAvatar(
  avatarUrl: string | null | undefined,
  baseUrl: string,
): Promise<string> {
  const fallback = `${baseUrl}/icons/MHWilds-Quest_Members_Icon.png`;
  if (avatarUrl) {
    try {
      return await urlToDataUrl(avatarUrl.replace(/\.(gif|webp)(\?.*)?$/, ".png"));
    } catch {
      return urlToDataUrl(fallback);
    }
  }
  return urlToDataUrl(fallback);
}
