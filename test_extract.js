import fs from 'fs';
const html = fs.readFileSync('canvas_curl.html', 'utf-8');
const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (nextDataMatch) {
  const data = JSON.parse(nextDataMatch[1]);
  const compProps = data.props.pageProps.componentProps;
  for (const key of Object.keys(compProps)) {
    const comp = compProps[key];
    if (comp && comp.integratedCardsResult) {
      const results = comp.integratedCardsResult.item?.children?.results;
      if (results && results[0] && results[0].children?.results) {
        console.log('Canvas item keys:', Object.keys(results[0].children.results[0]));
        console.log('Canvas item example:', JSON.stringify(results[0].children.results[0], null, 2).substring(0, 1000));
        break;
      }
    }
  }
}
