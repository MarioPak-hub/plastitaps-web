import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log('Navigating to http://localhost:5173/disena-tu-vaso ...');
  await page.goto('http://localhost:5173/disena-tu-vaso', { waitUntil: 'networkidle' });
  
  console.log('Page loaded. Waiting 2 seconds...');
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
