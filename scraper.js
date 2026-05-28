import { chromium } from 'playwright';
import { processListings } from './db.js';

const CANVAS_URL = 'https://www.canvas-world.com/en/locations/netherlands/utrecht/canvas-utrecht';
const THE_FIZZ_URL = 'https://www.the-fizz.com/student-accommodation/utrecht/';
const NEWNEWNEW_URL = 'https://newnewnew.space/en/search?city=Utrecht';
const XIOR_URL = 'https://www.xior.be/en/city/utrecht';
const H2S_URL = 'https://holland2stay.com/residences.html?available_to_book=179&city=29';

async function scrapeCanvas(page) {
  console.log('Scraping Canvas Utrecht...');
  try {
    // Canvas Utrecht sitesinin yeni adresi üzerinden veri çekiyoruz.
    // Zaman aşımı ve bot engelini aşmak için doğrudan global fetch kullanıyoruz.
    const res = await fetch(CANVAS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`Canvas Utrecht sitesinden veri alınamadı. HTTP Status: ${res.status}`);
    }

    const html = await res.text();
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!nextDataMatch) {
      throw new Error('__NEXT_DATA__ script tagı bulunamadı.');
    }

    const pageProps = JSON.parse(nextDataMatch[1]);
    const compProps = pageProps.props?.pageProps?.componentProps || {};

    let rawRooms = [];
    for (const key of Object.keys(compProps)) {
      const comp = compProps[key];
      if (comp && comp.integratedCardsResult) {
        const results = comp.integratedCardsResult.item?.children?.results;
        if (results && results[0] && results[0].children?.results) {
          rawRooms = results[0].children.results;
          break;
        }
      }
    }

    const listings = rawRooms.map(r => {
      const title = r.itemName?.value || r.overwriteName?.value || 'Bilinmeyen Oda';
      
      const priceStr = r.overwritePrice?.value || r.price?.value || '0';
      const parts = priceStr.split('=');
      const priceVal = parts.length > 1 ? parts[1] : parts[0];
      const price = parseFloat(priceVal.replace(',', '.')) || 0;
      
      // unitsAvailable.value > 0 ise odanın müsait olduğunu anlıyoruz
      const availableVal = r.unitsAvailable?.value;
      const available = availableVal !== undefined && parseInt(availableVal) > 0;

      return {
        source: 'Canvas',
        title,
        price,
        available,
        url: CANVAS_URL
      };
    });

    console.log(`Canvas: Found ${listings.length} rooms.`);
    return listings;
  } catch (e) {
    console.error('Canvas Utrecht taranırken hata oluştu:', e.message);
    console.log('Bu site için tarama atlanıyor...');
    return [];
  }
}

