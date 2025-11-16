import { test, expect } from '@playwright/test';

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog.';
const SAMPLE_TEXT_CN = `打字练习：
这是一个包含换行符的示例文本。
每一行结束后都会有一个换行符。
你可以通过按回车键来输入它们。
这样可以练习在实际使用中的换行操作。`;

test.describe('svelte-typerank3 baseline', () => {
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
    page.on('console', (message) => {
      if (message.type() === 'error') {
        console.error(`Browser console error: ${message.text()}`);
      }
    });
  });

  test('初始统计值为 0', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#cpm')).toHaveText('0');
    await expect(page.locator('#total-cpm')).toHaveText('0');
    await expect(page.locator('#wpm')).toHaveText('0');
    await expect(page.locator('#accuracy')).toHaveText('100%');
    await expect(page.locator('#char-count')).toHaveText('0');
  });

  test('完成英文练习后可查看结果', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#text-display span');
    await page.click('#text-display');
    await page.keyboard.type(SAMPLE_TEXT);
    await expect(page.locator('#result-modal')).toBeVisible();
    await expect(page.locator('#final-accuracy')).toHaveText('100%');
    await expect(page.locator('#final-char-count')).toHaveText(String(SAMPLE_TEXT.length));
    await expect(page.locator('#final-cpm')).not.toHaveText('0');
    await expect(page.locator('#final-total-cpm')).not.toHaveText('0');
  });

  test('完成中文多行文本', async ({ page }) => {
    await page.goto('/');
    const textIndex = await page.evaluate((target) => {
      const list = Array.isArray(window.texts) ? window.texts : [];
      return list.findIndex((entry) => entry === target);
    }, SAMPLE_TEXT_CN);
    expect(textIndex).toBeGreaterThanOrEqual(0);

    await page.goto(`/?text=${textIndex}`);
    await page.waitForSelector('#text-display span');
    await page.click('#text-display');
    await page.keyboard.type(SAMPLE_TEXT_CN);

    await expect(page.locator('#result-modal')).toBeVisible();
    await expect(page.locator('#final-accuracy')).toHaveText('100%');
    await expect(page.locator('#final-char-count')).toHaveText(String(SAMPLE_TEXT_CN.length));
  });

  test('输入错误并撤回后准确率恢复', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#text-display span');
    await page.click('#text-display');

    await page.keyboard.type('T');
    await page.keyboard.type('x');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(SAMPLE_TEXT.slice(1));

    await expect(page.locator('#result-modal')).toBeVisible();
    await expect(page.locator('#final-accuracy')).toHaveText('100%');
  });

  test('语言切换会更新文案', async ({ page }) => {
    await page.goto('/');
    const englishButton = page.locator('.language-option[data-lang="en-US"]');
    await englishButton.click();
    await expect(englishButton).toHaveClass(/active/);
    await expect(page.locator('.stat-item:nth-child(2)')).toContainText('Accuracy');
  });

  test('主题切换会添加主题类名', async ({ page }) => {
    await page.goto('/');
    const nordButton = page.locator('.theme-option[data-theme="nord"]');
    await nordButton.click();
    await expect(page.locator('body')).toHaveClass(/theme-nord/);
  });

  test('移动端视口会触发滚动', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/?text=3');
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
