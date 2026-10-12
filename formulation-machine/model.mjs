// The three tablet concepts the machine produces. The dial positions are illustrative,
// qualitative scores in 0..1, not measured data: each candidate wins on its own axis.
//   bench: distance from the market benchmark (how differentiated it is)
//   cost:  where it sits on the COGS dial (lower is cheaper)
export const CANDIDATES = [
  { key: "A", name: "Lowest cost", bench: 0.22, cost: 0.18, readout: "A · lowest cost · selected" },
  { key: "B", name: "Competitive differentiation", bench: 0.86, cost: 0.74, readout: "B · differentiation · selected" },
  { key: "C", name: "Manufacturability", bench: 0.46, cost: 0.42, readout: "C · manufacturability · selected" },
];
