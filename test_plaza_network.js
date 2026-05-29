import { chromium } from 'playwright';

async function traceNetwork() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    if (response.url().includes('api') || response.url().includes('graphql') || response.url().includes('json')) {
      console.log('Network call:', response.url());
    }
  });
  
  try {
    await page.goto('https://plaza.newnewnew.space/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Attempt to click 'Wonen' in the footer
    await page.click('a[href*="/wonen"], a:has-text("Wonen")', { timeout: 5000 });
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    await page.screenshot({ path: 'plaza_after_wonen.png', fullPage: true });

  } catch(e) {
    console.error('Error Plaza:', e.message);
  }
  await browser.close();
}

traceNetwork();
