import fs from 'fs';

const url = 'https://www.canvas-world.com/en/locations/united-kingdom/london/walthamstow';
fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } })
  .then(res => res.text())
  .then(html => {
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    const pageProps = JSON.parse(nextDataMatch[1]);
    const compProps = pageProps.props?.pageProps?.componentProps || {};
    let rawRooms = [];
    for (const key of Object.keys(compProps)) {
      const comp = compProps[key];
      if (comp && comp.integratedCardsResult) {
        const results = comp.integratedCardsResult.item?.children?.results;
        if (results && results[0] && results[0].children?.results) {
          rawRooms = results[0].children.results;
          break;
        }
      }
    }
    console.log('Room object:');
    console.log(JSON.stringify(rawRooms[0], null, 2));
  }).catch(err => console.error(err));
