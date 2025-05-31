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

  async createTenantAccount(data: TenantData) {
    const url = this.baseUrl + "/tenants";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error("Failed to create tenant account: " + response.status + " " + response.statusText + " - " + errorBody);
    }

    return response.json();
  }
}
