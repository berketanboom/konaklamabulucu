import { chromium } from 'playwright';

async function fixPlaza() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://plaza.newnewnew.space/aanbod/wonen', { waitUntil: 'networkidle', timeout: 30000 });
    
    const rooms = await page.evaluate(() => {
        const results = [];
        const cards = document.querySelectorAll('.zds-property-card, [class*="property-card"], [class*="zds-card"], article, a');
        
        cards.forEach(card => {
            const innerText = card.innerText || '';
            const priceMatch = innerText.match(/€\s*(\d+(?:[.,]\d+)?)/);
            if (priceMatch) {
                let title = 'Unknown Plaza Room';
                const headings = card.querySelectorAll('h2, h3, h4, span');
                headings.forEach(h => {
                    if (h.innerText && h.innerText.length > 3 && !h.innerText.includes('€')) {
                        title = h.innerText.trim();
                    }
                });
                
                const price = parseFloat(priceMatch[1].replace(',', '.'));
                
                let link = card.querySelector('a')?.href;
                if (!link && card.tagName.toLowerCase() === 'a') {
                   link = card.href;
                }
                
                results.push({
                   title: title,
                   price: price,
                   url: link || 'https://plaza.newnewnew.space/aanbod/wonen'
                });
            }
        });
        
        return results;
    });
    
    // Filter out duplicates based on title
    const uniqueRooms = Array.from(new Set(rooms.map(a => a.title)))
        .map(title => {
            return rooms.find(a => a.title === title)
        });
        
    console.log('Found rooms:', uniqueRooms.length);
    console.log(uniqueRooms.slice(0, 5));
    
  } catch(e) {
    console.error('Error Plaza:', e.message);
  }
  await browser.close();
}

fixPlaza();
