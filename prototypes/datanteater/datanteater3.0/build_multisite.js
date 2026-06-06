const fs = require('fs');
const SRC = 'D:/probabilitytelescope/probability_telescope_package/probability_telescope_website.html';
const DST = 'D:/claude/datanteater3.0/probability_telescope_website.html';
let c = fs.readFileSync(SRC, 'utf8');
let ok = 0, fail = 0;

function patch(name, find, replace) {
  if (c.includes(find)) { c = c.replace(find, replace); ok++; console.log('OK:', name); }
  else { fail++; console.error('FAIL:', name); }
}

// ── P1: window.DUBAI_IMGS ─────────────────────────────────────────────────
patch('P1_dubai_imgs',
  'window.IMGS = {"2015": window.IMG_2015, "2025": window.IMG_2025, "2035": window.IMG_2035};',
  'window.IMGS = {"2015": window.IMG_2015, "2025": window.IMG_2025, "2035": window.IMG_2035};\nwindow.DUBAI_IMGS = {"2015": "dubai_2015.png", "2025": "dubai_2025.png", "2035": "dubai_2035.png"};'
);

// ── P2: DUBAI_FEATURES + SITE_DATA before function App() ──────────────────
const SITE_DATA_BLOCK = `
// \u2500\u2500 DUBAI FEATURES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const DUBAI_FEATURES = [
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
];

// \u2500\u2500 SITE DATA \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const SITE_DATA = {
  yellow: {
    name: "Yellow River Delta",
    region: "Shandong, China",
    aiSiteName: "the Yellow River Delta, Shandong Province, China",
    imgs: window.IMGS,
    yearConf: {"2015":78,"2025":68,"2035":44},
    yearGap:  {"2015":22,"2025":32,"2035":56},
    yearTag:  YEAR_TAG,
    features: FEATURES,
    metrics: [
      {l:"Wetland",  v:{"2015":"~8,200ha","2025":"~6,400ha","2035":"~4,900ha"}, c:"#16a34a"},
      {l:"Sediment", v:{"2015":"~12km",   "2025":"~18km",   "2035":"~22\u201325km"}, c:"#d97706"},
      {l:"Dongying", v:{"2015":"~1.8M",   "2025":"~2.1M",   "2035":"~2.5M"},   c:"#8b5cf6"}
    ],
    spatialZones: ["Yellow River Channel","Sediment Plume","Wetland / Reed Beds","Agricultural Land","Urban / Dongying","Cloud / Data Gap","Delta Lobe","Coastal Water"]
  },
  dubai: {
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
  }
};

`;
patch('P2_site_data', 'function App() {', SITE_DATA_BLOCK + 'function App() {');

// ── P3: Slider — add imgs prop ────────────────────────────────────────────
patch('P3a_slider_sig',
  'function Slider({\n  yA,\n  yB\n}) {',
  'function Slider({\n  yA,\n  yB,\n  imgs\n}) {\n  imgs = imgs || window.IMGS;'
);
patch('P3b_slider_yB',
  '  }, /*#__PURE__*/React.createElement("img", {\n    src: IMGS[yB],\n    style: {\n      position: "absolute",\n      inset: 0,\n      width: "100%",\n      height: "100%",\n      objectFit: "cover"\n    },\n    alt: ""\n  }), /*#__PURE__*/React.createElement("div", {\n    style: {\n      position: "absolute",\n      inset: 0,\n      overflow: "hidden",\n      width: pos + "%"',
  '  }, /*#__PURE__*/React.createElement("img", {\n    src: imgs[yB],\n    style: {\n      position: "absolute",\n      inset: 0,\n      width: "100%",\n      height: "100%",\n      objectFit: "cover"\n    },\n    alt: ""\n  }), /*#__PURE__*/React.createElement("div", {\n    style: {\n      position: "absolute",\n      inset: 0,\n      overflow: "hidden",\n      width: pos + "%"'
);
patch('P3c_slider_yA',
  '    src: IMGS[yA],\n    style: {\n      position: "absolute",\n      top: 0,\n      left: 0,',
  '    src: imgs[yA],\n    style: {\n      position: "absolute",\n      top: 0,\n      left: 0,'
);

