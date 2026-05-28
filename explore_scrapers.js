import { chromium } from 'playwright';
import fs from 'fs';

async function explore() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  try {
    // 1. Plaza
    console.log('--- Plaza ---');
    const pagePlaza = await context.newPage();
    await pagePlaza.goto('https://plaza.newnewnew.space/en/search?city=Utrecht', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await pagePlaza.waitForTimeout(2000);
    const plazaHtml = await pagePlaza.content();
    fs.writeFileSync('plaza.html', plazaHtml);
    console.log('Saved plaza.html');

    // 2. Xior
    console.log('--- Xior ---');
    const pageXior = await context.newPage();
    await pageXior.goto('https://www.xior.be/en/city/utrecht', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await pageXior.waitForTimeout(2000);
    const xiorHtml = await pageXior.content();
    fs.writeFileSync('xior.html', xiorHtml);
    console.log('Saved xior.html');

    // 3. Holland2Stay
    console.log('--- Holland2Stay ---');
    const pageH2S = await context.newPage();
    await pageH2S.goto('https://holland2stay.com/residences.html?available_to_book=179&city=29', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await pageH2S.waitForTimeout(2000);
    const h2sHtml = await pageH2S.content();
    fs.writeFileSync('h2s.html', h2sHtml);
    console.log('Saved h2s.html');

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

explore();
