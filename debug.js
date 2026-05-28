import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Fetching The Fizz Utrecht...');
  await page.goto('https://www.the-fizz.com/student-accommodation/utrecht/', { waitUntil: 'networkidle' });
  
  await page.screenshot({ path: 'fizz.png', fullPage: true });
  const bodyText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('fizz_text.txt', bodyText);
  
  await browser.close();
  console.log('Done.');
}
run();
