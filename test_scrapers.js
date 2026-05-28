async function testSites() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  try {
    // 1. Plaza
    console.log('\n--- Plaza ---');
    const resPlaza = await fetch('https://plaza.newnewnew.space/en/search?city=Utrecht', { headers });
    const htmlPlaza = await resPlaza.text();
    console.log('Plaza HTML length:', htmlPlaza.length);
    const nextDataPlaza = htmlPlaza.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataPlaza) console.log('Plaza uses Next.js');
    
    // 2. Xior
    console.log('\n--- Xior ---');
    const resXior = await fetch('https://www.xior.be/en/city/utrecht', { headers });
    const htmlXior = await resXior.text();
    console.log('Xior HTML length:', htmlXior.length);
    
    // 3. Holland2Stay
    console.log('\n--- Holland2Stay ---');
    const resH2S = await fetch('https://holland2stay.com/residences.html?available_to_book=179&city=29', { headers });
    const htmlH2S = await resH2S.text();
    console.log('Holland2Stay HTML length:', htmlH2S.length);
    
  } catch (err) {
    console.error(err);
  }
}

testSites();
