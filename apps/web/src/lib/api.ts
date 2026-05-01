const API_PREFIX = '/api';

function getAccess() {
  return localStorage.getItem('access_token');
}

function setAccess(token: string | null) {
  if (token) localStorage.setItem('access_token', token);
  else localStorage.removeItem('access_token');
}

export async function refreshAccess(): Promise<boolean> {
  const res = await fetch(`${API_PREFIX}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { accessToken: string };
  setAccess(data.accessToken);
  return true;
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  }
  const token = getAccess();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_PREFIX}${path}`, { ...init, headers, credentials: 'include' });
  if (res.status === 401 && retry) {
    const ok = await refreshAccess();
    if (ok) return api<T>(path, init, false);
  }
  if (!res.ok) {
    const text = await res.text();
    let msg = text?.trim() || res.statusText;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json') && text) {
      try {
        const j = JSON.parse(text) as { message?: string | string[]; error?: string };
        if (typeof j.message === 'string') msg = j.message;
        else if (Array.isArray(j.message)) msg = j.message.join(', ');
        else if (typeof j.error === 'string' && j.error !== 'Internal Server Error') msg = j.error;
      } catch {
        /* keep msg */
      }
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const authStorage = { getAccess, setAccess };
