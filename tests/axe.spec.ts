import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

// テスト対象のページ一覧
const pages = [
  { path: '/', name: 'home' },
  {
    path: '/blog/2024102902_astro-playwright-axe/',
    name: '/blog/2024102902_astro-playwright-axe/',
  },
];

function violationFingerprints(accessibilityScanResults) {
  const violationFingerprints = accessibilityScanResults.violations.map((violation) => ({
    rule: violation.id,
    targets: violation.nodes.map((node) => node.target),
  }));
  return JSON.stringify(violationFingerprints, null, 2);
}

/**
 * @axe-core/playwright
 * https://github.com/dequelabs/axe-core-npm/blob/master/packages/playwright/README.md
 */
for (const { path, name } of pages) {
  test(`a11y test - ${name}`, async ({ page }) => {
    await page.goto(`http://localhost:4321${path}`);

    const viewport = page.viewportSize();
    const viewportLabel = viewport.width === 1440 ? 'desktop' : 'mobile';

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(`Accessibility violations found on ${name} (${viewportLabel}):`);
      console.log(violationFingerprints(results));
    }

    expect(
      results.violations.length,
      `Accessibility violations found on ${name} (${viewportLabel})`,
    ).toBe(0);
  });
}
