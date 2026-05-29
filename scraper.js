import { chromium } from 'playwright';
import { processListings, getExistingKeys } from './db.js';

const CANVAS_UTRECHT_URL = 'https://www.canvas-world.com/en/locations/netherlands/utrecht/canvas-utrecht';
const CANVAS_LONDON_URL = 'https://www.canvas-world.com/en/locations/united-kingdom/london/walthamstow';
const THE_FIZZ_URL = 'https://www.the-fizz.com/student-accommodation/utrecht/';
const NEWNEWNEW_URL = 'https://newnewnew.space/en/search?city=Utrecht';
const XIOR_URL = 'https://www.xior.be/en/city/utrecht';
const H2S_URL = 'https://holland2stay.com/residences.html?available_to_book=179&city=29';

async function scrapeCanvas(page, url, sourceName) {
  console.log(`Scraping Canvas ${sourceName}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`Canvas ${sourceName} sitesinden veri alınamadı. HTTP Status: ${res.status}`);
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
      let titleRaw = r.itemName?.value || r.overwriteName?.value || 'Bilinmeyen Oda';
      let title = `[${sourceName}] ${titleRaw}`;
      
      const priceStr = r.overwritePrice?.value || r.price?.value || '0';
      const parts = priceStr.split('=');
      const priceVal = parts.length > 1 ? parts[1] : parts[0];
      const price = parseFloat(priceVal.replace(',', '.')) || 0;
      
      const availableVal = r.unitsAvailable?.value;
      let available = false;
      if (availableVal !== undefined && availableVal !== null) {
        available = parseInt(availableVal) > 0;
      } else {
        const statusStr = r.availabilityStatus?.value || '';
        available = statusStr.toLowerCase().includes('available');
      }

      return {
        source: 'Canvas',
        title,
        price,
        available,
        url: url
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
      let title = popup.querySelector('h3')?.textContent?.trim() || 'Bilinmeyen Oda Türü';
      
      const text = popup.innerText || '';
      
      const sizeMatch = text.match(/(\d+\s*m²)/i);
      if (sizeMatch) {
         title = `[Utrecht] ${title} (${sizeMatch[1]})`;
      } else {
         title = `[Utrecht] ${title}`;
      }
      
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
        let title = card.querySelector('h2, h3, .title, .name')?.textContent?.trim();
        const priceText = card.querySelector('.price, .rent, strong')?.textContent?.trim() || '';
        const link = card.querySelector('a')?.href;
        const text = card.innerText || '';
        
        if (title && title.length > 0) {
          const sizeMatch = text.match(/(\d+\s*m²)/i);
          const cityMatch = text.match(/Utrecht/i);
          const city = cityMatch ? 'Utrecht' : 'NewNewNew';
          
          title = `[${city}] ${title}`;
          if (sizeMatch) title += ` (${sizeMatch[1]})`;
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
        let title = card.querySelector('h2, h3, .title')?.textContent?.trim();
        const priceText = card.querySelector('.price, .rent')?.textContent?.trim() || '';
        const link = card.querySelector('a')?.href;
        const text = card.innerText || '';
        
        if (title && title.length > 0) {
          const sizeMatch = text.match(/(\d+\s*m²)/i);
          const cityMatch = text.match(/Utrecht/i);
          const city = cityMatch ? 'Utrecht' : 'Xior';
          
          title = `[${city}] ${title}`;
          if (sizeMatch) title += ` (${sizeMatch[1]})`;
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
        let title = card.querySelector('.product-name, h2, h3')?.textContent?.trim();
        const priceText = card.querySelector('.price')?.textContent?.trim() || '';
        const status = card.querySelector('.status, .availability')?.textContent?.trim() || '';
        const link = card.querySelector('a')?.href;
        const text = card.innerText || '';
        
        if (title && title.length > 0) {
          const sizeMatch = text.match(/(\d+\s*m²)/i);
          const cityMatch = text.match(/(Utrecht|Eindhoven|Rotterdam|Amsterdam|Den Haag|Delft|Groningen|Maastricht)/i);
          const city = cityMatch ? cityMatch[1] : 'H2S';
          
          title = `[${city}] ${title}`;
          if (sizeMatch) title += ` (${sizeMatch[1]})`;
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

async function scrapeSSH(page) {
  console.log('Scraping SSH Short Stay...');
  try {
    // Navigate to login
    await page.goto('https://mijn.sshxl.nl/inloggen', { waitUntil: 'networkidle' });
    
    // Check if we need to login
    const currentUrl = page.url();
    if (currentUrl.includes('inloggen')) {
      console.log('SSH: Logging in...');
      const email = process.env.SSH_EMAIL || 'berke.tan.tabak@gmail.com';
      const pwd = process.env.SSH_PASSWORD || '29100Btt!';
      
      await page.fill('input[name="username"]', email);
      await page.click('button[type="submit"]');
      
      // Wait for password field
      await page.waitForSelector('input[name="password"]', { timeout: 15000 });
      await page.fill('input[name="password"]', pwd);
      await page.click('button[type="submit"]');
      
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => console.log('No navigation after SSH login, proceeding'));
    }
    
    // Navigate to rental offers
    await page.goto('https://www.sshxl.nl/en/rental-offer/short-stay', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait for rooms to load
    
    const listings = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.card, .property-card, article');
      cards.forEach(card => {
        let title = card.querySelector('h2, h3, .title, .address')?.textContent?.trim();
        const priceText = card.querySelector('.price, .rent, strong')?.textContent?.trim() || '';
        const link = card.querySelector('a')?.href;
        const text = card.innerText || '';
        
        if (title && title.length > 0 && !title.toLowerCase().includes('first-come-first-serve')) {
          const sizeMatch = text.match(/(\d+\s*m²)/i);
          const cityMatch = text.match(/(Utrecht|Rotterdam|Zwolle|Tilburg|Groningen|Amersfoort)/i);
          const city = cityMatch ? cityMatch[1] : 'SSH';
          
          title = `[${city}] ${title}`;
          if (sizeMatch) title += ` (${sizeMatch[1]})`;
          const priceMatch = priceText.match(/€?\s*(\d+(?:[.,]\d+)?)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
          results.push({
            source: 'SSH',
            title,
            price,
            available: true,
            url: link || 'https://www.sshxl.nl/en/rental-offer/short-stay'
          });
        }
      });
      return results;
    });
    
    console.log(`SSH: Found ${listings.length} rooms.`);
    return listings;
  } catch (e) {
    console.error('SSH scraping error:', e.message);
    return [];
  }
}

async function scrapePlaza(page) {
  console.log('Scraping Plaza...');
  try {
    await page.goto('https://plaza.newnewnew.space/aanbod/wonen', { waitUntil: 'networkidle', timeout: 30000 });
    
    const listings = await page.evaluate(() => {
        const results = [];
        const cards = document.querySelectorAll('a.zds-property-card');
        
        cards.forEach(card => {
            const url = card.href;
            const priceMatch = card.innerText.match(/€\s*(\d+(?:[.,]\d+)?)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
            
            let title = 'Unknown Plaza Room';
            let city = 'Plaza';
            const locationMatches = card.innerText.match(/Amersfoort|Rotterdam|Bochum|Deventer|Maastricht|Rijswijk|Amsterdam|Arnhem|Delft|Breda|Geldrop|Groot-Ammers|Utrecht/i);
            
            if (locationMatches) {
               city = locationMatches[0];
               const textParts = card.innerText.split(locationMatches[0]);
               if (textParts.length > 0) {
                   const titleLines = textParts[0].split('\n').filter(l => l.trim().length > 3 && !l.includes('€'));
                   if (titleLines.length > 0) {
                       title = titleLines[titleLines.length - 1].trim();
                   }
               }
            }
            
            const sizeMatch = card.innerText.match(/(\d+\s*m²)/i);
            title = `[${city}] ${title}`;
            if (sizeMatch) title += ` (${sizeMatch[1]})`;
            
            results.push({
               source: 'Plaza',
               title: title,
               price: price,
               available: true,
               url: url
            });
        });
        
        return results;
    });
    
    console.log(`Plaza: Found ${listings.length} rooms (Total, Needs Filtering).`);
    
    // In theory we only want Utrecht, but Plaza's structure makes it hard to be 100% sure from just text.
    // We will include them all for now or try to filter by title/location text if 'Utrecht' exists
    const utrechtListings = listings.filter(l => l.url.toLowerCase().includes('utrecht') || l.title.toLowerCase().includes('utrecht'));
    
    // If none specifically mention Utrecht in URL/title, just return all for safety or return empty
    // Actually the safest is returning all since user wanted Plaza. Let's return the filtered if there are any, else all.
    const finalListings = utrechtListings.length > 0 ? utrechtListings : listings;
    
    console.log(`Plaza: Returning ${finalListings.length} rooms.`);
    return finalListings;
    
  } catch(e) {
    console.error('Plaza scraping error:', e.message);
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
      const canvasUtrechtRooms = await scrapeCanvas(page, CANVAS_UTRECHT_URL, 'Utrecht');
      allListings = [...allListings, ...canvasUtrechtRooms];
      const canvasLondonRooms = await scrapeCanvas(page, CANVAS_LONDON_URL, 'London Walthamstow');
      allListings = [...allListings, ...canvasLondonRooms];
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
    
    // Plaza scraping
    try {
      const plazaRooms = await scrapePlaza(page);
      allListings = [...allListings, ...plazaRooms];
    } catch (e) {
      console.error('Error scraping Plaza:', e);
    }
    
    // SSH scraping
    try {
      const sshRooms = await scrapeSSH(page);
      allListings = [...allListings, ...sshRooms];
    } catch (e) {
      console.error('Error scraping SSH:', e);
    }

    // Process all fetched listings
    if (allListings.length > 0) {
      console.log(`Checking which of the ${allListings.length} rooms are new for deep scraping...`);
      const existingKeys = await getExistingKeys();
      
      for (let listing of allListings) {
          const key = `${listing.source}-${listing.title}`;
          if (!existingKeys.has(key) && listing.available && listing.url && !listing.url.includes('search') && !listing.url.includes('huuraanbod')) {
              console.log(`Deep scraping new listing: ${listing.title}`);
              try {
                  const detailPage = await context.newPage();
                  await detailPage.goto(listing.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                  await detailPage.waitForTimeout(2000);
                  const text = await detailPage.evaluate(() => document.body.innerText);
                  let details = '';
                  
                  if (listing.source === 'SSH') {
                      const matchId = text.match(/O-number:?\s*(\S+)/i) || text.match(/Accommodation number:?\s*(\S+)/i);
                      if (matchId) details += `🔖 İlan No: ${matchId[1]}\n`;
                      if (text.toLowerCase().includes('deposit')) {
                          const depMatch = text.match(/deposit.*?€?\s*(\d+)/i);
                          if (depMatch) details += `💰 Depozito: €${depMatch[1]}\n`;
                      }
                  } else if (listing.source === 'Holland2Stay') {
                      const availMatch = text.match(/Available from\s*(\d{2}-\d{2}-\d{4})/i);
                      if (availMatch) details += `📅 Uygunluk: ${availMatch[1]}\n`;
                      const depMatch = text.match(/Deposit\s*€\s*([\d.,]+)/i);
                      if (depMatch) details += `💰 Depozito: €${depMatch[1]}\n`;
                  } else if (listing.source === 'Canvas') {
                      const depMatch = text.match(/Deposit\s*£?\s*(\d+)/i);
                      if (depMatch) details += `💰 Depozito: £${depMatch[1]}\n`;
                      const termMatch = text.match(/Tenancy length[^\d]*(\d+\s*weeks)/i);
                      if (termMatch) details += `📜 Kontrat: ${termMatch[1]}\n`;
                  } else if (listing.source === 'Xior') {
                      const depMatch = text.match(/Deposit[^\d]*€\s*([\d.,]+)/i);
                      if (depMatch) details += `💰 Depozito: €${depMatch[1]}\n`;
                  } else if (listing.source === 'Plaza') {
                      const availMatch = text.match(/Available from[^\d]*(\d{2}-\d{2}-\d{4})/i) || text.match(/Beschikbaar per[^\d]*(\d{2}-\d{2}-\d{4})/i);
                      if (availMatch) details += `📅 Uygunluk: ${availMatch[1]}\n`;
                  }
                  
                  if (details.length > 0) {
                      listing.deepDetails = details.trim();
                  }
                  await detailPage.close();
              } catch(e) {
                  console.error(`Error deep scraping ${listing.url}:`, e.message);
              }
          }
      }
      
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
