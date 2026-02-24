import type { Database } from "bun:sqlite";
import { getClientForUser } from "./gateway-pool.js";

export async function provisionGatewayAgent(
  userId: string,
  gatewayUrl: string,
  gatewayToken: string | undefined,
  userName: string,
  db: Database
): Promise<void> {
  try {
    const client = getClientForUser(userId, { url: gatewayUrl, token: gatewayToken });
    const result = await client.createAgent({ name: userName });
    const agentId = (result as Record<string, unknown>)?.["agentId"] as string | undefined
      ?? (result as Record<string, unknown>)?.["id"] as string | undefined;

    db.prepare("UPDATE agents SET openclaw_agent_id = ?, status = 'connected', last_connected_at = datetime('now') WHERE user_id = ?")
      .run(agentId ?? null, userId);
  } catch (err) {
    db.prepare("UPDATE agents SET status = 'error' WHERE user_id = ?").run(userId);
    console.error(`Gateway provision failed for user ${userId}:`, err instanceof Error ? err.message : String(err));
  }
}
