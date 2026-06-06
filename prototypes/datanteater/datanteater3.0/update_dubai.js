// Updates Dubai content in the already-patched multi-site file (DST)
const fs = require('fs');
const DST = 'D:/claude/datanteater3.0/probability_telescope_website.html';
let c = fs.readFileSync(DST, 'utf8');
let ok = 0, fail = 0;

function patch(name, find, replace) {
  if (c.includes(find)) { c = c.replace(find, replace); ok++; console.log('OK:', name); }
  else { fail++; console.error('FAIL:', name, '| first 80:', JSON.stringify(find.slice(0,80))); }
}

// ── U1: DUBAI_IMGS paths ─────────────────────────────────────────────────────
patch('U1_dubai_imgs',
  'window.DUBAI_IMGS = {"2015": "dubai_2015.png", "2025": "dubai_2025.png", "2035": "dubai_2035.png"};',
  'window.DUBAI_IMGS = {"2015": "imagesdubai/dubai_2015.png", "2025": "imagesdubai/dubai_2025.png", "2035": "imagesdubai/dubai_2025.png"};'
);

// ── U2: DUBAI_FEATURES — replace entire block ────────────────────────────────
const OLD_FEATURES = `const DUBAI_FEATURES = [
  {id:"islands", label:"Artificial Islands", color:"#0ea5e9", zone:null, zoneType:"path", anchor:{x:450,y:220}, labelBox:{x:380,y:200,w:160,h:28}, leader:null,
   what:"Palm Jumeirah and World Islands \u2014 engineered landmass, no natural analogue.",
   versions:{"2015":{type:"measured",conf:92,d:"Clear coastline delineation from optical imagery."},"2025":{type:"measured",conf:88,d:"Expanded perimeter, ongoing construction visible."},"2035":{type:"inferred",conf:51,d:"Predicted further reclamation per Master Plan 2040."}}},
  {id:"reclaimed", label:"Reclaimed Coastline", color:"#f59e0b", zone:null, zoneType:"path", anchor:{x:250,y:350}, labelBox:{x:180,y:330,w:160,h:28}, leader:null,
   what:"Engineered shoreline extensions beyond original natural coast.",
   versions:{"2015":{type:"measured",conf:85,d:"Shoreline extension documented via comparative imagery."},"2025":{type:"measured",conf:80,d:"~67km reclaimed coast, expanded from 2015 baseline."},"2035":{type:"inferred",conf:48,d:"Projected ~85km based on approved development plans."}}},
  {id:"urban", label:"Urban / Built Development", color:"#8b5cf6", zone:null, zoneType:"path", anchor:{x:200,y:200}, labelBox:{x:130,y:180,w:170,h:28}, leader:null,
   what:"High-rise residential and commercial built environment.",
   versions:{"2015":{type:"measured",conf:91,d:"Dense urban fabric clearly visible in optical bands."},"2025":{type:"measured",conf:86,d:"Densification on reclaimed areas, new towers added."},"2035":{type:"inferred",conf:53,d:"High-rise infill anticipated, area expansion uncertain."}}},
  {id:"water", label:"Open Water", color:"#22c55e", zone:null, zoneType:"fill", anchor:{x:700,y:300}, labelBox:{x:640,y:280,w:120,h:28}, leader:null,
   what:"Persian Gulf coastal water \u2014 navigable channels and open sea.",
   versions:{"2015":{type:"measured",conf:95,d:"High-confidence spectral signature for open water."},"2025":{type:"measured",conf:93,d:"Reduced extent due to land reclamation activity."},"2035":{type:"inferred",conf:60,d:"Further reduction projected if reclamation proceeds."}}},
  {id:"dredge", label:"Dredged / Turbid Water", color:"#d97706", zone:null, zoneType:"path", anchor:{x:580,y:400}, labelBox:{x:510,y:380,w:180,h:28}, leader:null,
   what:"Turbid plumes from active dredging operations.",
   versions:{"2015":{type:"inferred",conf:67,d:"Spectral turbidity suggests active dredging."},"2025":{type:"inferred",conf:62,d:"Persistent turbidity zones near construction."},"2035":{type:"unknown",conf:32,d:"Dredging scope and duration unknown."}}},
  {id:"infra", label:"Coastal Infrastructure", color:"#06b6d4", zone:null, zoneType:"path", anchor:{x:350,y:460}, labelBox:{x:270,y:440,w:180,h:28}, leader:null,
   what:"Port facilities, marinas, and coastal protection structures.",
   versions:{"2015":{type:"measured",conf:82,d:"Port Rashid and Jebel Ali identifiable."},"2025":{type:"measured",conf:84,d:"Expanded marina infrastructure, new breakwaters."},"2035":{type:"inferred",conf:47,d:"Planned expansions inferred from published blueprints."}}},
  {id:"datagap", label:"Data Gap / Uncertain Zone", color:"#ef4444", zone:null, zoneType:"path", anchor:{x:800,y:120}, labelBox:{x:720,y:100,w:170,h:28}, leader:null,
   what:"Atmospheric haze, dust, or no-data coverage zones.",
   versions:{"2015":{type:"unknown",conf:18,d:"Haze and dust common in Gulf region imagery."},"2025":{type:"unknown",conf:22,d:"Partial cloud/dust cover in western extents."},"2035":{type:"unknown",conf:10,d:"Future atmospheric conditions unknown."}}}
];`;

