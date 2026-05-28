import { chromium } from 'playwright';

async function testExtract() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    // NewNewNew
    console.log('--- NewNewNew ---');
    const pagePlaza = await context.newPage();
    await pagePlaza.goto('https://newnewnew.space/en/search?city=Utrecht', { waitUntil: 'networkidle' });
    const plazaListings = await pagePlaza.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.listing, .property-card, .search-result, article, .item, .card');
      cards.forEach(card => {
        const title = card.querySelector('h2, h3, .title, .name')?.textContent?.trim();
        const priceText = card.querySelector('.price, .rent, strong')?.textContent?.trim() || '';
        const link = card.querySelector('a')?.href;
        if (title && title.length > 0) results.push({ title, priceText, link });
      });
      return results;
    });
    console.log('NewNewNew extracted:', plazaListings.slice(0, 5));

    // Xior
    console.log('\n--- Xior ---');
    const pageXior = await context.newPage();
    await pageXior.goto('https://www.xior.be/en/city/utrecht', { waitUntil: 'networkidle' });
    const xiorListings = await pageXior.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.room-card, .property-card, article, .building-card, .xior-card');
      cards.forEach(card => {
        const title = card.querySelector('h2, h3, .title')?.textContent?.trim();
        const priceText = card.querySelector('.price, .rent')?.textContent?.trim() || '';
        const link = card.querySelector('a')?.href;
        if (title && title.length > 0) results.push({ title, priceText, link });
      });
      return results;
    });
    console.log('Xior extracted:', xiorListings.slice(0, 5));

    // Holland2Stay
    console.log('\n--- Holland2Stay ---');
    const pageH2S = await context.newPage();
    await pageH2S.goto('https://holland2stay.com/residences.html?available_to_book=179&city=29', { waitUntil: 'domcontentloaded' });
    await pageH2S.waitForTimeout(3000); // give it time to load or bypass initial CF check
    const h2sListings = await pageH2S.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.residence-item, .property-item, .item, li.item');
      cards.forEach(card => {
        const title = card.querySelector('.product-name, h2, h3')?.textContent?.trim();
        const priceText = card.querySelector('.price')?.textContent?.trim() || '';
        const status = card.querySelector('.status, .availability')?.textContent?.trim() || '';
        const link = card.querySelector('a')?.href;
        if (title && title.length > 0) results.push({ title, priceText, status, link });
      });
      return results;
    });
    console.log('Holland2Stay extracted:', h2sListings.slice(0, 5));

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

testExtract();
