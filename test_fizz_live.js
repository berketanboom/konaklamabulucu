import { chromium } from 'playwright';

async function testFizz() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://www.the-fizz.com/student-accommodation/utrecht/', { waitUntil: 'networkidle' });

  const listings = await page.evaluate(() => {
    const results = [];
    const popups = document.querySelectorAll('.popup--apartments'); 

    popups.forEach(popup => {
      const title = popup.querySelector('h3')?.textContent?.trim() || 'Bilinmeyen Oda Türü';
      const text = popup.innerText || '';
      const isUnavailable = text.toLowerCase().includes('momentan sind keine') || text.toLowerCase().includes('fully booked');
      const available = !isUnavailable;

      const priceMatch = text.match(/€\s*(\d+(?:[.,]\d+)?)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;

      results.push({
        title,
        price,
        available,
        text_full: text
      });
    });
    
    return results;
  });

  console.log(JSON.stringify(listings, null, 2));
  await browser.close();
}

testFizz();
