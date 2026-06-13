/**
 * Unwrap the backend ApiResponse envelope: { success, data, error }.
 */
export async function apiFetch(url, options) {
  const res = await fetch(url, options);
  const body = await res.json();

  if (!res.ok || body.success === false) {
    const message =
      body.error?.message ||
      (typeof body.detail === 'string' ? body.detail : null) ||
      'Request failed';
    throw new Error(message);
  }

  return body.data ?? body;
}
