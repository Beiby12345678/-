const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`PAGE: ${err.message}`));

  console.log('Loading page...');
  try {
    await page.goto('https://beiby12345678.github.io/-/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('Page loaded');
  } catch(e) {
    console.log('Load error:', e.message);
  }

  await page.waitForTimeout(3000);

  // Check DOM
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML.substring(0, 500) : 'NO ROOT ELEMENT';
  });
  console.log('Root content (first 500 chars):', rootContent);

  // Check body
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 300));
  console.log('Body (first 300 chars):', bodyHTML);

  // All errors
  console.log('\n=== Errors ===');
  errors.forEach(e => console.log(e));

  // Screenshot
  await page.screenshot({ path: 'C:/Users/pc/beibei-portfolio/screenshot.png' });
  console.log('\nScreenshot saved to screenshot.png');

  await browser.close();
})();