// ── P4: SatMap — add imgs prop ─────────────────────────────────────────────
patch('P4a_satmap_sig',
  'function SatMap({\n  year,\n  active,\n  setActive\n}) {',
  'function SatMap({\n  year,\n  active,\n  setActive,\n  imgs\n}) {\n  imgs = imgs || window.IMGS;'
);
patch('P4b_satmap_src',
  '    src: IMGS[year],\n    onLoad: () => setLoaded(true),',
  '    src: imgs[year],\n    onLoad: () => setLoaded(true),'
);
patch('P4c_satmap_alt',
  'alt: "Yellow River Delta"',
  'alt: "satellite image"'
);

// ── P5: YoloPanel — add imgs prop ─────────────────────────────────────────
patch('P5a_yolo_sig',
  'function YoloPanel({\n  year\n}) {',
  'function YoloPanel({\n  year,\n  imgs\n}) {\n  imgs = imgs || window.IMGS;'
);
patch('P5b_yolo_src',
  '    img.src = IMGS[year];',
  '    img.src = imgs[year];'
);

// ── P6: callClaude — add siteName + spatialZones params ───────────────────
patch('P6a_callclaude_sig',
  'async function callClaude(apiKey, imgBase64, year) {',
  'async function callClaude(apiKey, imgBase64, year, siteName, spatialZones) {\n  siteName = siteName || "the Yellow River Delta, Shandong Province, China";\n  spatialZones = spatialZones || SPATIAL_ZONES;'
);
patch('P6b_callclaude_sitename',
  'satellite image of the Yellow River Delta, China (${year}).',
  'satellite image of ${siteName} (${year}).'
);
// Replace hardcoded zone list in callClaude with dynamic template
const oldClaudeZones = `  "zones": [
    {"name": "Yellow River Channel", "confidence": <0-100>, "status": "measured|inferred|unknown", "detail": "<10 words max>"},
    {"name": "Sediment Plume", "confidence": <0-100>, "status": "measured|inferred|unknown", "detail": "<10 words max>"},
    {"name": "Wetland / Reed Beds", "confidence": <0-100>, "status": "measured|inferred|unknown", "detail": "<10 words max>"},
    {"name": "Agricultural Land", "confidence": <0-100>, "status": "measured|inferred|unknown", "detail": "<10 words max>"},
    {"name": "Urban / Dongying", "confidence": <0-100>, "status": "measured|inferred|unknown", "detail": "<10 words max>"},
    {"name": "Cloud / Data Gap", "confidence": <0-100>, "status": "unknown", "detail": "<10 words max>"}
  ],
  "key_finding":"<one sentence>",
  "2035_prediction":"<one sentence>"
}\``;
const newClaudeZones = '  "zones": [\\n    \${spatialZones.map(z => `{"name":"${z}","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words max>"}`).join(",\\\\n    ")}\\n  ],\\n  "key_finding":"<one sentence>",\\n  "2035_prediction":"<one sentence>"\\n}`';
patch('P6c_callclaude_zones', oldClaudeZones, newClaudeZones);

// ── P7: callGemini — add siteName + spatialZones params ───────────────────
patch('P7a_callgemini_sig',
  'async function callGemini(apiKey, imgBase64, year) {',
  'async function callGemini(apiKey, imgBase64, year, siteName, spatialZones) {\n  siteName = siteName || "the Yellow River Delta, Shandong Province, China";\n  spatialZones = spatialZones || SPATIAL_ZONES;'
);
// Replace hardcoded site name in callGemini prompt
patch('P7b_callgemini_site',
  'Analyze this satellite image of Yellow River Delta (',
  'Analyze this satellite image of ${siteName} ('
);
// Replace hardcoded zone list in callGemini
const oldGeminiZones = '{"name":"Yellow River Channel","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Sediment Plume","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Wetland / Reed Beds","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Agricultural Land","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Urban / Dongying","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Cloud / Data Gap","confidence":<0-100>,"status":"unknown","detail":"<10 words>"},{"name":"Delta Lobe","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Coastal Water","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"}';
const newGeminiZones = '\${spatialZones.map(z => `{"name":"${z}","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"}`).join(",")}';
patch('P7c_callgemini_zones', oldGeminiZones, newGeminiZones);

