import { chromium } from 'playwright';

async function testPlazaWonen() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://plaza.newnewnew.space/wonen', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    const rooms = await page.evaluate(() => {
        const results = [];
        const items = document.querySelectorAll('.list-item, .card, article, .availability-item, [class*="Item"], [class*="Card"], .search-result, .aanbod-item');
        items.forEach(item => {
            const title = item.querySelector('h2, h3, h4, .title, [class*="Title"], .street')?.innerText;
            const price = item.querySelector('.price, [class*="Price"], .rent')?.innerText;
            if (title && price) {
               results.push({title, price});
            }
        });
        return results;
    });
    console.log('Found rooms via DOM on /wonen:', rooms.length);
    console.log(rooms);
    
  } catch(e) {
    console.error('Error Plaza:', e.message);
  }
  await browser.close();
}

testPlazaWonen();