async function scrapeTheFizz(page) {
  console.log('Scraping The Fizz Utrecht...');
  await page.goto(THE_FIZZ_URL, { waitUntil: 'networkidle' });

  const listings = await page.evaluate(() => {
    const results = [];
    // Örnek seçiciler (Gerçek sitedeki sınıflara/ID'lere göre revize edilmelidir)
    const popups = document.querySelectorAll('.popup--apartments'); 

    popups.forEach(popup => {
      const title = popup.querySelector('h3')?.textContent?.trim() || 'Bilinmeyen Oda Türü';
      
      const text = popup.innerText || '';
      
      // Fizz sitesinde Almanca "Momentan sind keine... verfügbar" veya İngilizce "no apartments available" yazar
      const isUnavailable = text.toLowerCase().includes('momentan sind keine') || text.toLowerCase().includes('fully booked');
      const available = !isUnavailable;

      // Fiyat regex ile aranır (örnek: "€ 850" -> 850)
      const priceMatch = text.match(/€\s*(\d+(?:[.,]\d+)?)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
      
      const url = 'https://www.the-fizz.com/student-accommodation/utrecht/';

      results.push({
        source: 'Fizz',
        title,
        price,
        available,
        url
      });
    });
    
    return results;
  });

  console.log(`The Fizz: Found ${listings.length} rooms.`);
  return listings;
}

async function scrapeNewNewNew(page) {
  console.log('Scraping NewNewNew...');
  try {
    await page.goto(NEWNEWNEW_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // Wait for dynamic content
    
    const listings = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.listing, .property-card, .search-result, article, .item, .card');
      cards.forEach(card => {
        const title = card.querySelector('h2, h3, .title, .name')?.textContent?.trim();
        const priceText = card.querySelector('.price, .rent, strong')?.textContent?.trim() || '';
        const link = card.querySelector('a')?.href;
        
        if (title && title.length > 0) {
          const priceMatch = priceText.match(/€\s*(\d+(?:[.,]\d+)?)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
          results.push({
            source: 'NewNewNew',
            title,
            price,
            available: true,
            url: link || 'https://newnewnew.space/en/search?city=Utrecht'
          });
        }
      });
      return results;
    });
    
    console.log(`NewNewNew: Found ${listings.length} rooms.`);
    return listings;
  } catch (e) {
    console.error('NewNewNew scraping error:', e.message);
    return [];
  }
}

async function scrapeXior(page) {
  console.log('Scraping Xior...');
  try {
    await page.goto(XIOR_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // Wait for dynamic content
    
    const listings = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.room-card, .property-card, article, .building-card, .xior-card');
      cards.forEach(card => {
        const title = card.querySelector('h2, h3, .title')?.textContent?.trim();
        const priceText = card.querySelector('.price, .rent')?.textContent?.trim() || '';
        const link = card.querySelector('a')?.href;
        
        if (title && title.length > 0) {
          const priceMatch = priceText.match(/€?\s*(\d+(?:[.,]\d+)?)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
          results.push({
            source: 'Xior',
            title,
            price,
            available: true,
            url: link || 'https://www.xior.be/en/city/utrecht'
          });
        }
      });
      return results;
    });
    
    console.log(`Xior: Found ${listings.length} rooms.`);
    return listings;
  } catch (e) {
    console.error('Xior scraping error:', e.message);
    return [];
  }
}

async function scrapeHolland2Stay(page) {
  console.log('Scraping Holland2Stay...');
  try {
    // Navigate with a reasonable timeout, catching CF blocks
    await page.goto(H2S_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // Give time for Cloudflare challenge if bypassable
    
    const isCloudflare = await page.evaluate(() => {
      return document.title.includes('Just a moment') || !!document.querySelector('#challenge-error-text');
    });
    
    if (isCloudflare) {
      console.log('Holland2Stay: Blocked by Cloudflare protection. Skipping for now.');
      return [];
    }
    
    const listings = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.residence-item, .property-item, .item, li.item');
      cards.forEach(card => {
        const title = card.querySelector('.product-name, h2, h3')?.textContent?.trim();
        const priceText = card.querySelector('.price')?.textContent?.trim() || '';
        const status = card.querySelector('.status, .availability')?.textContent?.trim() || '';
        const link = card.querySelector('a')?.href;
        
        if (title && title.length > 0) {
          const priceMatch = priceText.match(/€?\s*(\d+(?:[.,]\d+)?)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
          const isAvailable = !status.toLowerCase().includes('booked') && !status.toLowerCase().includes('unavailable');
          
          results.push({
            source: 'Holland2Stay',
            title,
            price,
            available: isAvailable,
            url: link || 'https://holland2stay.com/residences.html'
          });
        }
      });
      return results;
    });
    
    console.log(`Holland2Stay: Found ${listings.length} rooms.`);
    return listings;
  } catch (e) {
    console.error('Holland2Stay scraping error:', e.message);
    return [];
  }
}

async function runScraper() {
  console.log('Starting the scraper...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    let allListings = [];

    // Canvas scraping
    try {
      const canvasRooms = await scrapeCanvas(page);
      allListings = [...allListings, ...canvasRooms];
    } catch (e) {
      console.error('Error scraping Canvas:', e);
    }

    // Fizz scraping
    try {
      const fizzRooms = await scrapeTheFizz(page);
      allListings = [...allListings, ...fizzRooms];
    } catch (e) {
      console.error('Error scraping The Fizz:', e);
    }

    // NewNewNew scraping
    try {
      const nnnRooms = await scrapeNewNewNew(page);
      allListings = [...allListings, ...nnnRooms];
    } catch (e) {
      console.error('Error scraping NewNewNew:', e);
    }

    // Xior scraping
    try {
      const xiorRooms = await scrapeXior(page);
      allListings = [...allListings, ...xiorRooms];
    } catch (e) {
      console.error('Error scraping Xior:', e);
    }

    // Holland2Stay scraping
    try {
      const h2sRooms = await scrapeHolland2Stay(page);
      allListings = [...allListings, ...h2sRooms];
    } catch (e) {
      console.error('Error scraping Holland2Stay:', e);
    }

    // Process all fetched listings
    if (allListings.length > 0) {
      console.log(`Processing total ${allListings.length} rooms to Supabase...`);
      await processListings(allListings);
    } else {
      console.log('No rooms found to process.');
    }

  } catch (error) {
    console.error('An unexpected error occurred during scraping:', error);
  } finally {
    await browser.close();
    console.log('Scraper finished its run.');
  }
}

// Start scraper
runScraper();
