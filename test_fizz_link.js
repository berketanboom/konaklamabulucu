import fs from 'fs';
import * as cheerio from 'cheerio';
const html = fs.readFileSync('fizz2.html', 'utf8');
const $ = cheerio.load(html);
const links = [];
$('.popup--apartments').each((i, popup) => {
  const btn = $(popup).find('a').filter((i, el) => {
    return $(el).text().toLowerCase().includes('buchen') || $(el).text().toLowerCase().includes('book');
  });
  if (btn.length > 0) {
    links.push(btn.attr('href'));
  }
});
console.log('Booking links:', links);
