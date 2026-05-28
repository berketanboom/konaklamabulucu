import fs from 'fs';
const html = fs.readFileSync('xior.html', 'utf-8');
const dataMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
if (dataMatch) {
  dataMatch.forEach(script => {
    if (script.includes('drupalSettings') || script.includes('buildings') || script.includes('rooms')) {
      console.log('Found script with data:', script.substring(0, 200));
    }
  });
}
