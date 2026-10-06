export interface HttpClientOptions {
  readonly baseUrl: string;
  readonly getAccessToken?: () => string | null;
}

export interface HttpRequest {
  readonly path: string;
  readonly method?: "GET" | "POST" | "PUT" | "DELETE";
  readonly query?: Record<string, unknown>;
  readonly body?: unknown;
}

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export interface HttpClient {
  request<T>(init: HttpRequest): Promise<T>;
}

function buildQuery(query: Record<string, unknown> | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item == null) continue;
        params.append(key, String(item));
      }
      continue;
    }
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  return {
    async request<T>(init: HttpRequest): Promise<T> {
      const method = init.method ?? "GET";
      const token = options.getAccessToken?.() ?? null;
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (init.body !== undefined) {
        headers["Content-Type"] = "application/json";
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${baseUrl}${init.path}${buildQuery(init.query)}`,
        {
          method,
          headers,
          body: init.body === undefined ? undefined : JSON.stringify(init.body),
          cache: "no-cache",
        },
      );

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new HttpError(
          response.status,
          text || `Request failed with status ${response.status}.`,
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const text = await response.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    },
  };
}
