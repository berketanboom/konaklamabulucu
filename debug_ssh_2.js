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
    
    // Check all links
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText, href: a.href }));
    });
    console.log('All links on page:', links.filter(l => l.href.includes('aanbod')));
    
    // Find the rental offer link for short stay
    const rentalLink = links.find(l => l.href.includes('huuraanbod') || l.href.includes('shortstay') || l.text.toLowerCase().includes('rental'));
    console.log('Using link:', rentalLink);
    
    if (rentalLink) {
        await page.goto(rentalLink.href, { waitUntil: 'networkidle' });
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'ssh_shortstay_debug.png', fullPage: true });
    }
  } catch(e) {
    console.error(e);
  }
  await browser.close();
}

debugSSH();
