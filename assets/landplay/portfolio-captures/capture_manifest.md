# LANDPLAY portfolio capture manifest

Captured 2026-11-02. All paths below are relative to `D:\landscape engine\portfolio-captures`.

## Provenance and method

- Verified `start_server.bat` launches `v08h_start_and_land_selection_refine.html`.
- Source SHA256: `84A46C67FF184CF3EF568A9E0E19EA04DEB4EE3B7ADDD55B9EF78701A6AD3980`.
- The page title says v08h, but its gameplay banner still says `v0.7f — Base Land Selection Cards`. This is existing prototype text, not a different captured version.
- Documentation session identifier: **S02**, assigned for this manifest; the game provides no session ID. All delivered captures belong to this continuous Dry Basin playthrough, including initial selection and its linked ending world. An earlier framing trial was discarded by replacing its documentation captures with S02 captures.
- Interventions were performed through existing game controls. No ecological values, thresholds, rules, interface styles, random seeds, or classification results were changed. Tutorial Skip and Show Full Cell Data were normal interface controls.
- The launch script's `py` command was unavailable here. An in-memory Node static server served the unchanged project at `http://127.0.0.1:8000`, bound only to loopback. This changed no production files.
- Browser viewport override: 1920 × 1080, unchanged browser zoom. Full-page screenshots were used because viewport-only capture clipped the right-hand evidence panel. Consequently most gameplay images are 1905 pixels wide and taller than 1080; exact dimensions are listed below. No camera orbit, pan, or zoom was applied during A/C comparisons.
- Browser screenshots arrived as JPEG. Matching PNG files were made by format conversion only, without resizing, retouching, compositing, or fabricating content. PNG conversion cannot restore compression detail already lost in the JPEG originals. Original `.jpg` files remain alongside PNG delivery files.
- Each image has a matching `_evidence.txt` file containing the observed DOM snapshot. Those records supplement screenshots; they do not imply that text inside a clipped or internally scrolling panel is visible in the image.
- No game production files, existing assets, or separate portfolio repository files were edited. No commit was created.

## Capture inventory

All rows use prototype `v08h_start_and_land_selection_refine.html`, session S02.

| Filename | Portfolio section | Demonstration and stage | Actual evidence | Dimensions | Status |
|---|---|---|---|---|---|
| A01_player_action.png | How It Works | Turn 3, before applying Introduce Pioneer Plants to C3 | Selected intervention, actor, target and effects; C3 Extractive, organic activity 0, stability 43, toxicity 23 | 1905 × 1124 | Completed |
| A02_landscape_response.png | How It Works | Turn 4 display, after turn-3 planting at C3 | C3 changed to Dry; organic activity 15, stability 46; Extracted and Cultivated retained; field note describes feedback | 1905 × 1124 | Completed |
| A03_environmental_memory.png | How It Works | Same turn-4 state; full cell data opened | Recovery Memory 3, Bloom Memory 0; Extracted and Cultivated badges remain; recent history includes planting and original extraction | 1905 × 1149 | Completed |
| B01_initial_land.png | Gameplay Structure | Initial land selection, Dry Basin selected | Three genuine starting-land cards and Enter Landscape control | 1920 × 1080 | Completed |
| B02_main_simulation.png | Gameplay Structure | Turn 10 display, after turn-9 Build Seed Bank Network at C3 | Developed bloom/recovery field; vividness 68, toxicity 20, stability 59, recovery 100 | 1905 × 1124 | Completed |
| B03_final_reading.png | Gameplay Structure | End Simulation Now used after 9 actions | Resilient Recovery Field; actual report includes memories, ecological condition, verdict and World Prompt | 1905 × 2485 | Completed |
| B04_ending_world.png | Gameplay Structure | Enter Ending World from B03 | Loaded Spark/SPZ Resilient Recovery Field asset; camera at viewer's initial framing | 1920 × 1080 | Completed |
| C01_extraction.png | Environmental Memory | Turn 2 display, immediately after turn-1 Extract Surface Material at C3 | Extractive state; Extracted flag; T1 history; organic activity 0, stability 43, toxicity 27 | 1905 × 1124 | Completed |
| C02_persistent_scar.png | Environmental Memory | Turn 3 display, after turn-2 Survey Missing Data | Same C3 remains Extractive and Extracted; original extraction remains in recent history; stability 43, toxicity 23 | 1905 × 1124 | Completed |
| C03_recovery.png | Environmental Memory | Turn 9 display, after actual planting and rain interventions | Same C3 now Stable Bloom; Recovery Memory 13, Bloom Memory 6; Extracted, Recovered and Cultivated badges coexist; stability 69, organic activity 65, toxicity 23 | 1905 × 1149 | Completed |
| D02_ecologically_resilient.png | Optional Ecological Comparison | Turn 10 display; full global metrics opened | Actual game metrics listed below; recovery and biodiversity high, risk low, stability moderate | 1905 × 1237 | Completed |
| D01_visually_abundant.png — no file created | Optional Ecological Comparison | A qualifying fragile-abundance state was not reproduced in S02 | No claim that any captured lush field is fragile; this optional contrasting image remains outstanding | — | Requires Manual Capture |

