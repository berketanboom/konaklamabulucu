import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('fizz2.html', 'utf8');
const $ = cheerio.load(html);

// Find all elements that might be room cards
const rooms = [];
$('[class*="apartment"], [class*="room"], [class*="card"]').each((i, el) => {
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  if (text.includes('€') || text.toLowerCase().includes('price')) {
    const classes = $(el).attr('class');
    if (classes && !rooms.includes(classes)) {
      rooms.push(classes);
      console.log('Found potential card class:', classes);
      console.log('Content preview:', text.substring(0, 150));
      console.log('---');
    }
  }
});
