import { API_URL } from "./config";
import { supabase } from "./supabase";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Body = Record<string, unknown> | unknown[] | undefined;

async function request<T>(method: string, path: string, body?: Body): Promise<T> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  const raw = (await res.json().catch(() => ({}))) as {
    error?: string | { issues?: { path?: Array<string | number>; message?: string }[] };
    message?: string;
  };
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (typeof raw.error === "string") {
      message = raw.error;
    } else if (raw.error?.issues && Array.isArray(raw.error.issues)) {
      message = raw.error.issues
        .map((issue) => `${issue.path?.join(".") || "field"}: ${issue.message ?? "is invalid"}`)
        .join(", ");
    } else if (typeof raw.message === "string") {
      message = raw.message;
    }
    throw new ApiError(res.status, message);
  }
  return raw as T;
}

/** The single API client. Every live service call goes through here. */
export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: Body) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body?: Body) => request<T>("PUT", path, body ?? {}),
  patch: <T>(path: string, body?: Body) => request<T>("PATCH", path, body ?? {}),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

/** Uploads a file straight to storage using a signed link from the API. */
export async function uploadToSignedUrl(url: string, file: File) {
  const res = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) throw new ApiError(res.status, `Upload failed for ${file.name}`);
}

export const toKobo = (naira: number) => Math.round(naira * 100);
export const toNaira = (kobo: number) => Math.round(kobo) / 100;
