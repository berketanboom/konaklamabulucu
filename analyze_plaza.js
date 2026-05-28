import fs from 'fs';

const filePath = 'C:\\Users\\Tufan TABAK\\.gemini\\antigravity\\brain\\4102693f-5dcd-4bf0-95a1-0fb94701300f\\.system_generated\\steps\\153\\content.md';
const content = fs.readFileSync(filePath, 'utf-8');

console.log('HTML size:', content.length);

// Look for __NEXT_DATA__ or similar
const nextDataMatch = content.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (nextDataMatch) {
  console.log('__NEXT_DATA__ found!');
} else {
  console.log('__NEXT_DATA__ NOT found.');
}

// Check if Utrecht is mentioned
if (content.toLowerCase().includes('utrecht')) {
  console.log('Utrecht found in the page!');
}

// Find any API endpoints
const apiMatches = content.match(/https:\/\/[\w.-]+\/api\/[\w.-]+/g);
if (apiMatches) {
  console.log('API endpoints found:', [...new Set(apiMatches)].slice(0, 5));
}
