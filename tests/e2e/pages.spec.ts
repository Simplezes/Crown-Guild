import AxeBuilder from "@axe-core/playwright";
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
    test(`${route} @ ${viewport.name}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
      page.on("pageerror", (error) => errors.push(error.message));

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, "horizontal overflow").toBeLessThanOrEqual(1);

      const slug = route === "/" ? "home" : route.replace(/\W+/g, "-").replace(/^-|-$/g, "");
      await page.screenshot({ path: `.audit/${slug}-${viewport.name}.png`, fullPage: true });

      const axe = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
      const serious = axe.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

      expect(errors).toEqual([]);
    });
  }
}
