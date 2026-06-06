const fs = require('fs');
const patched = fs.readFileSync('D:/claude/datanteater3.0/probability_telescope_website.html', 'utf8');

// Extract script 2
let pp = 0, pi = 0;
while (pi < 3) {
  const ps = patched.indexOf('<script', pp);
  const pte = patched.indexOf('>', ps);
  const pe = patched.indexOf('</script>', ps);
  if (pi === 2) {
    const pScript = patched.slice(pte+1, pe);
    fs.writeFileSync('/tmp/extracted_script.js', pScript, 'utf8');
    console.log('Script written, size:', pScript.length);
    break;
  }
  pp = pe + 9;
  pi++;
}