// ── P8: callGPT — add siteName + spatialZones params ──────────────────────
patch('P8a_callgpt_sig',
  'async function callGPT(apiKey, imgBase64, year) {',
  'async function callGPT(apiKey, imgBase64, year, siteName, spatialZones) {\n  siteName = siteName || "the Yellow River Delta, Shandong Province, China";\n  spatialZones = spatialZones || SPATIAL_ZONES;'
);
patch('P8b_callgpt_site',
  'Analyze satellite image of Yellow River Delta (',
  'Analyze satellite image of ${siteName} ('
);
const oldGPTZones = '{"name":"Yellow River Channel","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Sediment Plume","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Wetland / Reed Beds","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Agricultural Land","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Urban / Dongying","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Cloud / Data Gap","confidence":<0-100>,"status":"unknown","detail":"<10 words>"},{"name":"Delta Lobe","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"},{"name":"Coastal Water","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"}';
const newGPTZones = '\${spatialZones.map(z => `{"name":"${z}","confidence":<0-100>,"status":"measured|inferred|unknown","detail":"<10 words>"}`).join(",")}';
patch('P8c_callgpt_zones', oldGPTZones, newGPTZones);

// ── P9: synthesize — add spatialZones param ───────────────────────────────
patch('P9_synthesize_sig',
  'function synthesize(results) {\n  const valid = Object.entries(results).filter(([, r]) => r && !r.error);\n  if (valid.length === 0) return null;\n\n  // Per-zone consensus: mean confidence + disagreement (std dev)\n  const zoneSynthesis = SPATIAL_ZONES.map(zoneName => {',
  'function synthesize(results, spatialZones) {\n  spatialZones = spatialZones || SPATIAL_ZONES;\n  const valid = Object.entries(results).filter(([, r]) => r && !r.error);\n  if (valid.length === 0) return null;\n\n  // Per-zone consensus: mean confidence + disagreement (std dev)\n  const zoneSynthesis = spatialZones.map(zoneName => {'
);

// ── P10: GeminiPanel — add imgs, siteName, spatialZones props ─────────────
patch('P10a_gemini_sig',
  'function GeminiPanel({\n  year\n}) {',
  'function GeminiPanel({\n  year,\n  imgs,\n  siteName,\n  spatialZones\n}) {\n  imgs = imgs || window.IMGS;\n  siteName = siteName || "the Yellow River Delta, Shandong Province, China";\n  spatialZones = spatialZones || SPATIAL_ZONES;'
);
patch('P10b_gemini_imgs',
  '    setResult(null);\n    const imgData = IMGS[yr].split(",")[1];',
  '    setResult(null);\n    if (!imgs[yr] || !imgs[yr].startsWith("data:")) {\n      setError("AI analysis requires base64 image data. Load site images via the GIS panel first.");\n      setLoading(false);\n      return;\n    }\n    const imgData = imgs[yr].split(",")[1];'
);
patch('P10c_gemini_prompt_site',
  'You are a remote sensing expert analyzing a satellite image of the Yellow River Delta, Shandong Province, China (${yr}).',
  'You are a remote sensing expert analyzing a satellite image of ${siteName} (${yr}).'
);
// Replace hardcoded zone template in GeminiPanel long prompt
const oldGeminiLongZones = '"zones":[{"name":"Yellow River Channel","status":"measured","confidence":92,"detail":"Turbid brown water channel visible tracking northeast."},{"name":"Sediment Plume","status":"measured","confidence":80,"detail":"Yellow-brown turbid water extending into Bohai Sea."},{"name":"Wetland/Reed Beds","status":"inferred","confidence":58,"detail":"Dark green biomass south of river, soil unverifiable."},{"name":"Agricultural Land","status":"measured","confidence":85,"detail":"Regular rectangular field parcels in western area."},{"name":"Urban/Dongying","status":"measured","confidence":82,"detail":"Dense grey urban fabric with grid street pattern."},{"name":"Cloud/Haze","status":"unknown","confidence":18,"detail":"NE quadrant obscured, no spectral data available."}]';
const newGeminiLongZones = '"zones":[\${spatialZones.map((z,i)=>`{"name":"${z}","status":"measured|inferred|unknown","confidence":<0-100>,"detail":"<one-line visible observation>"}`).join(",")}]';
patch('P10d_gemini_long_zones', oldGeminiLongZones, newGeminiLongZones);

