const fs = require('fs');
const c = fs.readFileSync('D:/claude/datanteater3.0/probability_telescope_website.html', 'utf8');
const vm = require('vm');
let pos = 0, i = 0;
while (i < 3) {
  const start = c.indexOf('<script', pos);
  const tagEnd = c.indexOf('>', start);
  const end = c.indexOf('</script>', start);
  if (i === 2) {
    const inner = c.slice(tagEnd+1, end);

    // Find all spatialZones patches
    ['spatialZones.map(z =>', 'spatialZones.map((z,i)=>'].forEach(function(needle) {
      const idx = inner.indexOf(needle);
      if (idx !== -1) {
        console.log('Found:', needle, 'at', idx);
        console.log('Context:', JSON.stringify(inner.slice(Math.max(0,idx-80), idx+250)));
        console.log('');
      } else {
        console.log('NOT FOUND:', needle);
      }
    });

    // Count backticks
    let bt = 0;
    for (let j = 0; j < inner.length; j++) if (inner[j] === '`') bt++;
    console.log('Total backticks:', bt, '(odd = unclosed template literal)');

    // Try to find exact error by checking chunks from end
    try {
      new vm.Script(inner);
      console.log('FULL SCRIPT OK');
    } catch(e) {
      console.log('Error:', e.message);
      // Scan for invalid content - try chunks of 1000 chars
      for (let off = 0; off < inner.length; off += 500) {
        const chunk = inner.slice(0, off + 500);
        try {
          new vm.Script(chunk);
        } catch(e2) {
          if (e2.message !== 'Unexpected end of input') {
            console.log('Non-EOF error at offset', off, ':', e2.message);
            console.log('Context:', JSON.stringify(inner.slice(Math.max(0, off-50), off+200)));
            break;
          }
        }
      }
    }
    break;
  }
  pos = end + 9;
  i++;
}
