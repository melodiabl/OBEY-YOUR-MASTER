export class ApiError extends Error {
  constructor(public status: number, public code: string, public details: { fields?: string[]; current?: unknown; accessRevoked?: boolean } = {}) { super(code) }
}
export async function request<T>(url: string, { signal, csrfToken, body, method }: { signal?: AbortSignal; csrfToken?: string; body?: unknown; method?: 'POST' | 'PUT' } = {}): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', signal,
    method: body === undefined ? 'GET' : method || 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
    body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data || data.ok === false) throw new ApiError(response.status, typeof data?.error === 'string' ? data.error : 'request_failed', {
    fields: Array.isArray(data?.fields) ? data.fields.filter((field: unknown) => field === 'channelId' || field === 'message') : [],
    current: data?.current, accessRevoked: data?.accessRevoked === true,
  })
  return data as T
}
