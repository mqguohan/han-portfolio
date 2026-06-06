const fs = require('fs');
const c = fs.readFileSync('D:/claude/datanteater3.0/probability_telescope_website.html', 'utf8');

// Extract main script (script 2 = index 2)
let pos = 0, i = 0, inner = '';
while (i < 3) {
  const start = c.indexOf('<script', pos);
  const tagEnd = c.indexOf('>', start);
  const end = c.indexOf('</script>', start);
  if (i === 2) { inner = c.slice(tagEnd+1, end); }
  pos = end + 9;
  i++;
}

// Find all callClaude, callGemini, callGPT, GeminiPanel prompt regions and count backticks
const regions = [
  { name: 'callClaude', start: inner.indexOf('async function callClaude('), end: inner.indexOf('\nasync function callGemini(') },
  { name: 'callGemini', start: inner.indexOf('async function callGemini('), end: inner.indexOf('\nasync function callGPT(') },
  { name: 'callGPT',    start: inner.indexOf('async function callGPT('), end: inner.indexOf('\n// \u2500\u2500 SYNTHESIS ENGINE') },
  { name: 'GeminiPanel', start: inner.indexOf('function GeminiPanel('), end: inner.indexOf('\n// \u2500\u2500 MODEL CONFIG') },
];

regions.forEach(function(r) {
  if (r.start === -1) { console.log(r.name, ': NOT FOUND'); return; }
  const block = inner.slice(r.start, r.end === -1 ? r.start + 3000 : r.end);
  let bt = 0;
  for (let j = 0; j < block.length; j++) if (block[j] === '`') bt++;
  console.log(r.name, ': backticks =', bt, '  size =', block.length);
  // Show all backtick positions with context
  for (let j = 0; j < block.length; j++) {
    if (block[j] === '`') {
      console.log('  BT at', j, ':', JSON.stringify(block.slice(Math.max(0,j-30), j+30)));
    }
  }
});

// Also check SITE_DATA block for backticks
const sdStart = inner.indexOf('const SITE_DATA =');
const sdEnd = inner.indexOf('function App()');
const sdBlock = inner.slice(sdStart, sdEnd);
let sdBt = 0;
for (let j = 0; j < sdBlock.length; j++) if (sdBlock[j] === '`') sdBt++;
console.log('\nSITE_DATA block: backticks =', sdBt);
