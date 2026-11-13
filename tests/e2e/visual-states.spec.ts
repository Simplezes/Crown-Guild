import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 800 },
  { name: "desktop", width: 1280, height: 800 },
];

async function firstHunterId(page: Page): Promise<string> {
  const response = await page.request.get("/api/wishlist/users?limit=5");
  const data = (await response.json()) as { users: { id: string }[] };
  const id = data.users[0]?.id;
  if (!id) throw new Error("no hunters in database");
  return id;
}

const settle = (page: Page) =>
  page.addStyleTag({
    content: "*,*::before,*::after{animation:none!important;transition:none!important}",
  });

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("profile crowns tab", async ({ page }) => {
      await page.goto(`/profile/${await firstHunterId(page)}`, { waitUntil: "networkidle" });
      await settle(page);
      await expect(page).toHaveScreenshot(`state-profile-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.002,
      });
    });

    test("profile collected tab", async ({ page }) => {
      await page.goto(`/profile/${await firstHunterId(page)}`, { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: /Collected/ }).click();
      await settle(page);
      await expect(page).toHaveScreenshot(`state-profile-collected-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.002,
      });
    });

    test("monster drawer", async ({ page }) => {
      await page.goto("/investigation", { waitUntil: "networkidle" });
      await page.locator(".m2").first().click();
      await page.getByRole("dialog").waitFor();
      await page.waitForLoadState("networkidle");
      await settle(page);
      await expect(page).toHaveScreenshot(`state-drawer-${viewport.name}.png`, {
        maxDiffPixelRatio: 0.002,
      });
    });

    test("command palette", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      await page.keyboard.press("Control+k");
      await page.getByRole("dialog", { name: "Command palette" }).waitFor();
      await page.waitForLoadState("networkidle");
      await settle(page);
      await expect(page).toHaveScreenshot(`state-palette-${viewport.name}.png`, {
        maxDiffPixelRatio: 0.002,
      });
    });

    test("compare picker", async ({ page }) => {
      await page.goto("/compare", { waitUntil: "networkidle" });
      await page.locator(".cmp-pick").first().click();
      await page.getByRole("dialog").waitFor();
      await page.waitForLoadState("networkidle");
      await settle(page);
      await expect(page).toHaveScreenshot(`state-compare-picker-${viewport.name}.png`, {
        maxDiffPixelRatio: 0.002,
      });
    });
  });
}
