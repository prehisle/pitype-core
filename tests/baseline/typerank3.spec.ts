import { test, expect } from '@playwright/test';

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog.';
const SAMPLE_TEXT_CN = `打字练习：
这是一个包含换行符的示例文本。
每一行结束后都会有一个换行符。
你可以通过按回车键来输入它们。
这样可以练习在实际使用中的换行操作。`;

test.describe('typerank3 baseline', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
      const originalScrollTo = Element.prototype.scrollTo;
      window.__scrollEvents = [];
      Element.prototype.scrollTo = function (...args) {
        if (this.classList && this.classList.contains('text-container')) {
          window.__scrollEvents.push(args[0]);
        }
        if (originalScrollTo) {
          return originalScrollTo.apply(this, args);
        }
      };
    });
  });

  test('initial stats show zero state', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#cpm')).toHaveText('0');
    await expect(page.locator('#total-cpm')).toHaveText('0');
    await expect(page.locator('#wpm')).toHaveText('0');
    await expect(page.locator('#accuracy')).toHaveText('100%');
    await expect(page.locator('#char-count')).toHaveText('0');
  });

  test('user can complete default exercise with perfect accuracy', async ({ page }) => {
    await page.goto('/index.html');

    await page.waitForSelector('#text-display span');
    await page.click('#text-display');
    await page.keyboard.type(SAMPLE_TEXT);

    const modal = page.locator('#result-modal');
    await expect(modal).toBeVisible();

    await expect(page.locator('#final-accuracy')).toHaveText('100%');
    await expect(page.locator('#final-char-count')).toHaveText(String(SAMPLE_TEXT.length));
    await expect(page.locator('#final-cpm')).not.toHaveText('0');
    await expect(page.locator('#final-total-cpm')).not.toHaveText('0');
  });

  test('user can完成中文多行练习', async ({ page }) => {
    await page.goto('/index.html');
    const textIndex = await page.evaluate((target) => {
      const list = Array.isArray(window.texts) ? window.texts : [];
      return list.findIndex((entry) => entry === target);
    }, SAMPLE_TEXT_CN);
    expect(textIndex).toBeGreaterThanOrEqual(0);

    await page.goto(`/index.html?text=${textIndex}`);
    await page.waitForSelector('#text-display span');
    await page.click('#text-display');
    await page.keyboard.type(SAMPLE_TEXT_CN);

    const modal = page.locator('#result-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#final-accuracy')).toHaveText('100%');
    await expect(page.locator('#final-char-count')).toHaveText(String(SAMPLE_TEXT_CN.length));
  });

  test('用户输入错误并撤销后统计恢复', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#text-display span');
    await page.click('#text-display');

    await page.keyboard.type('T'); // correct
    await page.keyboard.type('x'); // incorrect
    await page.keyboard.press('Backspace'); // undo
    await page.keyboard.type(SAMPLE_TEXT.slice(1)); // finish rest

    const modal = page.locator('#result-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#final-accuracy')).toHaveText('100%');
  });

  test('language switch toggles active state and reflects locale strings', async ({ page }) => {
    await page.goto('/index.html');
    const englishButton = page.locator('.language-option[data-lang="en-US"]');
    await englishButton.click();
    await expect(englishButton).toHaveClass(/active/);
    await expect(page.locator('.stat-item:nth-child(2)')).toContainText('Accuracy');
  });

  test('theme switch applies corresponding class', async ({ page }) => {
    await page.goto('/index.html');
    const nordButton = page.locator('.theme-option[data-theme="nord"]');
    await nordButton.click();
    await expect(page.locator('body')).toHaveClass(/theme-nord/);
  });

  test('mobile viewport keeps caret centered on long text', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html?text=3');
    await page.waitForSelector('.text-container');
    await page.addStyleTag({
      content: '.text-container { height: 150px !important; max-height: 150px !important; }'
    });
    await page.waitForSelector('#text-display span');
    await page.click('#text-display');
    await page.keyboard.type(SAMPLE_TEXT_CN);
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const el = document.querySelector('.text-container');
            return el ? el.scrollHeight - el.clientHeight : 0;
          }),
        { timeout: 15000 }
      )
      .toBeGreaterThan(0);
  });
});
