import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.ssh' });

async function testSSH() {
  const browser = await chromium.launch({ headless: false }); // See what happens
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to SSH login...');
    await page.goto('https://mijn.sshxl.nl/inloggen', { waitUntil: 'networkidle' });
    
    console.log('Filling email...');
    await page.fill('input[type="email"], input[name="email"], input', process.env.SSH_EMAIL);
    
    console.log('Clicking next/login to reveal password field...');
    await page.click('.card-content, button:has-text("Log in"), button:has-text("Volgende"), input[type="submit"]');
    
    console.log('Waiting for password field...');
    await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 10000 });
    
    console.log('Filling password...');
    await page.fill('input[type="password"], input[name="password"]', process.env.SSH_PASSWORD);
    
    console.log('Clicking login...');
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Log in")');
    
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => console.log('No navigation event, proceeding'));
    
    console.log('Navigating to rental offers...');
    // SSH might have different URLs for short stay offers vs regular, let's try the general huuraanbod
    await page.goto('https://mijn.sshxl.nl/huuraanbod', { waitUntil: 'networkidle' });
    
    const content = await page.content();
    console.log('Page loaded. Size:', content.length);
    await page.screenshot({ path: 'ssh_offers.png', fullPage: true });

  } catch(e) {
    console.error('Error SSH:', e.message);
  }
  await browser.close();
}

testSSH();