const NEW_FEATURES = `const DUBAI_FEATURES = [
  {id:"islands", label:"Artificial Islands", color:"#0ea5e9", zone:null, zoneType:"path", anchor:{x:450,y:220}, labelBox:{x:380,y:200,w:160,h:28}, leader:null,
   what:"Palm Jumeirah and adjacent systems \u2014 engineered landmass with no natural coastal analogue.",
   versions:{
     "2015":{type:"measured",conf:84,d:"Palm Jumeirah geometry clearly legible in optical imagery."},
     "2025":{type:"measured",conf:89,d:"Island edge geometry stabilised; shoreline consolidation visible."},
     "2035":{type:"inferred",conf:68,d:"Projected maintenance and partial expansion under Master Plan 2040."}}},
  {id:"reclaimed", label:"Reclaimed Coastline", color:"#f59e0b", zone:null, zoneType:"path", anchor:{x:250,y:350}, labelBox:{x:180,y:330,w:160,h:28}, leader:null,
   what:"Engineered shoreline extensions \u2014 partially consolidated, beyond original natural coast.",
   versions:{
     "2015":{type:"measured",conf:76,d:"Shoreline extension partially consolidated; active reclamation zones visible."},
     "2025":{type:"measured",conf:81,d:"Engineered shoreline clearly visible; edge geometry stabilised."},
     "2035":{type:"inferred",conf:58,d:"Projected intensification of coastal edge per published master planning."}}},
  {id:"urban", label:"Urban / Built Development", color:"#f97316", zone:null, zoneType:"path", anchor:{x:200,y:200}, labelBox:{x:130,y:180,w:170,h:28}, leader:null,
   what:"High-density residential and commercial built environment along the reclaimed waterfront.",
   versions:{
     "2015":{type:"measured",conf:80,d:"Strong coastal build-up visible in optical bands."},
     "2025":{type:"measured",conf:86,d:"Denser waterfront occupation; tower footprints clearly legible."},
     "2035":{type:"inferred",conf:67,d:"Projected further infill along established waterfront corridors."}}},
  {id:"water", label:"Open Water", color:"#1d4ed8", zone:null, zoneType:"fill", anchor:{x:700,y:300}, labelBox:{x:640,y:280,w:120,h:28}, leader:null,
   what:"Persian Gulf coastal water \u2014 navigable channels and open sea zones.",
   versions:{
     "2015":{type:"measured",conf:73,d:"High-confidence open water; spectral signature unambiguous."},
     "2025":{type:"measured",conf:77,d:"Extent reduced by reclamation; water boundary clearly legible."},
     "2035":{type:"inferred",conf:55,d:"Further reduction projected if reclamation continues at current rate."}}},
  {id:"dredge", label:"Dredged / Turbid Water", color:"#d97706", zone:null, zoneType:"path", anchor:{x:580,y:400}, labelBox:{x:510,y:380,w:180,h:28}, leader:null,
   what:"Turbid plumes from active dredging \u2014 inferred from spectral data, not directly measured.",
   versions:{
     "2015":{type:"inferred",conf:49,d:"Turbidity plumes suggest dredging activity; spatial extent uncertain."},
     "2025":{type:"inferred",conf:54,d:"Persistent turbidity near construction zones; spectral inference."},
     "2035":{type:"unknown",conf:34,d:"Dredging intensity and location for projected period unknown."}}},
  {id:"infra", label:"Coastal Infrastructure", color:"#8b5cf6", zone:null, zoneType:"path", anchor:{x:350,y:460}, labelBox:{x:270,y:440,w:180,h:28}, leader:null,
   what:"Port facilities, marinas, breakwaters, and coastal protection structures.",
   versions:{
     "2015":{type:"measured",conf:66,d:"Port Rashid and Jebel Ali structures identifiable in imagery."},
     "2025":{type:"measured",conf:72,d:"Expanded marina infrastructure and new breakwaters visible."},
     "2035":{type:"inferred",conf:51,d:"Planned expansions inferred from published development blueprints."}}},
  {id:"datagap", label:"Data Gap / Uncertain Zone", color:"#ef4444", zone:null, zoneType:"path", anchor:{x:800,y:120}, labelBox:{x:720,y:100,w:170,h:28}, leader:null,
   what:"Atmospheric haze, dust, or low-confidence areas where visual evidence is unreliable.",
   versions:{
     "2015":{type:"unknown",conf:28,d:"Gulf dust and haze common in available optical imagery."},
     "2025":{type:"unknown",conf:24,d:"Partial coverage gaps; some zones visually unreliable."},
     "2035":{type:"unknown",conf:18,d:"Future atmospheric and data-coverage conditions unknown."}}}
];`;

