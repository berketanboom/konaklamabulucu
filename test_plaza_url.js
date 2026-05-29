import { chromium } from 'playwright';

async function findPlazaCorrectURL() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to homepage...');
    await page.goto('https://plazaresidentservices.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Accept cookies if present
    try {
        await page.click('button:has-text("Allow all"), button:has-text("Accepteren")', { timeout: 3000 });
    } catch(e) {}
    
    // Find search link
    const searchUrl = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const searchLink = links.find(l => l.innerText.toLowerCase().includes('vind jouw plek') || l.innerText.toLowerCase().includes('find your place') || l.href.includes('search'));
        return searchLink ? searchLink.href : null;
    });
    
    console.log('Found search URL:', searchUrl);
    
    if (searchUrl) {
       await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
       await page.screenshot({ path: 'plaza_real_search.png', fullPage: true });
       console.log('Final URL after click:', page.url());
    }
  } catch(e) {
    console.error('Error Plaza:', e.message);
  }
  await browser.close();
}

findPlazaCorrectURL();
