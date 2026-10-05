const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dealconnect_token');
    }
    return null;
  }

  public static setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dealconnect_token', token);
    }
  }

  public static clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dealconnect_token');
    }
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();
    if (!res.ok) {
      const msg = json.error?.message || 'An error occurred while communicating with server.';
      throw new Error(msg);
    }

    return json.data as T;
  }
}
