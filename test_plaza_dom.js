import { chromium } from 'playwright';

async function testPlazaDOM() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://plazaresidentservices.com/search?city=Utrecht', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000); // Give it time to load dynamic data
    
    const rooms = await page.evaluate(() => {
        const results = [];
        const items = document.querySelectorAll('.list-item, .card, article, .availability-item, [class*="Item"], [class*="Card"]');
        items.forEach(item => {
            const title = item.querySelector('h2, h3, h4, .title, [class*="Title"]')?.innerText;
            const price = item.querySelector('.price, [class*="Price"]')?.innerText;
            if (title && price) {
               results.push({title, price});
            }
        });
        return results;
    });
    console.log('Found rooms via DOM:', rooms.length);
    console.log(rooms);
    
  } catch(e) {
    console.error('Error Plaza:', e.message);
  }
  await browser.close();
}

testPlazaDOM();
