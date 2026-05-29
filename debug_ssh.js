import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.ssh' });

async function debugSSH() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://mijn.sshxl.nl/inloggen', { waitUntil: 'networkidle' });
    await page.fill('input[name="username"]', process.env.SSH_EMAIL);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('input[name="password"]', { timeout: 15000 });
    await page.fill('input[name="password"]', process.env.SSH_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    
    await page.goto('https://mijn.sshxl.nl/huuraanbod', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'ssh_huuraanbod_debug.png', fullPage: true });
    
    console.log('Page title:', await page.title());
    console.log('Cards found:', await page.$$eval('.card, article, [class*="property"], [class*="aanbod"], .result', els => els.length));
    
    const html = await page.content();
    console.log('HTML Length:', html.length);
  } catch(e) {
    console.error(e);
  }
  await browser.close();
}

debugSSH();
