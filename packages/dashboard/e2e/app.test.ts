import { test, expect } from "@playwright/test";

test("signup → login → chat with agent", async ({ page }) => {
  // 1. Load app — should land on login page
  await page.goto("http://localhost:3901");
  await expect(page.locator("text=ClosedClaw")).toBeVisible();

  // 2. Click "Sign up" link
  await page.locator('a:has-text("Sign up"), a[href*="signup"], a[href*="register"]').first().click();
  await page.waitForLoadState("networkidle");

  // 3. Fill signup form (name + email + password)
  const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameInput.fill("E2E Test User");
  }
  await page.fill('input[type="email"]', "e2etest@closedclaw.test");
  await page.fill('input[type="password"]', "E2ePassword123!");
  await page.screenshot({ path: "e2e-signup-form.png" });
  await page.click('button[type="submit"]');

  // 4. After signup should redirect to dashboard/chat
  await page.waitForURL(/dashboard|chat|\/app|^\/$/, { timeout: 10000 }).catch(async () => {
    // Maybe it redirected to login — try logging in
    console.log("Signup redirect not matched, current URL:", page.url());
    await page.screenshot({ path: "e2e-after-signup.png" });
    if (page.url().includes("login") || page.url().includes("signin")) {
      await page.fill('input[type="email"]', "e2etest@closedclaw.test");
      await page.fill('input[type="password"]', "E2ePassword123!");
      await page.click('button[type="submit"]');
      await page.waitForLoadState("networkidle");
    }
  });

  await page.screenshot({ path: "e2e-dashboard.png", fullPage: true });
  console.log("Dashboard URL:", page.url());

  // 5. Find and use chat input
  const chatInput = page.locator('[data-testid="chat-input"]').first();
  await expect(chatInput).toBeVisible({ timeout: 5000 });
  await chatInput.fill("Hello! What tools do you have available? List them briefly.");

  const sendBtn = page.locator('[data-testid="send-button"]').first();
  await sendBtn.click();

  // 6. Wait for agent response (SSE streaming — allow 45s for agent)
  console.log("Waiting for agent response...");
  await page.locator('[data-testid="agent-message"]').first().waitFor({ timeout: 45000 });

  const responseText = await page.locator('[data-testid="agent-message"]').last().innerText();
  console.log("Agent response:", responseText.substring(0, 300));

  await expect(page.locator('[data-testid="agent-message"]').last()).toBeVisible();
  await page.screenshot({ path: "e2e-chat-response.png", fullPage: true });
});
