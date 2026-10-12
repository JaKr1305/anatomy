# Formulation decision machine

An interactive isometric illustration for an executive presentation, built with the
[Anatomy](https://github.com/wheresryan22/anatomy) kit (vendored in `kit/` and `scripts/`, MIT, see `LICENSE.anatomy`).

![Preview](formulation-machine/preview.png)

Open `formulation-machine/formulation-machine.html` in a browser. It is one self-contained page with no dependencies.

The page leads with the business question and a four-step story: **Evidence → Alternative generation → Evaluation → Human decision**. Press a step, or **Play the story**, and the machine spotlights the parts that do that step.

**In the drawing** (short labels only):
- **Evidence sources:** BFoM, KNOWLEDGE, gRIS, MFG DATA and COGS feed the intake header.
- **Stations:** BENCHMARK, RETRIEVAL, GENERATION (a tablet press), SIMULATION and COST.
- **CONSTRAINTS:** seven checkpoints over the belt. Rejected options (shown in coral) leave down a chute into a reject bin.
- **TRACE:** the evidence recorder, on a bus that runs behind every station.
- **Outputs:** three strategic options on pedestals: Cost leadership, Differentiation and Mfg excellence.
- **The human decision gate:** an overhead carriage and lamp, plus a HUMAN console.

**Colours:** data is blue, processing and simulation are turquoise, decisions are navy, and rejections are coral.

**Views:**
- **Machine:** the full drawing.
- **Traceability** (`T`): only the evidence trail.
- **Roadmap** (`R`): existing capabilities glow blue, those in development glow turquoise, and the future vision is greyed.

**Panels below the figure:**
- the selected option, with confidence indicators (source, refresh date, coverage, confidence, traceability) and the accountability statement
- a comparison of the three options
- why options are rejected, gate by gate
- an example scenario (a high drug-load oral tablet)

Choose an option by hovering a pedestal, clicking an option button, or pressing `1` `2` `3` or the arrow keys.

**All scores, counts, dates and confidence values are illustrative placeholders.** They all live in `formulation-machine/model.mjs`, including which drawn parts belong to each story step and each roadmap level. Edit that file and rebuild.

## Rebuild

```sh
node formulation-machine/build.mjs           # writes formulation-machine.html
node formulation-machine/build.mjs --audit   # geometry audit (clearances, support, depth order)
node scripts/lines.mjs formulation-machine/formulation-machine.html   # line-end check (needs Chrome)
```
