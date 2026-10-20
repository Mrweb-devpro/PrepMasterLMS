function paramsFromUrl() {
  if (typeof window === "undefined") return new URLSearchParams();
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  hash.forEach((value, key) => {
    if (!search.has(key)) search.set(key, value);
  });
  return search;
}

/** Detect Supabase's expired or already-used email-link response. */
export function hasInvalidAuthLink() {
  const params = paramsFromUrl();
  if (params.get("authLink") === "invalid") return true;
  const code = params.get("error_code") ?? "";
  const message = [params.get("error"), params.get("error_description")].filter(Boolean).join(" ");
  return code === "otp_expired" || /(?:email|verification|recovery|reset) link.*(?:invalid|expired|used)|otp.*(?:invalid|expired)/i.test(message);
}

/** Removes provider error data once the destination page has displayed its guidance. */
export function clearAuthLinkError() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, "", window.location.pathname);
}

