import { chromium } from 'playwright';

async function testBookingLinkWithCookies() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://www.the-fizz.com/en/search-nl#/searchcriteria=BUILDING:FIZZ_UTRECHT;AREA:UTRECHT;', { waitUntil: 'networkidle' });
  
  // Try to click Accept Cookies if it exists
  try {
    const cookieBtn = await page.$('a.brlbs-btn-accept-all, button:has-text("Accept"), button:has-text("Akzeptieren")');
    if (cookieBtn) {
      console.log('Clicking cookie banner...');
      await cookieBtn.click();
    }
  } catch (e) {
    console.log('No cookie banner found or could not click.');
  }

  await page.waitForTimeout(10000); // Wait for booking widget to initialize

  const content = await page.content();
  console.log('Includes fully booked?', content.includes('fully booked') || content.includes('sind keine'));
  
  await page.screenshot({ path: 'fizz_booking.png', fullPage: true });
  
  await browser.close();
}

testBookingLinkWithCookies();
