import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/investigation",
  "/compare",
  "/signin",
  "/terms",
  "/privacy",
  "/monster/Rathalos",
];
const VIEWPORTS = [
  { name: "mobile", width: 375, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "desktop", width: 1280, height: 800 },
];

for (const viewport of VIEWPORTS) {
  for (const route of ROUTES) {
    test(`visual ${route} @ ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.addStyleTag({
        content: "*,*::before,*::after{animation:none!important;transition:none!important}",
      });
      await expect(page).toHaveScreenshot(
        `${route === "/" ? "home" : route.replace(/\W+/g, "-")}-${viewport.name}.png`,
        {
          fullPage: true,
          maxDiffPixelRatio: 0.002,
        },
      );
    });
  }
}
