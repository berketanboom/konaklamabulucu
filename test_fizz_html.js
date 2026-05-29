import fs from 'fs';
import * as cheerio from 'cheerio';
const html = fs.readFileSync('fizz2.html', 'utf8');
const $ = cheerio.load(html);
$('.popup--apartments').each((i, popup) => {
  if ($(popup).text().includes('Single')) {
    console.log($(popup).html());
  }
});