patch('U2_dubai_features', OLD_FEATURES, NEW_FEATURES);

// ── U3: SITE_DATA dubai — yearConf, yearGap, yearTag, metrics ───────────────
const OLD_DUBAI_SITE = `  dubai: {
    name: "Dubai Coast / Artificial Islands",
    region: "Dubai, UAE",
    aiSiteName: "the Dubai Coast and artificial islands, Dubai, UAE",
    imgs: window.DUBAI_IMGS,
    yearConf: {"2015":88,"2025":74,"2035":46},
    yearGap:  {"2015":15,"2025":26,"2035":51},
    yearTag:  {"2015":"before","2025":"current","2035":"predicted"},
    features: DUBAI_FEATURES,
    metrics: [
      {l:"Art. Islands", v:{"2015":"~560ha",  "2025":"~1,380ha","2035":"~1,800ha"}, c:"#16a34a"},
      {l:"Recl. Coast",  v:{"2015":"~42km",   "2025":"~67km",   "2035":"~85km"},   c:"#d97706"},
      {l:"Population",   v:{"2015":"~2.0M",   "2025":"~3.6M",   "2035":"~5.0M"},   c:"#8b5cf6"}
    ],
    spatialZones: ["Artificial Islands","Reclaimed Coastline","Urban / Built Development","Open Water","Dredged / Turbid Water","Coastal Infrastructure","Data Gap / Uncertain Zone"]
  }`;

const NEW_DUBAI_SITE = `  dubai: {
    name: "Dubai Coast / Artificial Islands",
    region: "Dubai, UAE",
    subtitle: "Reclamation, dredging, and artificial shoreline production",
    description: "This case study examines Dubai\u2019s engineered coastline, including Palm Jumeirah and adjacent artificial island systems, as a landscape produced through reclamation, dredging, and coastal infrastructure. The tool distinguishes between directly legible geometries, inferred marine disturbance zones, and unknown or unstable areas where visual evidence is less reliable.",
    aiSiteName: "the Dubai Coast, Palm Jumeirah and artificial islands, Dubai, UAE",
    imgs: window.DUBAI_IMGS,
    yearConf: {"2015":69,"2025":74,"2035":48},
    yearGap:  {"2015":31,"2025":26,"2035":52},
    yearTag:  {"2015":"Historical Baseline","2025":"Current Observation","2035":"Projected / Inferred"},
    features: DUBAI_FEATURES,
    metrics: [
      {l:"Reclaimed Coastline", v:{"2015":"partially consolidated","2025":"engineered shoreline clearly visible","2035":"projected intensification"},          c:"#f59e0b"},
      {l:"Artificial Islands",  v:{"2015":"Palm geometry clearly legible","2025":"stabilized island edge geometry","2035":"projected maintenance / partial expansion"}, c:"#0ea5e9"},
      {l:"Urban / Built Dev.",  v:{"2015":"strong coastal build-up","2025":"denser waterfront occupation","2035":"projected further infill"},                 c:"#f97316"}
    ],
    spatialZones: ["Artificial Islands","Reclaimed Coastline","Urban / Built Development","Open Water","Dredged / Turbid Water","Coastal Infrastructure","Data Gap / Uncertain Zone"]
  }`;

patch('U3_dubai_site', OLD_DUBAI_SITE, NEW_DUBAI_SITE);

// ── U4: Apply previous-session patches that operate on SRC ──────────────────
// The blur/label patches (from session 1) need to be re-applied since this
// script reads from DST which already has them — nothing to do here.
// The multi-site patches are also already in DST.
// Only U1–U3 need applying.

// ── Verify syntax of main script ─────────────────────────────────────────────
const vm = require('vm');
let pp = 0, pi = 0;
while (pi < 3) {
  const ps = c.indexOf('<script', pp);
  const pte = c.indexOf('>', ps);
  const pe = c.indexOf('</script>', ps);
  if (pi === 2) {
    const script = c.slice(pte+1, pe);
    try { new vm.Script(script); console.log('\nSyntax: OK'); }
    catch(e) { console.error('\nSyntax ERROR:', e.message); }
    break;
  }
  pp = pe + 9;
  pi++;
}

console.log('\n=== SUMMARY: ok='+ok+' fail='+fail+' ===');
fs.writeFileSync(DST, c, 'utf8');
console.log('Written:', DST, ' size:', c.length);
