const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8083;
const ROOT = process.cwd();

const mimeTypes = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url.split('?')[0]);
  if (filePath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  const ext = path.extname(filePath);
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch(e) {
    res.writeHead(404);
    res.end('Not found: ' + filePath);
  }
});

server.listen(PORT, async () => {
  console.log('Local server on http://localhost:' + PORT);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  const errors = [];
  const failedRequests = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE: ' + err.message));
  page.on('requestfailed', req => {
    failedRequests.push('FAILED: ' + req.url());
  });
  page.on('response', resp => {
    if (resp.status() >= 400) {
      failedRequests.push(resp.status() + ': ' + resp.url());
    }
  });

  console.log('Loading page...');
  await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML.substring(0, 300) : 'NO ROOT';
  });
  console.log('Root content:', rootContent.substring(0, 150) + '...');

  const bodyChildren = await page.evaluate(() => document.body.children.length);
  console.log('Body children count:', bodyChildren);

  console.log('\n=== Failed requests (' + failedRequests.length + ') ===');
  failedRequests.forEach(r => console.log('  ' + r));

  console.log('\n=== Console errors (' + errors.length + ') ===');
  errors.forEach(e => console.log('  ' + e.substring(0, 200)));

  await page.screenshot({ path: 'local_test_screenshot.png' });
  console.log('\nScreenshot: local_test_screenshot.png');

  await browser.close();
  server.close();
  console.log('Done');
});
