import fs from 'fs';
import * as cheerio from 'cheerio';
const html = fs.readFileSync('plaza.html', 'utf8');
const $ = cheerio.load(html);

// Find elements with 'available' or 'studio' or 'room' or something indicating an item
const cards = $('.availability-item, .room-card, .list-item, article, [class*="card"], [class*="item"]');
console.log('Cards found:', cards.length);

if (cards.length > 0) {
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    console.log(`Card ${i}:`, $(cards[i]).text().replace(/\s+/g, ' ').trim().substring(0, 100));
  }
} else {
  // Let's just find anything with a price
  const prices = $('*:contains("€")').last().parent().text().replace(/\s+/g, ' ').trim().substring(0, 100);
  console.log('Price texts:', prices);
}
