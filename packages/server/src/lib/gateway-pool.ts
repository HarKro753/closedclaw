import { OpenClawClient } from "./openclaw-client.js";

interface GatewayConfig {
  url: string;
  token?: string;
}

const pool = new Map<string, OpenClawClient>();

export function getClientForUser(userId: string, config: GatewayConfig): OpenClawClient {
  const existing = pool.get(userId);
  if (existing) {
    return existing;
  }
  const client = new OpenClawClient(config.url, { authToken: config.token });
  pool.set(userId, client);
  return client;
}

export function evictClient(userId: string): void {
  const client = pool.get(userId);
  if (client) {
    client.disconnect();
    pool.delete(userId);
  }
}

export function evictAllClients(): void {
  for (const client of pool.values()) {
    client.disconnect();
  }
  pool.clear();
}
