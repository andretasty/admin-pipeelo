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

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.queue = [];
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

  async createTenantAccount(data: TenantData) {
    const url = this.baseUrl + "/tenants";
    const csrfToken = this.getCsrfToken();
    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (csrfToken) {
      headers['X-CSRF-TOKEN'] = csrfToken;
    }

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

  async login(email: string, password: string) {
    const url = this.baseUrl + "/auth/login";
    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer juZDRV3tKwjYQi3okvieXFPiOXpXkiinYUnnVXCC83f84a00",
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        "Failed to login: " +
          response.status +
          " " +
          response.statusText +
          " - " +
          errorBody
      );
    }

    return response.json();
  }

  async getPermanentToken(token: string) {
    const url = this.baseUrl + "/permanent-token";
    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        "Failed to obtain permanent token: " +
          response.status +
          " " +
          response.statusText +
          " - " +
          errorBody
      );
    }

    return response.json();
  }
}
