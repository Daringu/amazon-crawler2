import { Page } from 'puppeteer';
import { delay } from 'src/lib/delay';

/**
 * Imitates human-like behavior on a Puppeteer page.
 * Only mouse movements and scrolling, no clicks or typing.
 */
export async function imitateHuman(
  page: Page,
  options?: { maxDurationMs?: number },
): Promise<void> {
  const maxDuration = options?.maxDurationMs ?? 1500;
  const actions: (() => Promise<void>)[] = [];

  const random = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const viewport = page.viewport() || { width: 1280, height: 800 };

  // Scroll randomly on the page
  actions.push(async () => {
    try {
      const scrollHeight = await page.evaluate(() =>
        document.body ? document.body.scrollHeight : 0,
      );
      if (scrollHeight > 100) {
        const y = random(50, scrollHeight - 50);
        await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      }
    } catch {
      // ignore errors silently
    }
  });

  // Move mouse randomly inside viewport
  actions.push(async () => {
    try {
      const x = random(0, viewport.width - 1);
      const y = random(0, viewport.height - 1);
      await page.mouse.move(x, y, { steps: random(3, 7) });
    } catch {
      // ignore
    }
  });

  // More complex mouse movement with two consecutive moves
  actions.push(async () => {
    try {
      const x1 = random(0, Math.floor(viewport.width / 2));
      const y1 = random(0, Math.floor(viewport.height / 2));
      const x2 = random(Math.floor(viewport.width / 2), viewport.width);
      const y2 = random(Math.floor(viewport.height / 2), viewport.height);
      await page.mouse.move(x1, y1, { steps: random(3, 5) });
      await page.mouse.move(x2, y2, { steps: random(3, 5) });
    } catch {
      // ignore
    }
  });

  console.log('🤖 Imitating human-like mouse behavior…');

  const start = Date.now();
  while (Date.now() - start < maxDuration) {
    const action = actions[random(0, actions.length - 1)];
    await action();

    const sleep = random(200, 600);
    await delay(sleep);

    if (Math.random() < 0.3) break; // randomly stop early
  }

  console.log('✅ Human-like behavior done.');
}
