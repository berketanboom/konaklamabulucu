import { chromium } from 'playwright';

async function testClickBook() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://www.the-fizz.com/student-accommodation/utrecht/', { waitUntil: 'networkidle', timeout: 30000 });
  
  const buttons = await page.$$('a:has-text("Jetzt buchen"), a:has-text("Book now"), button:has-text("Jetzt buchen")');
  if (buttons.length > 0) {
    console.log('Found button, clicking...');
    await buttons[0].click({ force: true });
    await page.waitForTimeout(5000);
    const content = await page.content();
    console.log('Includes fully booked?', content.includes('fully booked') || content.includes('We are currently'));
    
    // Also check if there's an iframe we should look into
    const iframes = await page.$$('iframe');
    for (const frameElement of iframes) {
      const frame = await frameElement.contentFrame();
      if (frame) {
        const frameContent = await frame.content();
        console.log('Iframe includes fully booked?', frameContent.includes('fully booked') || frameContent.includes('We are currently'));
      }
    }
  } else {
    console.log('No book now button found');
  }
  
  await browser.close();
}

testClickBook();
