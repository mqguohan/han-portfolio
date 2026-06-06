const fs = require('fs');
const orig = fs.readFileSync('D:/probabilitytelescope/probability_telescope_package/probability_telescope_website.html', 'utf8');
const patched = fs.readFileSync('D:/claude/datanteater3.0/probability_telescope_website.html', 'utf8');

function countBTInScript(html, scriptIndex) {
  let pos = 0, i = 0;
  while (true) {
    const start = html.indexOf('<script', pos);
    if (start === -1) break;
    const tagEnd = html.indexOf('>', start);
    const end = html.indexOf('</script>', start);
    if (i === scriptIndex) {
      const inner = html.slice(tagEnd+1, end);
      let bt = 0;
      for (let j = 0; j < inner.length; j++) if (inner[j] === '`') bt++;
      return {count: bt, size: inner.length};
    }
    pos = end + 9;
    i++;
  }
  return null;
}

// Count backticks in script 2 of original and patched
const origBT = countBTInScript(orig, 2);
const patchedBT = countBTInScript(patched, 2);
console.log('Original script 2: bt='+origBT.count+' size='+origBT.size);
console.log('Patched  script 2: bt='+patchedBT.count+' size='+patchedBT.size);
console.log('Difference: '+(patchedBT.count - origBT.count));

// Find specific added backticks - look for all backtick positions that differ
// Extract both scripts
let op = 0, pi = 0, oi = 0;
while (oi < 3) {
  const os = orig.indexOf('<script', op);
  const ote = orig.indexOf('>', os);
  const oe = orig.indexOf('</script>', os);
  if (oi === 2) {
    const origScript = orig.slice(ote+1, oe);
    // Find all bt in orig
    const origBTs = [];
    for (let j = 0; j < origScript.length; j++) if (origScript[j] === '`') origBTs.push(j);
    console.log('\nOriginal bt count:', origBTs.length);
    origBTs.forEach(j => {
      const ctx = origScript.slice(Math.max(0,j-20),j+20);
      if (ctx.includes('spatialZones') || ctx.includes('siteN')) console.log('ORIG BT at', j, ':', JSON.stringify(ctx));
    });
    break;
  }
  op = oe + 9;
  oi++;
}

// Also verify: run vm on each to check syntax
const vm = require('vm');
let pp = 0, pi2 = 0;
while (pi2 < 3) {
  const ps = patched.indexOf('<script', pp);
  const pte = patched.indexOf('>', ps);
  const pe = patched.indexOf('</script>', ps);
  if (pi2 === 2) {
    const pScript = patched.slice(pte+1, pe);
    try { new vm.Script(pScript); console.log('\nFull patched script 2: OK'); }
    catch(e) { console.log('\nFull patched script 2 error:', e.message); }
    break;
  }
  pp = pe + 9;
  pi2++;
}
