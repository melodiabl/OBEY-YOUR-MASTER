export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code) }
}
export async function request<T>(url: string, { signal, csrfToken, body }: { signal?: AbortSignal; csrfToken?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', signal,
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
    body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data || data.ok === false) throw new ApiError(response.status, typeof data?.error === 'string' ? data.error : 'request_failed')
  return data as T
}
