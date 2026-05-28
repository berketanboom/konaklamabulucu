import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Fetching The Fizz Utrecht...');
  await page.goto('https://www.the-fizz.com/student-accommodation/utrecht/', { waitUntil: 'networkidle' });
  
  const listings = await page.evaluate(() => {
    const results = [];
    // popups contain detailed info
    const popups = document.querySelectorAll('.popup--apartments');
    
    popups.forEach(popup => {
      const title = popup.querySelector('h3')?.innerText?.trim() || 'Bilinmeyen Oda';
      
      // Availability info is usually injected into the popup by the PEX widget
      // Or we can just check the text inside the popup
      const text = popup.innerText || '';
      const available = !text.toLowerCase().includes('momentan sind keine');
      
      // Price is also injected if available
      const priceMatch = text.match(/€\s*(\d+(?:[.,]\d+)?)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
      
      results.push({
        source: 'The Fizz Utrecht',
        title,
        price,
        available,
        url: 'https://www.the-fizz.com/student-accommodation/utrecht/'
      });
    });
    
    return results;
  });

  console.log(listings);
  await browser.close();
}
run();