## Action sequence and reproduction

Start Engine → Dry Basin → Enter Landscape → Skip tutorial → select C3 → Basic Forces.

| Action turn | Player action, always targeting C3 | Capture point / observed event |
|---|---|---|
| 1 | Extract Surface Material | C01 after action; header advances to Turn 2 |
| 2 | Survey Missing Data | C02 after action; random Community Volunteers Remove Waste reduced toxicity and added community memory |
| 3 | Introduce Pioneer Plants | A01 before applying; A02 after applying; open Show Full Cell Data for A03 |
| 4 | Introduce Pioneer Plants | Recovery accumulation |
| 5 | Introduce Pioneer Plants | Agronomy Team and Ecological Coalition became available; Local Community had already unlocked |
| 6 | Add Light Rain | Moisture support |
| 7 | Add Light Rain | C3 reached Early Bloom and acquired bloom/recovery flags |
| 8 | Introduce Pioneer Plants | C03 after action; random Migratory Birds Arrive also contributed to ecological change |
| 9 | Choose Ecological Coalition → Build Seed Bank Network | B02 and D02 after action; random Illegal Dumping at Night contaminated two cells |
| Finish | End Simulation Now | B03; this is an ordinary early-end control, not the automatic 30-action ending |
| World | Enter Ending World | B04 after status confirms Spark.js world loaded |

Header turn numbers indicate the next available action: Turn 4 means three actions have completed. S02 used normal unseeded random initialization, random action amounts and random events. This action sequence reproduces the interaction path, **not guaranteed identical numerical results or an identical ending**. No deterministic/debug state setup was used. Do not substitute a different ending world if a future replay produces a different ending.

## Actual global metrics for B02 / D02 / B03

| Metric | Value |
|---|---:|
| Vividness | 68 |
| Toxicity | 20 |
| Stability | 59 |
| Artificiality | 15 |
| Biodiversity | 100 |
| Speculation | 22 |
| Ecological recovery | 100 |
| Extraction pressure | 33 |
| Public visibility | 72 |
| Hidden risk | 14 |
| Bloom potential | 54 |
| Legibility | 16 |

Final distribution: 9 Dry, 9 Undefined, 3 Stable Bloom, 2 Early Bloom, 2 Recovery Patch cells. The recovery score reaching 100 does not mean every cell has recovered: six cells have the recovered flag, while all 25 have cultivation memory. These are authored composite scores.

## Interpretation limits to preserve in portfolio captions

