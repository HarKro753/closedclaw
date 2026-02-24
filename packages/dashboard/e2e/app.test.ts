import { test, expect } from "@playwright/test";

test("signup → login → chat with agent", async ({ page }) => {
  await page.goto("http://localhost:3848");

  const signupLink = page
    .locator('a[href*="signup"], a[href*="register"], [data-testid="signup-link"]')
    .first();
  if (await signupLink.isVisible()) {
    await signupLink.click();
  }

  await page.fill('input[type="email"]', "e2e@closedclaw.test");
  await page.fill('input[type="password"]', "E2ePassword123!");
  await page.click('button[type="submit"]');

  await page.waitForURL(/dashboard|chat|app/, { timeout: 10000 });

  const input = page.locator('[data-testid="chat-input"]');
  await input.fill("Hello! What tools do you have available?");
  await page.locator('[data-testid="send-button"]').click();

  await page.locator('[data-testid="agent-message"]').last().waitFor({ timeout: 30000 });
  await expect(page.locator('[data-testid="agent-message"]').last()).toBeVisible();

  await page.screenshot({ path: "e2e-result.png", fullPage: true });
});