// ── P11: MultiLLMPanel — add imgs, siteName, spatialZones props ────────────
patch('P11a_multi_sig',
  'function MultiLLMPanel({\n  year\n}) {',
  'function MultiLLMPanel({\n  year,\n  imgs,\n  siteName,\n  spatialZones\n}) {\n  imgs = imgs || window.IMGS;\n  siteName = siteName || "the Yellow River Delta, Shandong Province, China";\n  spatialZones = spatialZones || SPATIAL_ZONES;'
);
patch('P11b_multi_imgs',
  '    setSynthesis(null);\n    const imgData = IMGS[yr].split(",")[1];',
  '    setSynthesis(null);\n    if (!imgs[yr] || !imgs[yr].startsWith("data:")) {\n      setPhase("done");\n      setSynthesis({_error: "AI analysis requires base64 image data. Load site images via the GIS panel first."});\n      setLoading({});\n      return;\n    }\n    const imgData = imgs[yr].split(",")[1];'
);
patch('P11c_multi_callers',
  '        const result = await callers[model](keys[model].trim(), imgData, yr);',
  '        const result = await callers[model](keys[model].trim(), imgData, yr, siteName, spatialZones);'
);
patch('P11d_multi_synthesize',
  'setSynthesis(synthesize(updated));',
  'setSynthesis(synthesize(updated, spatialZones));'
);

// ── P12: exportToPDF — add siteImgs param ─────────────────────────────────
patch('P12a_pdf_sig',
  'async function exportToPDF(year, mode, zones, synthesis) {',
  'async function exportToPDF(year, mode, zones, synthesis, siteImgs) {\n  siteImgs = siteImgs || window.IMGS;'
);
patch('P12b_pdf_imgs',
  '      satImg.src = window.IMGS[year];',
  '      satImg.src = siteImgs[year];'
);

// ── P13: App — add siteKey state + SD ─────────────────────────────────────
patch('P13a_app_state',
  '  const [tab, setTab] = useState("analysis");\n  return /*#__PURE__*/',
  '  const [tab, setTab] = useState("analysis");\n  const [siteKey, setSiteKey] = useState("yellow");\n  const SD = SITE_DATA[siteKey];\n  return /*#__PURE__*/'
);

// ── P14: App header eyebrow text ───────────────────────────────────────────
patch('P14_header_eyebrow',
  '"Probability Telescope \\xB7 ESRI World Imagery \\xB7 Yellow River Delta"',
  '"Probability Telescope \\xB7 ESRI World Imagery \\xB7 " + SD.name'
);

// ── P15: App header h1 + subtitle ─────────────────────────────────────────
patch('P15_header_h1',
  '}, "Yellow River Delta ", /*#__PURE__*/React.createElement("span", {\n    style: {\n      fontWeight: 300,\n      color: "#1a2438",\n      fontSize: 12\n    }\n  }, "\\xB7 Shandong, China \\xB7 Epistemic Annotation"))))',
  '}, SD.name + " ", /*#__PURE__*/React.createElement("span", {\n    style: {\n      fontWeight: 300,\n      color: "#1a2438",\n      fontSize: 12\n    }\n  }, "\\xB7 " + SD.region + " \\xB7 Epistemic Annotation"))))'
);

// ── P16: App header — insert site switcher ─────────────────────────────────
const OLD_SWITCHER_ANCHOR = '  }), /*#__PURE__*/React.createElement("div", {\n    style: {\n      display: "flex",\n      gap: 3,\n      flexShrink: 0\n    }\n  }, [["annotate", "Annotate"], ["compare", "Before / After"]].map';
const NEW_SWITCHER_ANCHOR = `  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      alignItems: "center",
      flexShrink: 0,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid #0d1520",
      borderRadius: 4,
      padding: "2px 3px"
    }
  }, [["yellow", "\\u0394 Yellow River"], ["dubai", "\\u25C6 Dubai Coast"]].map(function(siteOpt) {
    var k = siteOpt[0], l = siteOpt[1];
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: function() { setSiteKey(k); setActive(null); },
      style: {
        padding: "3px 9px",
        borderRadius: 3,
        border: "1px solid " + (k === siteKey ? "rgba(59,130,246,0.45)" : "transparent"),
        background: k === siteKey ? "rgba(59,130,246,0.12)" : "transparent",
        color: k === siteKey ? "#60a5fa" : "#4b5563",
        fontSize: 9,
        cursor: "pointer",
        fontFamily: MONO,
        fontWeight: k === siteKey ? 700 : 400,
        letterSpacing: "0.03em"
      }
    }, l);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      flexShrink: 0
    }
  }, [["annotate", "Annotate"], ["compare", "Before / After"]].map`;
patch('P16_site_switcher', OLD_SWITCHER_ANCHOR, NEW_SWITCHER_ANCHOR);

// ── P17: YEAR_TAG → SD.yearTag ────────────────────────────────────────────
patch('P17_year_tag',
  '}, YEAR_TAG[y])))),',
  '}, SD.yearTag[y])))),'
);

