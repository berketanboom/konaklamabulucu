async function testSites() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  try {
    console.log('\n--- NewNewNew ---');
    const resPlaza = await fetch('https://newnewnew.space/en/search?city=Utrecht', { headers });
    const htmlPlaza = await resPlaza.text();
    console.log('NewNewNew HTML length:', htmlPlaza.length);
    const nextDataPlaza = htmlPlaza.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataPlaza) console.log('NewNewNew uses Next.js');
    
  } catch (err) {
    console.error(err);
  }
}

testSites();
