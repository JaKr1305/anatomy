// Everything the page says about the decision lives here, so it can be replaced with
// real numbers in one place. ALL VALUES ARE ILLUSTRATIVE PLACEHOLDERS, not data.

export const QUESTION = "How do we identify better formulation opportunities faster, and with stronger evidence?";
export const ACCOUNTABILITY = "AI supports decisions. Scientists remain accountable.";

// The story in four steps. `parts` are name prefixes of drawn items that belong to the step.
export const STEPS = [
  { key: "evidence", title: "Evidence", detail: "BFoM, gRIS, internal knowledge, manufacturing data and COGS are benchmarked and retrieved.", parts: ["in", "header", "feed.", "bench", "retr", "link.bench-retr"] },
  { key: "generate", title: "Alternative generation", detail: "The press turns retrieved evidence into many candidate formulations.", parts: ["gen", "header.riser", "link.retr-gen", "portal"] },
  { key: "evaluate", title: "Evaluation", detail: "Each candidate is simulated, costed and passed through seven constraint gates; failures are rejected.", parts: ["sim", "arch", "cost", "cg", "reject", "link.gen-sim", "link.sim-cost", "conv"] },
  { key: "decide", title: "Human decision", detail: "Three strategic options reach the gate. A scientist selects one and stays accountable for it.", parts: ["sort", "ped", "chute", "gate", "console"] },
];
// Parts that carry the evidence trail (shown in traceability mode).
export const TRACE_PARTS = ["in", "header", "feed.", "bus", "trace", "bench", "retr", "link.", "cg", "console", "gate"];

// Roadmap maturity of each capability, mapped to drawn parts.
export const ROADMAP = [
  { level: "existing", title: "Existing", items: ["BFoM", "gRIS", "COGS"], parts: ["in0", "in2", "in4", "header", "feed.", "bench"] },
  { level: "developing", title: "In development", items: ["Manufacturing integration", "Knowledge retrieval"], parts: ["in1", "in3", "retr", "link.bench-retr"] },
  { level: "future", title: "Future vision", items: ["Unified decision engine", "Formulation digital twin"], parts: ["sim", "arch", "cg", "reject", "link.gen-sim", "link.sim-cost"] },
];

// The seven constraint gates, in the order the tablets pass them. `rejected` is how
// many generated options each gate removed in the example run.
export const CONSTRAINTS = [
  { key: "reg", title: "Regulatory feasibility", rejected: 6 },
  { key: "sci", title: "Scientific feasibility", rejected: 9 },
  { key: "mfg", title: "Manufacturing fit", rejected: 7 },
  { key: "mat", title: "Material availability", rejected: 3 },
  { key: "cost", title: "Cost threshold", rejected: 5 },
  { key: "strat", title: "Strategic fit", rejected: 4 },
  { key: "data", title: "Data completeness", rejected: 4 },
];
export const GENERATED = 41; // options generated in the example run; 3 survive

export const SCENARIO = {
  title: "Example: high drug-load oral tablet",
  brief: "A new strength needs ≥ 70 % w/w API in a tablet that still compresses, disintegrates and costs less than today's product.",
  facts: [
    ["Target", "≥ 70 % w/w drug load, ≤ 900 mg tablet"],
    ["Evidence", "BFoM benchmarks, 3 gRIS projects, 2 internal platforms"],
    ["Generated", `${GENERATED} options`],
    ["Through gates", "3 options"],
  ],
};

// Three strategic candidates. Scores are 1..5 (higher is better; for risk, higher is riskier).
// bench and cost are the needle positions on the benchmark and COGS dials (0..1).
export const CANDIDATES = [
  {
    key: "A", name: "Cost leadership", short: "Cost leadership", readout: "A · cost leadership · selected", bench: 0.22, cost: 0.18,
    pitch: "Direct compression with standard excipients: the cheapest route to market.",
    scores: { cost: 5, differentiation: 2, manufacturability: 4, evidence: 4, risk: 2 },
    confidence: { source: "COGS model · BFoM · gRIS", refreshed: "illustrative", coverage: 0.86, level: "High", links: 14 },
  },
  {
    key: "B", name: "Competitive differentiation", short: "Differentiation", readout: "B · differentiation · selected", bench: 0.86, cost: 0.74,
    pitch: "Film-coated oval with a modified-release layer: clearly unlike the market benchmark.",
    scores: { cost: 2, differentiation: 5, manufacturability: 2, evidence: 3, risk: 4 },
    confidence: { source: "BFoM · internal knowledge", refreshed: "illustrative", coverage: 0.62, level: "Medium", links: 9 },
  },
  {
    key: "C", name: "Manufacturing excellence", short: "Mfg excellence", readout: "C · manufacturing excellence · selected", bench: 0.46, cost: 0.42,
    pitch: "Scored round tablet on an existing roller-compaction line: the most robust process.",
    scores: { cost: 3, differentiation: 3, manufacturability: 5, evidence: 4, risk: 1 },
    confidence: { source: "Manufacturing data · gRIS", refreshed: "illustrative", coverage: 0.78, level: "High", links: 12 },
  },
];
export const CRITERIA = [
  ["cost", "Cost advantage"],
  ["differentiation", "Differentiation"],
  ["manufacturability", "Manufacturability"],
  ["evidence", "Evidence strength"],
  ["risk", "Risk"],
];
