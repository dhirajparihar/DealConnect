const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiClient {
  public static async logout() {
    await this.request('/public/auth/logout', { method: 'POST' });
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const json = await res.json();
    if (!res.ok) {
      const msg = json.error?.message || 'An error occurred while communicating with server.';
      throw new Error(msg);
    }

    return json.data as T;
  }
}
