export const homepageUrl = process.env.HOMEPAGE_URL ?? "http://localhost:3100";

export const playwrightModule = process.env.PLAYWRIGHT_MODULE ?? "playwright";

export const browserExecutables = {
  chromium: process.env.CHROMIUM_EXECUTABLE,
  webkit: process.env.WEBKIT_EXECUTABLE,
};
