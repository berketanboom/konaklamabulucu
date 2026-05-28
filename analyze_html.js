import fs from 'fs';
import * as cheerio from 'cheerio';

const analyze = (file, site) => {
  console.log(`\n--- ${site} ---`);
  try {
    const html = fs.readFileSync(file, 'utf-8');
    const $ = cheerio.load(html);
    
    // Plaza
    if (site === 'Plaza') {
      // let's look for standard things
      console.log('Title:', $('title').text());
      const texts = [];
      $('a').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        if (href && href.includes('utrecht')) {
          texts.push(`${text} -> ${href}`);
        }
      });
      console.log('Utrecht links:', texts.slice(0, 10));
      
      // Let's just find anything with € or price
      let prices = [];
      $('*').each((i, el) => {
        const t = $(el).text();
        if (t.includes('€') && t.length < 20) prices.push(t.trim());
      });
      console.log('Prices found:', [...new Set(prices)].slice(0, 10));
    }
    
    // Xior
    if (site === 'Xior') {
      console.log('Title:', $('title').text());
      const rooms = [];
      $('.room-list-item, .room-card, .card, article').each((i, el) => {
        rooms.push($(el).text().trim().replace(/\s+/g, ' ').substring(0, 50));
      });
      console.log('Rooms:', rooms.slice(0, 5));
    }
    
    // H2S
    if (site === 'Holland2Stay') {
      console.log('Title:', $('title').text());
      const rooms = [];
      $('.property-item, .residence-item, .listing').each((i, el) => {
        rooms.push($(el).text().trim().replace(/\s+/g, ' ').substring(0, 50));
      });
      console.log('Rooms:', rooms.slice(0, 5));
    }
  } catch (err) {
    console.error(err);
  }
};

analyze('plaza.html', 'Plaza');
analyze('xior.html', 'Xior');
analyze('h2s.html', 'Holland2Stay');
