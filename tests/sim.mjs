// Full-day simulation with Playwright: plays days perfectly through the public session API
// in TR/EN, landscape, portrait and iPad sizes, and saves screenshots.
//
//   npm run build && npm run preview -- --port 4173 &
//   CHROME=/path/to/chrome npm run test:sim
//
// Env: BASE (default http://127.0.0.1:4173/Noddles/sushi/), CHROME (Chromium binary), DAYS ("1,6,10").

import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173/Noddles/sushi/';
const DAYS = (process.env.DAYS ?? '1,6,10').split(',').map(Number);
const OUT = process.env.OUT ?? 'test-results';
const SIZES = [
  { name: 'landscape', width: 1280, height: 720 },
  { name: 'portrait', width: 412, height: 915 },
  { name: 'ipad', width: 1024, height: 768 },
];
const solver = fs.readFileSync(
  path.join(path.dirname(new URL(import.meta.url).pathname), 'solver.js'),
  'utf8'
);
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME,
  args: ['--no-sandbox'],
});
let failed = 0;
for (const lang of ['tr', 'en'])
  for (const size of SIZES)
    for (const day of DAYS) {
      const tag = `${lang}-${size.name}-d${day}`;
      const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(
        ([lang, day]) => {
          localStorage.setItem('yuki.lang', lang);
          localStorage.setItem(
            'sushi.save',
            JSON.stringify({ unlocked: day, wallet: 0, seenHowTo: true })
          );
        },
        [lang, day]
      );
      await page.addInitScript({ content: solver });
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.click('.title-actions .btn', { force: true });
      await page.click('.day-card.today', { force: true });
      await page.click('.skip', { force: true });
      if (await page.$('.howto')) await page.click('.howto .skip', { force: true });
      await page.waitForTimeout(3800);
      await page.evaluate(() => {
        const s = window.__session;
        const tick = s.tick.bind(s);
        s.tick = (dt) => tick(dt * 6);
      });
      let shot = 0;
      for (let i = 0; i < 3000; i++) {
        const st = await page.evaluate(() => {
          const s = window.__session;
          return {
            over: s.over,
            st: s.cust?.state,
            ask: s.cust?.ask,
            done: s.cust ? s.lineDone(s.cust) : false,
            ring: !!s.ringing,
            online: !!s.activeOnline,
          };
        });
        if (st.over) break;
        if (st.ring) await page.evaluate(() => window.__session.acceptOnline());
        if (st.st === 'wait' || st.online) {
          if (shot++ === 1) await page.screenshot({ path: `${OUT}/${tag}-ticket.png` });
          await page.evaluate(() => window.__solve());
        }
        if (st.st === 'pay') await page.evaluate(() => window.__pay());
        if (st.st === 'verdict' && st.ask && st.done)
          await page.evaluate(() => window.__session.answer(window.__session.choices()[0].id));
        await page.waitForTimeout(120);
      }
      const res = await page.evaluate(() => {
        const s = window.__session;
        return {
          over: s.over,
          served: s.ledger.served,
          rating: +s.dayRating.toFixed(2),
          net: Math.round(s.net),
          stars: s.stars,
        };
      });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${OUT}/${tag}-ledger.png` });
      // in English mode no Turkish-only letters may be visible anywhere in the DOM
      if (lang === 'en') {
        const tr = await page.evaluate(() =>
          /[ğışİĞŞ]/.test(document.body.innerText.replace(/Yuki Sushi/g, ''))
        );
        if (tr) errors.push('Turkish text visible in English mode');
      }
      const ok = res.over && res.served > 0 && res.rating >= 4.5 && !errors.length;
      if (!ok) failed++;
      console.log(ok ? 'ok  ' : 'FAIL', tag, JSON.stringify(res), errors.join(' | '));
      await page.close();
    }
await browser.close();
process.exit(failed ? 1 : 0);
