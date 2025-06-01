const API_BASE_URL = "https://api.pipeelo.com/v1";

interface TenantData {
  tenant: {
    name: string;
    document: string;
    phone_number: string;
    address: {
      street: string;
      number: string;
      neighborhood: string;
      country: string;
      state: string;
      city: string;
      complement?: string;
      postal_code: string;
    };
  };
  user: {
    name: string;
    email: string;
    password: string;
    document: string;
  };
  gateway: string;
}

export class ExternalApiClient {
  private baseUrl: string;
  private queue: Array<() => Promise<any>>;
  private authToken: string | null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.queue = [];
    this.authToken = null;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  enqueueRequest(requestFn: () => Promise<any>) {
    this.queue.push(requestFn);
  }

  async executeQueue() {
    const results = [];
    for (const requestFn of this.queue) {
      try {
        const result = await requestFn();
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error });
      }
    }
    this.queue = [];
    return results;
  }

  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') {
      return null; // Not in a browser environment
    }
    const tokenElement = document.querySelector('meta[name="csrf-token"]');
    return tokenElement ? tokenElement.getAttribute('content') : null;
  }

  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const csrfToken = this.getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-TOKEN"] = csrfToken;
    }

    return headers;
  }

  async createTenantAccount(data: TenantData) {
    const url = this.baseUrl + "/tenants";
    const headers = this.buildHeaders();

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error("Failed to create tenant account: " + response.status + " " + response.statusText + " - " + errorBody);
    }

    return response.json();
  }

  async updateOpenAI(token: string) {
    if (!this.authToken) {
      throw new Error("Authorization token not set");
    }
    const response = await fetch(`${this.baseUrl}/openai`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to update OpenAI key: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    return response.json();
  }

  async updateOpenRouter(token: string) {
    if (!this.authToken) {
      throw new Error("Authorization token not set");
    }
    const response = await fetch(`${this.baseUrl}/open-router`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to update OpenRouter key: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    return response.json();
  }
}
