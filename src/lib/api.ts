/** Fetch JSON while preserving a useful error when a proxy/server returns HTML. */
export async function fetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    const text = await response.text();
    const detail = text.trim().startsWith("<!DOCTYPE")
      ? "The server returned an HTML page instead of API JSON."
      : `The server returned ${contentType || "an unknown content type"} instead of JSON.`;
    throw new Error(`${detail} (${response.status} ${response.statusText})`);
  }

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
}