// ── P18: YEAR_CONF → SD.yearConf ──────────────────────────────────────────
patch('P18_year_conf',
  '    val: YEAR_CONF[year],',
  '    val: SD.yearConf[year],'
);

// ── P19: YEAR_GAP → SD.yearGap (annotate confidence display) ──────────────
patch('P19_year_gap_annotate',
  '}, "gap ", YEAR_GAP[year], "%"))',
  '}, "gap ", SD.yearGap[year], "%"))'
);

// ── P20: YEAR_GAP → SD.yearGap (compare mode rhetoric gap cards) ──────────
patch('P20_year_gap_compare',
  '    const g = YEAR_GAP[y],',
  '    const g = SD.yearGap[y],'
);

// ── P21: exportToPDF call — pass SD.features and SD.imgs ──────────────────
patch('P21_export_btn',
  'onClick: () => exportToPDF(year, mode, FEATURES.map(f => f.versions[year]), null),',
  'onClick: () => exportToPDF(year, mode, SD.features.map(f => f.versions[year]), null, SD.imgs),'
);

// ── P22: SatMap call — pass imgs ──────────────────────────────────────────
patch('P22_satmap_call',
  '/*#__PURE__*/React.createElement(SatMap, {\n    year: year,\n    active: active,\n    setActive: setActive\n  })',
  '/*#__PURE__*/React.createElement(SatMap, {\n    year: year,\n    active: active,\n    setActive: setActive,\n    imgs: SD.imgs\n  })'
);

// ── P23: Slider call — pass imgs ──────────────────────────────────────────
patch('P23_slider_call',
  '/*#__PURE__*/React.createElement(Slider, {\n    yA: cA,\n    yB: cB\n  })',
  '/*#__PURE__*/React.createElement(Slider, {\n    yA: cA,\n    yB: cB,\n    imgs: SD.imgs\n  })'
);

// ── P24: Analysis sidebar FEATURES.map → SD.features.map ──────────────────
patch('P24_features_map',
  '  }, FEATURES.map(f => {',
  '  }, SD.features.map(f => {'
);

// ── P25: Hardcoded compare-mode metrics → SD.metrics ─────────────────────
patch('P25_metrics',
  '  }, [{\n    l: "Wetland",\n    v: {\n      "2015": "~8,200ha",\n      "2025": "~6,400ha",\n      "2035": "~4,900ha"\n    },\n    c: "#16a34a"\n  }, {\n    l: "Sediment",\n    v: {\n      "2015": "~12km",\n      "2025": "~18km",\n      "2035": "~22\u201325km"\n    },\n    c: "#d97706"\n  }, {\n    l: "Dongying",\n    v: {\n      "2015": "~1.8M",\n      "2025": "~2.1M",\n      "2035": "~2.5M"\n    },\n    c: "#8b5cf6"\n  }].map(item =>',
  '  }, SD.metrics.map(item =>'
);

// ── P26: YoloPanel call — pass imgs ───────────────────────────────────────
patch('P26_yolo_call',
  'tab === "yolo" && /*#__PURE__*/React.createElement(YoloPanel, {\n    year: year\n  })',
  'tab === "yolo" && /*#__PURE__*/React.createElement(YoloPanel, {\n    year: year,\n    imgs: SD.imgs\n  })'
);

// ── P27: GeminiPanel call — pass imgs + siteName + spatialZones ───────────
patch('P27_gemini_call',
  'tab === "gemini" && /*#__PURE__*/React.createElement(GeminiPanel, {\n    year: year\n  })',
  'tab === "gemini" && /*#__PURE__*/React.createElement(GeminiPanel, {\n    year: year,\n    imgs: SD.imgs,\n    siteName: SD.aiSiteName,\n    spatialZones: SD.spatialZones\n  })'
);

// ── P28: MultiLLMPanel call — pass imgs + siteName + spatialZones ─────────
patch('P28_multi_call',
  'tab === "multi" && /*#__PURE__*/React.createElement(MultiLLMPanel, {\n    year: year\n  })',
  'tab === "multi" && /*#__PURE__*/React.createElement(MultiLLMPanel, {\n    year: year,\n    imgs: SD.imgs,\n    siteName: SD.aiSiteName,\n    spatialZones: SD.spatialZones\n  })'
);

// ── SUMMARY ───────────────────────────────────────────────────────────────
console.log('\n=== SUMMARY: ok=' + ok + '  fail=' + fail + ' ===');
fs.writeFileSync(DST, c, 'utf8');
console.log('Written:', DST, '  size:', c.length);
