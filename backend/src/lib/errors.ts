export class AppError extends Error {
  constructor(public status: 400 | 401 | 402 | 403 | 404 | 409 | 500, message: string) {
    super(message);
  }
}

export const badRequest = (m: string) => new AppError(400, m);
export const unauthorized = (m = "Please sign in.") => new AppError(401, m);
export const forbidden = (m = "You don't have access to this.") => new AppError(403, m);
export const notFound = (m = "Not found.") => new AppError(404, m);
export const conflict = (m: string) => new AppError(409, m);

/** Throws on Supabase errors so services can stay linear. */
export function must<T>(res: { data: T | null; error: { message: string } | null }, notFoundMsg?: string): T {
  if (res.error) throw new AppError(500, res.error.message);
  if (res.data === null) throw notFound(notFoundMsg);
  return res.data;
}
