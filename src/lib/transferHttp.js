// Small helpers shared by the /api/transfer route handlers.

export const json = (body, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Browsers send Origin on POST and DELETE; rejecting foreign ones keeps other
 * websites from using the endpoint through their visitors.
 */
export const isSameOrigin = (request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Not a browser cross-site request.
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
};