1. **Memory is visibly supported, but reduced damage is not isolated experimentally.** C01–C03 prove that extraction history persists while recovery memory rises and the cell changes state. They do not isolate recovery's causal contribution from planting, rain, neighbor feedback or random events. The original scar is retained as data even when its visible pit is replaced by the dominant ecological appearance.
2. **Recurring extraction loss is rounded away.** `applyFeedbackLoops` computes stability minus `0.5 × (1 − min(1, recoveryMemory × 0.1))`, then `clamp` rounds to an integer. For an integer starting stability, the ordinary 0.5 loss rounds back up; the still-smaller loss under recovery also rounds away. Thus unchanged stability from C01 to C02 is real, and screenshots must not claim visible progressive erosion. At Recovery Memory 13 the formula's nominal penalty is zero, but these images cannot demonstrate the difference in isolation. A diagnostic showing unrounded before/after contributions, alongside applied rounded values and other feedback contributions, would be needed to expose the calculation. No diagnostic or rule change was made.
3. **Full cell data has an internal scrolling area.** Numeric recovery memory and top-level memory badges are visible. Lower full-history/all-flag text may require scrolling inside that panel. The evidence text retains the observed full history, including turn-1 extraction.
4. **Final Reading memories are interpretive prose.** The actual report mentions a processing facility operator, predictive landscape system and mineral consortium, although the recorded player actions were Basic Forces extraction, rain and seed-bank work; the turn-9 contamination actually came from random illegal dumping. These are the prototype's template-based narrative interpretations, not verified historical actors or literal causal accounts. For factual captions, use the action sequence above.
5. **B04 is a matching existing world prototype, not a fresh reconstruction of this exact field.** Its displayed values come from `assets/endings/resilient_recovery_field/metadata.json`: vividness 46, biodiversity 66, recovery 74, toxicity 26, stability 68, hidden risk 30, extraction pressure 22. Those are preset asset metadata, not S02 results. Only B03/D02 carry this session's final metrics. The world asset is `assets/endings/resilient_recovery_field.spz`.
6. **A02's response is deliberately modest.** One planting action removes C3's Extractive dominant classification by raising stability, but does not immediately create a lush patch. A03 supplies the numerical and historical evidence; C03 shows the later bloom after repeated interventions.

## Optional D01 manual capture route

No missing required screenshots remain. D01 is optional and was not captured; do not create a placeholder image. To attempt it without altering the game:

1. Open a fresh instance of the verified prototype and choose Dry Basin. Skip the tutorial and select C3.
2. Use rain, pioneer planting, nutrients or algae through Basic Forces; after unlocking Agronomy, use cultivation as appropriate. Watch the actual field and full global metrics.
3. Once several cells bloom, attempt a limited runoff intervention or an excessive nutrient pulse through the existing interface. Check metrics after each action; random events may prevent a suitable state.
4. Capture only if strong visible growth actually coexists with stability below 50, toxicity above 45, or hidden risk above 55. Keep full metrics expanded and record all actual values and actions. If the growth disappears or the risk criteria are not met, do not label it fragile abundance.
5. Save a direct screenshot as D01_visually_abundant.png, assign a new session ID, and update this manifest with the real metrics. This route is a conditional manual attempt, not a guaranteed reproduction recipe.

## Source mechanisms inspected

- Start and land selection: `showLandSelection`, `selectBaseLand`, `enterSelectedBaseLand`, `startSimulation`.
- Actions and local responses: `ACTIONS`, `applyAction`, `updateCellConditions`, `determineDominantState`, `checkThresholdRules`, `applyFeedbackLoops`, `applyDelayedEffects`.
- Memory: cell fields in `createGrid`, `updateMemory`, `recordNarrativeMemoryEvents`, `renderCellDetail`.
- Global diagnosis: `calculateGlobalMetrics`, `generateFinalReading`, `buildEndingPrompt`, `endSimulation`.
- Ending viewer: `ending-worlds/src/ending_world_registry.js`, `ending-worlds/src/ending_world_viewer.js`, ending metadata and SPZ asset.
