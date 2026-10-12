// Formulation decision machine: an isometric explainer for an executive deck.
// Five input modules feed a header; six stations (benchmark, retrieval, generation,
// simulation, cost, traceability) are joined by pipes, a conveyor and an evidence bus;
// a sorter sends three tablet concepts to three pedestals and a human decision gate
// picks one. Built with the Anatomy kit (kit/), light theme, blue and turquoise.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../kit/tube.mjs";
import * as A from "../kit/audit.mjs";
import { kitScript } from "../scripts/inline-kit.mjs";
import { CANDIDATES } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const W = 1200;
const H = 720;
const AZIMUTH = 57;

const DECK = { x: -330, y: -135, w: 682, d: 235, r: 16 };
const DECK_H = 12;
const FOOT_H = 5;
const BED = { x: -205, y: -130, w: 435, d: 190, r: 8 };
const BZ = 8;

const P = k.fitProjection(
  [...k.boxCorners(DECK, -DECK_H - FOOT_H, 0), [-200, -129, 142], [234, -129, 142], [345, -130, 104], [345, 72, 104]],
  W,
  H,
  { pad: 14, azimuth: AZIMUTH },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const Faded = (list, style) => k.fadedSvg(list, style);
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
const seg = (a, b) => k.segment(a, b, P);
const f2 = (v) => Math.round(v * 100) / 100;
const UP = [0, 0, 1];
const FZ = (o) => G.frameOf(o, UP, [1, 0, 0], [0, 1, 0]);
const FX = (o) => G.frameOf(o, [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const FY = (o) => G.frameOf(o, [0, 1, 0], [0, 0, 1], [1, 0, 0]);

// ---------------------------------------------------------------- recorder

const R = A.recorder(P);
const record = R.solid;
function put(name, ref, svg, shapes = [], { bias = 0, cls = "", attrs = "", ...rest } = {}) {
  return R.put({ name: R.nameFor(name), at: ref, bias, svg, shapes, cls, attrs, ...rest });
}

function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 1.2, steps = 3, bevel = 0.5, extra = "", inner = "", bias = 0, cls = "", attrs = "", owner } = {}) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
  const shape = record(A.slab(plan, z0, z1 - z0, { name, owner }, steps));
  put(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias, cls, attrs });
  return plan;
}
function cyl(name, cx, cy, r, z0, z1, style = {}, { steps = 0, bevel = 0, extra = "", inner = "", bias = 0, cls = "", attrs = "", owner } = {}) {
  const n = steps || Math.max(20, Math.min(96, Math.round(r * 4)));
  const shape = record(A.cylinder(cx, cy, r, z0, z1 - z0, { name, owner }));
  put(name, [cx, cy, (z0 + z1) / 2], S(k.cylinder(cx, cy, r, z0, z1 - z0, P, n, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias, cls, attrs });
  return shape;
}
// A boss on the side of a vertical cylinder: a saddle pad whose base follows the round
// wall and whose flat face carries a flange. Returns the face centre.
function boss(name, host, [cx, cy], R0, u, z, a, out = 1.6, { cls = "", tone = "mid" } = {}) {
  const F = G.frameOf([cx, cy, z], u, [0, 0, 1], G.unit3(G.cross3(u, [0, 0, 1])));
  const s1 = R0 + out;
  const shape = record(A.disc(F, 0, s1, a, { name, cut: host, seated: true }));
  put(name, G.add3(F.o, G.mul3(u, R0 + out / 2)), S(G.saddleOf(F, a, R0, s1, P), { tone }), [shape], { cls, bias: 0.02 });
  return G.add3(F.o, G.mul3(u, s1));
}
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, cls = "", attrs = "", rims, bevel = 0, owner } = {}) {
  const paths = G.solidOf(profile, F, P, { bevel, ...(rims ? { rims } : {}) });
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name, owner }));
  put(name, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias, cls, attrs });
}
const disc = (name, F, s0, s1, r, style, options) => turned(name, F, [[s0, r], [s1, r]], style, options);
function ball(name, c, r, style = {}, { bias = 0, extra = "", cls = "" } = {}) {
  const shape = record(A.ball(c, r, { name }));
  put(name, c, S(G.sphereOf(c, r, P, { steps: 40 }), { tone: "mid", ...style }) + extra, [shape], { bias, cls });
}
function quad(name, ring, z0, z1, style = {}, { extra = "", bias = 0, cls = "" } = {}) {
  const shape = record(A.extruded(ring, z0, z1 - z0, { name }));
  const c = ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]);
  put(name, [c[0], c[1], (z0 + z1) / 2], S(k.extrude(ring, z0, z1 - z0, P, { bevel: 0.4 }), { tone: "mid", ...style }) + extra, [shape], { bias, cls });
}

// Text on faces: the only words in the drawing are the short module labels.
const onFront = (x, y, z) => k.sideMatrix([x, y], z, P, "left"); // a face of constant y, text runs along +x
const onSide = (x, y, z) => k.sideMatrix([x, y], z, P, "right"); // a face of constant x, text runs along -y
const onTop = (x, y, z) => k.topMatrix([x, y], z, P, "x");
const onTopY = (x, y, z) => k.topMatrix([x, y], z, P, "y"); // text runs along -y
const label = (transform, text, size = 5) => k.faceTextSvg(transform, text, { size, tone: "hi", anchor: "middle" });

// A pipe between two flat mounts: flanges whose back faces sit on the mounts,
// the tube gapped under each flange, chunks depth-sorted on their own.
const PIPES = [];
function pipe(name, points, r, { cls = "fm-blue", tone = "mid", bend = 0, flanges = [true, true], maxLength = 18, bias = 0, touch } = {}) {
  const route = G.fillet(points, Math.max(bend || r * 2.8, 4), 9, { P, tube: r });
  const total = G.pathLength(route);
  const T = 1.8;
  const FR = r * 1.75;
  const gaps = [...(flanges[0] ? [[0, T]] : []), ...(flanges[1] ? [[total - T, total]] : [])];
  R.route(name, route, r, { gaps, touch, rims: flanges.map((on) => (on ? FR : r)), piece: "plant" });
  PIPES.push({ name, route: route.map((p) => p.map(f2)), r, total: f2(total) });
  tubePieces(route, r, P, { maxLength, spacing: 1.6, gaps }).forEach((piece, index) =>
    put(`${name}:${index}`, piece.mid, tubeSvg(piece, { tone }), [A.tube(piece.points, piece.radii)], { bias, cls, route: name, chunk: index }),
  );
  [0, 1].forEach((index) => {
    if (!flanges[index]) return;
    const end = index ? route[route.length - 1] : route[0];
    const tangent = G.tangentAlong(route, index ? total : 0);
    const F = G.frameAlong(end, tangent);
    const [s0, s1] = index ? [-T, 0] : [0, T];
    const face = index ? s0 : s1;
    const dots = G.dotsOf(F, face, FR * 0.72, 6, P, { all: true, fade: [0.04, 0.42] });
    const facing = Math.abs(G.dot3(F.a, V)) > 0.12;
    disc(`${name}.flange${index}`, F, s0, s1, FR, { tone: "mid" }, { owner: name, cls, bias: bias + 0.05, extra: facing ? Dots(dots, { size: 0.42, tone: "mid" }) : "" });
  });
  return route;
}

// A cable with a terminal dot at each end.
function cable(name, points, r = 0.7, { cls = "fm-teal", tone = "mid", bias = 0.05 } = {}) {
  const route = G.fillet(points, Math.max(3, r * 3), 9, { P, tube: r });
  R.route(name, route, r, { limp: true, piece: "plant" });
  tubePieces(route, r, P, { maxLength: 20, spacing: 0.8 }).forEach((piece, index) =>
    put(`${name}:${index}`, piece.mid, tubeSvg(piece, { tone }), [A.tube(piece.points, piece.radii)], { bias, cls, route: name, chunk: index }),
  );
  [route[0], route[route.length - 1]].forEach((end, index) =>
    put(`${name}.end${index}`, end, Dots([at(end)], { size: 1.1, tone: "hi" }), [A.ball(end, 1.1 / KS, { name: `${name}.end${index}`, owner: name })], { bias: bias + 0.2 }),
  );
  return route;
}

// Small hardware.
const screwsOnTop = (pts, z, size = 0.45) => Dots(pts.map(([x, y]) => at([x, y, z])), { size, tone: "mid" });
const ventsOnFront = (x0, x1, y, z0, z1, count) => {
  const out = [];
  const step = (x1 - x0) / count;
  for (let i = 0; i < count; i++) {
    const x = x0 + step * (i + 0.5);
    out.push(path3([[x - 0.5, y, z0], [x + 0.5, y, z0], [x + 0.5, y, z1], [x - 0.5, y, z1]], true));
  }
  return Ln(out.join(""), { tone: "lo" });
};
const ledRow = (points, { delay = 0, step = 160 } = {}) =>
  `<g class="fm-led">${points.map((p, i) => `<circle cx="${f2(at(p)[0])}" cy="${f2(at(p)[1])}" r="1.15" style="--pulse-at:${delay + i * step}ms"/>`).join("")}</g>`;

// Tablets: the three concepts the machine produces.
function roundTablet(cx, cy, z, r, { thick = 4.4 } = {}) {
  const t = thick;
  const profile = [[0, r * 0.62, 1], [t * 0.12, r * 0.86, 1], [t * 0.26, r * 0.97, 1], [t * 0.34, r], [t * 0.66, r], [t * 0.74, r * 0.97, 1], [t * 0.88, r * 0.86, 1], [t, r * 0.62, 1]];
  return { F: FZ([cx, cy, z]), profile, top: z + t };
}
function tabletSvg(kind, cx, cy, z, { scale = 1, lit = false } = {}) {
  if (kind === 1) {
    const plan = { x: cx - 11 * scale, y: cy - 5.6 * scale, w: 22 * scale, d: 11.2 * scale, r: 5.6 * scale };
    const h = 4.2 * scale;
    const top = z + h;
    const mark = Ln(path3([[cx - 5 * scale, cy, top], [cx + 5 * scale, cy, top]]), { tone: "mid", free: true });
    return { svg: S(k.slabOf(plan, z, h, P, 10, 1.1 * scale), { tone: "hi", crease: "lo", lit }) + mark, shape: A.slab(plan, z, h, {}, 10), top };
  }
  const r = 9 * scale;
  const T = roundTablet(cx, cy, z, r, { thick: 4.6 * scale });
  const paths = G.solidOf(T.profile, T.F, P, {});
  const score = kind === 2 ? Ln(path3([[cx - r * 0.6, cy, T.top], [cx + r * 0.6, cy, T.top]]), { tone: "mid", free: true }) : "";
  const ring = kind === 0 ? Ln(k.ring(cx, cy, r * 0.36, T.top, P, 24), { tone: "lo" }) : "";
  return { svg: S(paths, { tone: "hi", crease: "lo", lit }) + score + ring, shape: A.solid(T.F, T.profile), top: T.top };
}
const KIND_CLASS = ["fm-white", "fm-teal", "fm-blue"];

// ---------------------------------------------------------------- deck and bed (static, back layer)

const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(DECK, -DECK_H - FOOT_H, DECK_H, P)}"/>`);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const feet = [...k.corners(DECK, 24), [DECK.x + DECK.w / 2, DECK.y + 24], [DECK.x + DECK.w / 2, DECK.y + DECK.d - 24]];
for (const [x, y] of byDepth(feet)) {
  back.push(S(k.cylinder(x, y, 9, -DECK_H - FOOT_H, 1.8, P, 36), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 7, -DECK_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 36), { tone: "mid" }));
}
back.push(S(k.slabOf(DECK, -DECK_H, DECK_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(DECK, -5, P, 8), { tone: "faint" }) }));
back.push(Ln(k.planOutline(k.insetPlan(DECK, 5), 0, P), { tone: "lo" }));
const deckScrews = k.corners(DECK, 10);
back.push(Ln(deckScrews.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }), screwsOnTop(deckScrews, 0, 0.55));
record(A.slab(DECK, -DECK_H, DECK_H, { name: "stand.deck", ground: true }, 8));
// Front ruler strip along the deck edge.
{
  const strip = { x: -196, y: DECK.y + DECK.d - 11, w: 372, d: 6, r: 1 };
  back.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y, 0.6, [1.8, 3.4], P);
  back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  back.push(screwsOnTop([[strip.x + 2, strip.y + 4.4], [strip.x + strip.w - 2, strip.y + 4.4]], 0.6, 0.4));
}
// Machine bed.
back.push(`<path class="iso-halo" d="${k.haloOf(BED, 0, BZ, P)}" style="opacity:.18"/>`);
back.push(S(k.slabOf(BED, 0, BZ, P, 6, 1.2), { tone: "mid", inner: Ln(k.sideSeam(BED, 3, P, 6), { tone: "faint" }) }));
back.push(Ln(k.planOutline(k.insetPlan(BED, 4), BZ, P, 6), { tone: "faint" }));
const bedScrews = k.corners(BED, 9);
back.push(Ln(bedScrews.map(([x, y]) => k.ring(x, y, 2, BZ, P, 16)).join(""), { tone: "lo" }), screwsOnTop(bedScrews, BZ, 0.5));
record(A.slab(BED, 0, BZ, { name: "stand.bed", ground: true }, 6));

// ---------------------------------------------------------------- 1. input modules

const MODULE_Y = [-108, -64, -20, 24, 68];
const MOD = { x0: -322, x1: -250, half: 19, top: 9 };
const MODULE_NAMES = ["MARKET", "KNOWLEDGE", "gRIS", "PROCESS", "COGS"];
const HEADER = { x0: -240, x1: -224, y0: -132, y1: 88, z0: 4, z1: 34 };
const PORT_Z = 20;

MODULE_Y.forEach((yc, index) => {
  const id = `in${index}`;
  const plinth = box(`${id}.plinth`, [MOD.x0, yc - MOD.half, 0], [MOD.x1, yc + MOD.half, MOD.top], { tone: "mid" }, {
    r: 3,
    steps: 4,
    bevel: 0.8,
    extra:
      Ln(k.planOutline(k.insetPlan({ x: MOD.x0, y: yc - MOD.half, w: MOD.x1 - MOD.x0, d: MOD.half * 2, r: 3 }, 3), MOD.top, P, 4), { tone: "faint" }) +
      screwsOnTop(k.corners({ x: MOD.x0, y: yc - MOD.half, w: MOD.x1 - MOD.x0, d: MOD.half * 2 }, 5), MOD.top),
  });
  // Port block and its pipe to the header.
  box(`${id}.port`, [-264, yc - 7, MOD.top], [-256, yc + 7, 28], { tone: "mid" }, {
    r: 1.2,
    extra: screwsOnTop([[-260, yc - 4], [-260, yc + 4]], 28) + ledRow([[-256, yc - 3, 25], [-256, yc + 3, 25]].map((p) => [p[0] + 0.01, p[1], p[2]]), { delay: index * 220 }),
  });
  pipe(`${id}.feed`, [[-256, yc, PORT_Z], [HEADER.x0, yc, PORT_Z]], 2.6, { cls: index % 2 ? "fm-teal" : "fm-blue" });
});

// Module 0: global market formulations, a carousel of reference samples around a globe.
{
  const yc = MODULE_Y[0];
  const c = [-288, yc];
  cyl("in0.carousel", c[0], c[1], 17, MOD.top, MOD.top + 4, { tone: "mid" }, {
    bevel: 0.6,
    extra: (() => {
      const t = k.radialTicks(c[0], c[1], 16.2, 48, 6, MOD.top + 4, [1, 2], P);
      return Ln(t.minor, { tone: "lo" }) + Ln(t.major, { tone: "mid" });
    })(),
  });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const [x, y] = [c[0] + Math.cos(a) * 11.5, c[1] + Math.sin(a) * 11.5];
    cyl(`in0.vial${i}`, x, y, 2.4, MOD.top + 4, MOD.top + 13, { tone: "hi" }, { inner: Ln(k.sideArc(x, y, 2.4, MOD.top + 8, P, 12), { tone: "faint" }) });
    cyl(`in0.cap${i}`, x, y, 2.6, MOD.top + 13, MOD.top + 15, { tone: "mid" }, { cls: i % 2 ? "fm-teal" : "fm-blue" });
  }
  cyl("in0.stem", c[0], c[1], 1.6, MOD.top + 4, MOD.top + 44, { tone: "mid" }, { inner: Ln([20, 34].map((z) => k.sideArc(c[0], c[1], 1.6, MOD.top + z, P, 10)).join(""), { tone: "faint" }) });
  const g = [c[0], c[1], MOD.top + 56];
  const F = FZ(g);
  const lat = [-6, -2.5, 1, 4.5, 7.5].map((s) => {
    const r = Math.sqrt(10 * 10 - s * s);
    return G.arcOf(F, s, r, P, { slope: -s / r });
  });
  ball("in0.globe", g, 10, { tone: "hi" }, { cls: "fm-teal", extra: Ln(lat.join(""), { tone: "lo" }) });
  // Meridian stand: a half ring behind the globe from the stem collar to the top pivot.
  cyl("in0.collar", c[0], c[1], 3, MOD.top + 44, MOD.top + 46.5, { tone: "mid" });
}

// Module 1: internal development knowledge, a filing cabinet with binders on top.
{
  const yc = MODULE_Y[1];
  const x0 = -314;
  const x1 = -270;
  const y1 = yc + 14;
  box("in1.cabinet", [x0, yc - 14, MOD.top], [x1, y1, 50], { tone: "mid" }, { r: 1.6, bevel: 0.8, inner: Ln(k.sideSeam({ x: x0, y: yc - 14, w: x1 - x0, d: 28, r: 1.6 }, 48, P, 3), { tone: "faint" }) });
  [[11, 23], [24.5, 36], [37.5, 48.5]].forEach(([z0, z1], i) => {
    const out = i === 1 ? 7 : 0;
    const xs = [x0 + 3, x1 - 3];
    box(`in1.drawer${i}`, [xs[0], y1, MOD.top + z0 - 9], [xs[1], y1 + 1.4 + out, MOD.top + z1 - 9], { tone: "hi" }, {
      r: 0.4,
      steps: 2,
      bevel: 0.3,
      extra:
        Ln(path3([[-298, y1 + 1.4 + out, MOD.top + z1 - 12], [-286, y1 + 1.4 + out, MOD.top + z1 - 12], [-286, y1 + 1.4 + out, MOD.top + z1 - 15.5], [-298, y1 + 1.4 + out, MOD.top + z1 - 15.5]], true), { tone: "lo" }) +
        Ln(path3([[-296, y1 + 1.4 + out, MOD.top + z1 - 13.6], [-288, y1 + 1.4 + out, MOD.top + z1 - 13.6]]), { tone: "faint", free: true }),
    });
    box(`in1.pull${i}`, [-296, y1 + 1.4 + out, MOD.top + z0 - 7.5], [-288, y1 + 3 + out, MOD.top + z0 - 5.8], { tone: "mid" }, { r: 0.5, steps: 2, bevel: 0 });
  });
  // Binders on top.
  [["fm-blue", -310, -296, 0], ["fm-teal", -294, -284, 0], ["fm-white", -282, -274, 0]].forEach(([cls, a, b], i) => {
    box(`in1.binder${i}`, [a, yc - 9, 50], [b, yc + 9, 50 + 4 - i * 0.8], { tone: "hi" }, { r: 0.8, steps: 2, bevel: 0.4, cls, extra: Ln(k.sideSeam({ x: a, y: yc - 9, w: b - a, d: 18, r: 0.8 }, 52 - i * 0.4, P, 2), { tone: "faint" }) });
  });
}

// Module 2: gRIS project data, a server rack with blade units and status lights.
{
  const yc = MODULE_Y[2];
  const x0 = -314;
  const x1 = -272;
  const y1 = yc + 14;
  box("in2.rack", [x0, yc - 14, MOD.top], [x1, y1, 48], { tone: "mid" }, {
    r: 1.4,
    bevel: 0.8,
    extra: Dots(k.dotGrid(x0 + 6, yc - 9, 9, 5, 3.6, 48, P), { size: 0.35, tone: "lo" }),
  });
  for (let i = 0; i < 4; i++) {
    const z0 = MOD.top + 2.5 + i * 8.9;
    box(`in2.blade${i}`, [x0 + 2.5, y1, z0], [x1 - 2.5, y1 + 1.2, z0 + 7.4], { tone: "hi" }, {
      r: 0.3,
      steps: 2,
      bevel: 0.25,
      extra: ventsOnFront(x0 + 16, x1 - 5, y1 + 1.2, z0 + 1.8, z0 + 5.6, 8) + ledRow([[x0 + 6, y1 + 1.25, z0 + 3.7], [x0 + 9.5, y1 + 1.25, z0 + 3.7]], { delay: i * 200 }),
    });
  }
}

// Module 3: manufacturing process and equipment data, a process vessel with a gauge box.
{
  const yc = MODULE_Y[3];
  const c = [-298, yc];
  const F = FZ([c[0], c[1], MOD.top]);
  turned("in3.skirt", F, [[0, 9.5], [5, 9.5]], { tone: "mid" });
  turned(
    "in3.vessel",
    F,
    [[5, 4.5, 1], [6.5, 7.5, 1], [8.5, 10.5, 1], [10.5, 12.8, 1], [12, 13.6], [22, 13.6], [23.5, 12.8, 1], [25.5, 10.5, 1], [27, 7.5, 1], [28.2, 4.5]],
    { tone: "hi" },
    { inner: Ln(G.arcOf(F, 17, 13.6, P), { tone: "faint" }) },
  );
  turned("in3.nozzle", F, [[28.2, 3.2], [31, 3.2], [31, 4.4], [32.6, 4.4]], { tone: "mid" });
  // Sight glass on the vessel front.
  const face = [-273, yc + 10, 23];
  box("in3.box", [-280, yc - 10, MOD.top], [-266, yc + 10, 30], { tone: "mid" }, {
    r: 1.2,
    extra:
    `<g transform="${onFront(face[0], face[1] + 0.05, face[2])}">` +
      `<circle cx="0" cy="0" r="5" class="fm-gauge-face"/>` +
      `<circle cx="0" cy="0" r="5" class="iso-line" data-tone="mid"/>` +
      `<path class="iso-line" data-tone="hi" data-free="end" d="M0 0L3 -2.6"/>` +
      `<circle cx="0" cy="0" r="0.7" class="fm-hub"/></g>` +
      ledRow([[-276, yc + 10.05, 14], [-273, yc + 10.05, 14], [-270, yc + 10.05, 14]], { delay: 300 }),
  });
}

// Module 4: COGS and economic data, coin stacks beside a printing calculator.
{
  const yc = MODULE_Y[4];
  box("in4.calc", [-316, yc - 13, MOD.top], [-290, yc + 13, 20], { tone: "mid" }, {
    r: 1.6,
    extra: (() => {
      const keys = [];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const x = -313 + i * 5.2;
        const y = yc - 3 + j * 3.8;
        keys.push(path3([[x, y, 20], [x + 4, y, 20], [x + 4, y + 2.8, 20], [x, y + 2.8, 20]], true));
      }
      return Ln(keys.join(""), { tone: "lo" });
    })(),
  });
  disc("in4.roll", FY([-303, yc - 12, 24.15]), 0, 20, 4.2, { tone: "hi" });
  [[-280, yc - 9, 9], [-272, yc - 2, 14], [-281, yc + 6, 18], [-271, yc + 11, 6]].forEach(([x, y, h], i) => {
    const seams = [];
    for (let z = MOD.top + 1.6; z < MOD.top + h - 0.5; z += 1.6) seams.push(k.sideArc(x, y, 5, z, P, 20));
    cyl(`in4.coins${i}`, x, y, 5, MOD.top, MOD.top + h, { tone: "hi" }, { cls: i % 2 ? "fm-teal" : "fm-blue", inner: Ln(seams.join(""), { tone: "lo" }), bevel: 0.5 });
  });
}

// Header: the collector all five modules feed.
box("header", [HEADER.x0, HEADER.y0, HEADER.z0], [HEADER.x1, HEADER.y1, HEADER.z1], { tone: "mid" }, {
  r: 2,
  bevel: 0.8,
  inner: Ln([k.sideSeam({ x: HEADER.x0, y: HEADER.y0, w: HEADER.x1 - HEADER.x0, d: HEADER.y1 - HEADER.y0, r: 2 }, 10, P, 3), k.sideSeam({ x: HEADER.x0, y: HEADER.y0, w: HEADER.x1 - HEADER.x0, d: HEADER.y1 - HEADER.y0, r: 2 }, 28, P, 3)].join(""), { tone: "faint" }),
  extra: screwsOnTop([84].map((y) => [-232, y]), HEADER.z1) + MODULE_Y.map((y, i) => label(onTopY(-230.2, y, HEADER.z1), MODULE_NAMES[i], 6)).join("") + Ln(MODULE_Y.slice(1).map((y) => path3([[HEADER.x0, y - 22, HEADER.z1], [HEADER.x1, y - 22, HEADER.z1]])).join(""), { tone: "faint" }),
});
[-120, -20, 80].forEach((y, i) => box(`header.foot${i}`, [-242, y - 5, 0], [-222, y + 5, 4], { tone: "lo" }, { r: 1 }));

// ---------------------------------------------------------------- 2. stations on the bed

const ST = { y0: -62, y1: -10 };
const STATION_NAMES = ["BENCHMARK", "RETRIEVAL", "GENERATION", "SIMULATION", "COST", "TRACE"];
const STATION_X = [-156, -94, -22, 58, 129, 195];

// Benchmark: a turntable of reference tablets under a dial gauge.
const BENCH = { c: [-156, -36], top: 22 };
{
  box("bench.plinth", [-182, ST.y0, BZ], [-130, ST.y1, BENCH.top], { tone: "mid" }, {
    r: 3,
    bevel: 0.8,
    inner: Ln(k.sideSeam({ x: -182, y: ST.y0, w: 52, d: 52, r: 3 }, 12, P, 3), { tone: "faint" }),
    extra: screwsOnTop(k.corners({ x: -182, y: ST.y0, w: 52, d: 52 }, 4), BENCH.top),
  });
  const [cx, cy] = BENCH.c;
  cyl("bench.table", cx, cy, 21, BENCH.top, BENCH.top + 4, { tone: "hi" }, {
    bevel: 0.7,
    extra: (() => {
      const t = k.radialTicks(cx, cy, 20.2, 72, 6, BENCH.top + 4, [1.2, 2.4], P);
      return Ln(t.minor, { tone: "lo" }) + Ln(t.major, { tone: "mid" });
    })(),
  });
  cyl("bench.hub", cx, cy, 4, BENCH.top + 4, BENCH.top + 7, { tone: "mid" }, { bevel: 0.4 });
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 3 + (i / 6) * Math.PI * 2;
    const x = cx + Math.cos(a) * 13;
    const y = cy + Math.sin(a) * 13;
    const kind = i % 3;
    const T = tabletSvg(kind, x, y, BENCH.top + 4, { scale: 0.42 });
    put(`bench.ref${i}`, [x, y, BENCH.top + 5], T.svg, [record({ ...T.shape, name: `bench.ref${i}` })], { cls: KIND_CLASS[kind] });
  }
  // Dial gauge on a post over the reference at -60°.
  const tip = [cx + Math.cos(-Math.PI / 3) * 13, cy + Math.sin(-Math.PI / 3) * 13];
  BENCH.dial = tip;
  const post = [-135, -57];
  cyl("bench.post", post[0], post[1], 2.4, BENCH.top, 52, { tone: "mid" }, { inner: Ln([34, 44].map((z) => k.sideArc(post[0], post[1], 2.4, z, P, 12)).join(""), { tone: "faint" }) });
  cyl("bench.clamp", post[0], post[1], 4.5, 52, 59, { tone: "mid" }, { bevel: 0.4, extra: Ln(k.knurl(post[0], post[1], 4.5, 53, 58, 24, P, 0.3), { tone: "lo" }) });
  cyl("bench.cap", post[0], post[1], 2.4, 59, 62, { tone: "mid" });
  const dir = G.unit3([tip[0] - post[0], tip[1] - post[1], 0]);
  const side = [-dir[1], dir[0]];
  const L0 = 4.6;
  const L1 = Math.hypot(tip[0] - post[0], tip[1] - post[1]) - 7.5;
  const arm = [
    [post[0] + dir[0] * L0 + side[0] * 2, post[1] + dir[1] * L0 + side[1] * 2],
    [post[0] + dir[0] * L1 + side[0] * 2, post[1] + dir[1] * L1 + side[1] * 2],
    [post[0] + dir[0] * L1 - side[0] * 2, post[1] + dir[1] * L1 - side[1] * 2],
    [post[0] + dir[0] * L0 - side[0] * 2, post[1] + dir[1] * L0 - side[1] * 2],
  ];
  quad("bench.arm", arm, 54, 57, { tone: "mid" }, { bias: 0.3 });
  BENCH.dialZ = 50;
  cyl("bench.stem", tip[0], tip[1], 1.2, BENCH.top + 4 + 1.9, BENCH.dialZ, { tone: "hi" });
  cyl("bench.dial", tip[0], tip[1], 8, BENCH.dialZ, BENCH.dialZ + 6, { tone: "hi" }, {
    bevel: 0.5,
    extra: (() => {
      const top = BENCH.dialZ + 6;
      const t = k.radialTicks(tip[0], tip[1], 6.6, 40, 5, top, [0.9, 1.8], P);
      return Ln(k.knurl(tip[0], tip[1], 8, top - 2, top, 40, P, 0.3), { tone: "lo" }) + Ln(k.ring(tip[0], tip[1], 7, top, P, 40), { tone: "lo" }) + Ln(t.minor, { tone: "lo" }) + Ln(t.major, { tone: "mid" });
    })(),
  });
}

// Retrieval: an index cabinet of drawers with cards on top, and a picker on a gantry.
const RETR = { x0: -116, x1: -72, top: 40 };
{
  const { x0, x1, top } = RETR;
  box("retr.cabinet", [x0, ST.y0, BZ], [x1, ST.y1 - 4, top], { tone: "mid" }, { r: 2, bevel: 0.8 });
  const fy = ST.y1 - 4;
  for (let col = 0; col < 3; col++) for (let row = 0; row < 3; row++) {
    const a = x0 + 2.5 + col * 13.3;
    const b = a + 12;
    const z0 = BZ + 2.5 + row * 9.8;
    const out = col === 1 && row === 1 ? 9 : 0;
    box(`retr.drawer${col}${row}`, [a, fy, z0], [b, fy + 1.2 + out, z0 + 8.6], { tone: out ? "hi" : "mid" }, {
      r: 0.3,
      steps: 2,
      bevel: 0.25,
      cls: out ? "fm-teal" : "",
      extra:
        Ln(path3([[a + 3, fy + 1.2 + out, z0 + 6.6], [b - 3, fy + 1.2 + out, z0 + 6.6], [b - 3, fy + 1.2 + out, z0 + 4.4], [a + 3, fy + 1.2 + out, z0 + 4.4]], true), { tone: "lo" }) +
        Dots([at([(a + b) / 2, fy + 1.25 + out, z0 + 2.2])], { size: 0.7, tone: "hi" }),
    });
  }
  // Cards standing in the open tray on top.
  box("retr.tray", [x0 + 3, ST.y0 + 4, top], [x1 - 3, fy - 4, top + 1.2], { tone: "lo" }, { r: 1, bevel: 0 });
  for (let i = 0; i < 9; i++) {
    const x = x0 + 7 + i * 3.6;
    const lift = 0;
    box(`retr.card${i}`, [x, ST.y0 + 8, top + 1.2 + lift], [x + 0.9, fy - 8, top + 9 + lift], { tone: i === 4 ? "hi" : "mid" }, { r: 0.2, steps: 1, bevel: 0, cls: i === 4 ? "fm-teal" : "" });
  }
}
// Picker gantry behind the cabinet.
const PICK = { y: -70, z: 76, rest: -94 };
{
  [-120, -68].forEach((x, i) => {
    box(`retr.leg${i}`, [x - 2.5, PICK.y - 2.5, BZ + 2], [x + 2.5, PICK.y + 2.5, PICK.z], { tone: "mid" }, { r: 0.8 });
    box(`retr.foot${i}`, [x - 4.5, PICK.y - 4.5, BZ], [x + 4.5, PICK.y + 4.5, BZ + 2], { tone: "lo" }, { r: 1 });
  });
  box("retr.beam", [-123, PICK.y - 3, PICK.z], [-65, PICK.y + 3, PICK.z + 5], { tone: "mid" }, {
    r: 1,
    bevel: 0.5,
    extra: (() => {
      const t = k.sideTicks(-118, -70, 2, 5, PICK.y + 3, PICK.z + 5, [1, 2], P, "x");
      return Ln(t.minor, { tone: "lo" }) + Ln(t.major, { tone: "mid" });
    })(),
  });
}

// Generation: a rotary tablet press.
const PRESS = { c: [-22, -36], deck: 42 };
{
  const [cx, cy] = PRESS.c;
  box("gen.cabinet", [-50, ST.y0, BZ], [6, ST.y1, PRESS.deck], { tone: "mid" }, {
    r: 3,
    bevel: 0.8,
    inner: Ln(k.sideSeam({ x: -50, y: ST.y0, w: 56, d: 52, r: 3 }, 36, P, 3), { tone: "faint" }),
    extra:
      Ln(path3([[-46, ST.y1, BZ + 4], [-20, ST.y1, BZ + 4], [-20, ST.y1, BZ + 26], [-46, ST.y1, BZ + 26]], true), { tone: "lo" }) +
      ventsOnFront(-15, 2, ST.y1, BZ + 6, BZ + 14, 7) +
      ledRow([[-12, ST.y1, BZ + 22], [-8, ST.y1, BZ + 22], [-4, ST.y1, BZ + 22], [0, ST.y1, BZ + 22]], { delay: 600 }),
  });
  box("gen.handle", [-24.5, ST.y1, BZ + 12], [-23, ST.y1 + 2, BZ + 20], { tone: "mid" }, { r: 0.5, steps: 2, bevel: 0 });
  box("gen.deck", [-48, ST.y0 + 2, PRESS.deck], [4, ST.y1 - 2, PRESS.deck + 2], { tone: "lo" }, { r: 2.6 });
  const Z = PRESS.deck + 2;
  cyl("gen.dietable", cx, cy, 21, Z, Z + 5, { tone: "hi" }, {
    bevel: 0.6,
    extra: (() => {
      const holes = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        holes.push(k.ring(cx + Math.cos(a) * 16.5, cy + Math.sin(a) * 16.5, 1.4, Z + 5, P, 12));
      }
      return Ln(holes.join(""), { tone: "lo" }) + Ln(k.sideArc(cx, cy, 21, Z + 2.5, P, 48), { tone: "faint" });
    })(),
  });
  cyl("gen.column", cx, cy, 5, Z + 5, Z + 18, { tone: "mid" });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    const x = cx + Math.cos(a) * 13;
    const y = cy + Math.sin(a) * 13;
    cyl(`gen.punch${i}`, x, y, 1.3, Z + 5, Z + 18, { tone: "hi" });
    cyl(`gen.head${i}`, x, y, 2, Z + 23, Z + 27, { tone: "mid" }, { bevel: 0.3 });
  }
  cyl("gen.turret", cx, cy, 17, Z + 18, Z + 23, { tone: "hi" }, { bevel: 0.6, cls: "fm-blue", inner: Ln(k.sideArc(cx, cy, 17, Z + 20.5, P, 48), { tone: "faint" }) });
  // Pressure roll on a yoke over the punch heads.
  box("gen.yoke", [cx - 3, cy - 24, Z], [cx + 3, cy - 21.2, Z + 34], { tone: "mid" }, { r: 0.8 });
  box("gen.bridge", [cx - 3, cy - 24, Z + 34], [cx + 17, cy - 15, Z + 37], { tone: "mid" }, { r: 0.8, extra: screwsOnTop([[cx, cy - 19.5], [cx + 14, cy - 19.5]], Z + 37) });
  disc("gen.roll", FY([cx + 13, cy - 21, Z + 30.6]), 0, 6, 3.4, { tone: "mid" });
  // Hopper and feed frame.
  const hop = [-38, -50];
  box("gen.feedframe", [hop[0] - 5, hop[1] - 5, Z + 5], [hop[0] + 5, hop[1] + 5, Z + 8], { tone: "mid" }, { r: 1 });
  const HF = FZ([hop[0], hop[1], Z + 8]);
  turned("gen.neck", HF, [[0, 2.8], [20, 2.8]], { tone: "mid" });
  turned("gen.hopper", HF, [[20, 3.6], [30, 12.5], [36, 12.5]], { tone: "hi" }, { inner: Ln(G.arcOf(HF, 32.5, 12.5, P), { tone: "faint" }) });
  turned("gen.lid", HF, [[36, 13.6], [37.8, 13.6]], { tone: "mid" }, { extra: Dots(G.dotsOf(HF, 37.8, 12.4, 12, P, { all: true }), { size: 0.4 }) });
  PRESS.hopper = [hop[0], hop[1], Z + 8 + 37.8];
  // Discharge chute from the die table down to the belt.
  const from = [cx + 2, cy + 19.9, Z + 6];
  const to = [cx + 2, 16, 25.15];
  const dir = G.unit3(G.sub3(to, from));
  const CF = G.frameOf(from, dir, [1, 0, 0], G.unit3(G.cross3(dir, [1, 0, 0])));
  const len = G.len3(G.sub3(to, from));
  const poly = [[-4.5, -0.6], [4.5, -0.6], [4.5, 0.6], [-4.5, 0.6]];
  const shape = record(A.prism(CF, poly, 0, len, { name: "gen.chute" }));
  put("gen.chute", G.add3(from, G.mul3(dir, len / 2)), S(G.prismOf(CF, poly, 0, len, P), { tone: "mid" }), [shape], { cls: "fm-teal" });
}

// Simulation: a perforated pilot drum on trunnions, with a motor and a sensor arch over the belt.
const SIM = { c: [58, -36], z: 42, x0: 36, x1: 80, r: 16 };
{
  box("sim.base", [28, ST.y0, BZ], [104, ST.y1, BZ + 12], { tone: "mid" }, { r: 3, bevel: 0.6, inner: Ln(k.sideSeam({ x: 28, y: ST.y0, w: 76, d: 52, r: 3 }, BZ + 6, P, 3), { tone: "faint" }), extra: screwsOnTop(k.corners({ x: 28, y: ST.y0, w: 76, d: 52 }, 4), BZ + 12) });
  const ringR = SIM.r + 2;
  const standTop = SIM.z - ringR;
  [[36.5, 41.5], [74.5, 79.5]].forEach(([a, b], i) => {
    box(`sim.stand${i}`, [a, SIM.c[1] - 8, BZ + 12], [b, SIM.c[1] + 8, standTop], { tone: "mid" }, { r: 0.8 });
  });
  const F = FX([SIM.x0, SIM.c[1], SIM.z]);
  const L = SIM.x1 - SIM.x0;
  turned("sim.end0", F, [[0, SIM.r - 2], [1.5, SIM.r], [2, SIM.r]], { tone: "hi" });
  turned("sim.end1", F, [[L - 2, SIM.r], [L - 1.5, SIM.r], [L, SIM.r - 2]], { tone: "hi" });
  turned("sim.drum", F, [[5, SIM.r], [L - 5, SIM.r]], { tone: "hi" }, {
    extra: [8, 14, 20, 26, 32, 38].map((s, i) => Dots(G.dotsOf(F, s, SIM.r, 22, P, { phase: i % 2 ? 0.14 : 0, fade: [0.04, 0.42] }), { size: 0.5, tone: "mid" })).join(""),
  });
  turned("sim.ring0", F, [[2, ringR], [5, ringR]], { tone: "mid" }, { cls: "fm-blue" });
  turned("sim.ring1", F, [[L - 5, ringR], [L - 2, ringR]], { tone: "mid" }, { cls: "fm-blue" });
  turned("sim.shaft", F, [[L, 3.2], [L + 6, 3.2]], { tone: "mid" });
  box("sim.motor", [86, SIM.c[1] - 10, BZ + 12], [102, SIM.c[1] + 10, SIM.z + 8], { tone: "mid" }, {
    r: 1.6,
    bevel: 0.6,
    extra: ventsOnFront(89, 99, SIM.c[1] + 10, BZ + 16, BZ + 30, 6) + ledRow([[94, SIM.c[1] + 10.05, SIM.z + 3]], { delay: 900 }),
  });
}
const ARCH = { x: 58, y0: 0, y1: 36, z: 50 };
{
  [ARCH.y0, ARCH.y1].forEach((y, i) => box(`arch.post${i}`, [ARCH.x - 2.5, y - 2.5, BZ], [ARCH.x + 2.5, y + 2.5, ARCH.z], { tone: "mid" }, { r: 0.8 }));
  box("arch.beam", [ARCH.x - 3.5, ARCH.y0 - 3.5, ARCH.z], [ARCH.x + 3.5, ARCH.y1 + 3.5, ARCH.z + 5], { tone: "mid" }, { r: 1, cls: "fm-blue" });
  const F = FZ([ARCH.x, 19, ARCH.z - 8]);
  turned("arch.sensor", F, [[0, 3.2], [2, 4.2], [8, 4.2]], { tone: "hi" }, { extra: ledRow([[ARCH.x, 19 + 4.25, ARCH.z - 4]], { delay: 1200 }) });
}

// Cost: a platform scale with a dial on its front, coin weights beside it.
const COST = { x0: 108, x1: 150, top: 40, dial: [129, ST.y1 - 4, 25] };
{
  const fy = ST.y1 - 4;
  box("cost.body", [COST.x0, ST.y0 + 2, BZ], [COST.x1, fy, COST.top], { tone: "mid" }, {
    r: 3,
    bevel: 0.8,
    extra: (() => {
      const [dx, , dz] = COST.dial;
      const ticks = [];
      for (let i = 0; i <= 20; i++) {
        const a = (-130 + (i / 20) * 260) * (Math.PI / 180);
        const r0 = i % 5 ? 9.8 : 8.6;
        ticks.push(`M${f2(Math.sin(a) * r0)} ${f2(-Math.cos(a) * r0)}L${f2(Math.sin(a) * 11)} ${f2(-Math.cos(a) * 11)}`);
      }
      return (
        `<g transform="${onFront(dx, fy + 0.05, dz)}"><circle class="fm-gauge-face" r="12.4"/><circle class="iso-line" data-tone="mid" r="12.4"/><circle class="iso-line" data-tone="faint" r="11"/>` +
        `<path class="iso-line" data-tone="lo" d="${ticks.join("")}"/></g>`
      );
    })(),
  });
  cyl("cost.post", 129, -34, 3, COST.top, COST.top + 3, { tone: "mid" });
  box("cost.platform", [113, -50, COST.top + 3], [145, -18, COST.top + 5.5], { tone: "hi" }, { r: 3, bevel: 0.6, extra: Ln(k.planOutline({ x: 116, y: -47, w: 26, d: 26, r: 2 }, COST.top + 5.5, P, 3), { tone: "faint" }) });
  [[156, -50, 12], [156, -36, 18], [164, -43, 8]].forEach(([x, y, h], i) => {
    const seams = [];
    for (let z = BZ + 1.6; z < BZ + h - 0.5; z += 1.6) seams.push(k.sideArc(x, y, 4.6, z, P, 20));
    cyl(`cost.coins${i}`, x, y, 4.6, BZ, BZ + h, { tone: "hi" }, { cls: "fm-teal", inner: Ln(seams.join(""), { tone: "lo" }), bevel: 0.5 });
  });
}

// Traceability: an evidence recorder with two reels and a ledger printout, fed by a bus over the line.
const TRACE = { x0: 170, x1: 222, y0: -114, y1: -72, top: 94 };
{
  const { x0, x1, y0, y1, top } = TRACE;
  box("trace.cabinet", [x0, y0, BZ], [x1, y1, top], { tone: "mid" }, {
    r: 2.4,
    bevel: 0.8,
    inner: Ln(k.sideSeam({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 2.4 }, top - 6, P, 3), { tone: "faint" }),
    extra:
      Ln(path3([[x0 + 4, y1, 20], [x1 - 4, y1, 20], [x1 - 4, y1, 23], [x0 + 4, y1, 23]], true), { tone: "lo" }) +
      ledRow([[x0 + 6, y1, 30], [x0 + 10, y1, 30], [x0 + 14, y1, 30], [x0 + 18, y1, 30], [x0 + 22, y1, 30]], { delay: 0, step: 260 }) +
      label(onFront((x0 + x1) / 2, y1 + 0.05, 40), "TRACE", 7),
  });
  [[182, 74], [210, 74]].forEach(([x, z], i) => {
    const F = FY([x, y1, z]);
    disc(`trace.reel${i}`, F, 0, 3, 10, { tone: "hi" }, {
      cls: i ? "fm-teal" : "fm-blue",
      extra: Ln([G.circleOf(F, 3, 3, P), G.circleOf(F, 3, 7.6, P)].join(""), { tone: "lo" }) + Dots([0, 1, 2].map((j) => at(G.pointOf(F, 3, 5.3, (j / 3) * Math.PI * 2 + 0.3))), { size: 0.9, tone: "mid" }),
    });
  });
  box("trace.head", [192, y1, 56], [200, y1 + 3, 61], { tone: "mid" }, {
    r: 0.6,
    steps: 2,
    bevel: 0.2,
    extra: Ln(path3([[187.6, y1 + 3, 65.7], [193, y1 + 3, 61]]) + path3([[204.4, y1 + 3, 65.7], [199, y1 + 3, 61]]), { tone: "hi" }),
  });
  // Ledger printout lying on the bed in front of the recorder.
  const paper = { x: 176, y: y1 + 1, w: 40, d: 30, r: 0.6 };
  const rules = [];
  for (let y = paper.y + 4; y < paper.y + paper.d - 2; y += 3.2) rules.push(path3([[paper.x + 3, y, BZ + 0.6], [paper.x + paper.w - 3 - ((y * 7) % 11), y, BZ + 0.6]]));
  box("trace.paper", [paper.x, paper.y, BZ], [paper.x + paper.w, paper.y + paper.d, BZ + 0.6], { tone: "lo" }, { r: 0.6, steps: 2, bevel: 0, extra: Ln(rules.join(""), { tone: "lo", free: true }) });
}
// Evidence bus: a cable tray behind the stations, one drop to each station's junction box.
const BUS = { y0: -106, y1: -98, z: 68, x0: -184, x1: TRACE.x0 };
{
  box("bus.tray", [BUS.x0, BUS.y0, BUS.z], [BUS.x1, BUS.y1, BUS.z + 3.5], { tone: "mid" }, { r: 0.8, cls: "fm-teal", extra: Ln(path3([[BUS.x0, BUS.y1, BUS.z + 1.75], [BUS.x1, BUS.y1, BUS.z + 1.75]]), { tone: "lo" }) });
  [-178, -40, 100].forEach((x, i) => cyl(`bus.post${i}`, x, (BUS.y0 + BUS.y1) / 2, 1.8, BZ, BUS.z, { tone: "mid" }));
  STATION_X.slice(0, 5).forEach((x, i) => {
    const jx = x + (i === 1 ? 14 : 0);
    box(`bus.box${i}`, [jx - 5, BUS.y0, BZ], [jx + 5, BUS.y1, BZ + 10], { tone: "mid" }, { r: 1, extra: ledRow([[jx, BUS.y1 + 0.05, BZ + 6]], { delay: i * 300 }) });
    cable(`bus.drop${i}`, [[jx, (BUS.y0 + BUS.y1) / 2, BUS.z], [jx, (BUS.y0 + BUS.y1) / 2, BZ + 10]], 0.75);
  });
}

// ---------------------------------------------------------------- 3. pipes between modules and stations

pipe("feed.bench", [[HEADER.x1, -36, 15], [-182, -36, 15]], 3, { cls: "fm-blue" });
pipe("link.bench-retr", [[-130, -24, 15], [RETR.x0, -24, 15]], 2.2, { cls: "fm-blue" });
pipe("link.retr-gen", [[RETR.x1, -40, 26], [-50, -40, 26]], 2.4, { cls: "fm-blue" });
pipe("link.gen-sim", [[6, -48, 14.5], [28, -48, 14.5]], 2.2, { cls: "fm-teal" });
pipe("link.sim-cost", [[104, -48, 14.5], [COST.x0, -48, 14.5]], 2.2, { cls: "fm-teal" });
// The knowledge header: up the back, under the portal beam, and down into the press hopper.
const PORTAL = { y0: -129, y1: -121, z: 126, x0: -196, x1: 230 };
pipe(
  "header.riser",
  [[-232, -125, HEADER.z1], [-232, -125, PORTAL.z + 7 + 3.2], [-38, -125, PORTAL.z + 7 + 3.2], [-38, -50, PORTAL.z + 7 + 3.2], [PRESS.hopper[0], PRESS.hopper[1], PRESS.hopper[2]]],
  3.2,
  { cls: "fm-blue", bend: 10, maxLength: 14, touch: ["portal.beam"] },
);

// Back portal: two posts and a beam, with hangers holding the header pipe.
{
  [PORTAL.x0, PORTAL.x1 - 8].forEach((x, i) => {
    box(`portal.post${i}`, [x, PORTAL.y0, BZ], [x + 8, PORTAL.y1, PORTAL.z], { tone: "mid" }, {
      r: 1.2,
      bevel: 0.6,
      inner: Ln([40, 90].map((z) => k.sideSeam({ x, y: PORTAL.y0, w: 8, d: 8, r: 1.2 }, z, P, 3)).join(""), { tone: "faint" }),
    });
  });
  box("portal.beam", [PORTAL.x0 - 2, PORTAL.y0, PORTAL.z], [PORTAL.x1 + 2, PORTAL.y1, PORTAL.z + 7], { tone: "mid" }, {
    r: 1.2,
    bevel: 0.7,
    cls: "fm-blue",
    extra: ledRow(Array.from({ length: 22 }, (_, i) => [PORTAL.x0 + 16 + i * 19.5, PORTAL.y1 + 0.05, PORTAL.z + 3.5]), { delay: 0, step: 90 }),
  });
}

// ---------------------------------------------------------------- 4. conveyor

const CONV = { x0: -48, x1: 240, y0: 8, y1: 30, z: 24.5 };
{
  const { x0, x1, y0, y1 } = CONV;
  [[x0 + 6, true], [70, true], [150, true], [x1 - 6, false]].forEach(([x, onBed], i) => {
    const z0 = onBed ? BZ : 0;
    box(`conv.leg${i}a`, [x - 2, y0 + 1, z0], [x + 2, y0 + 4, 18], { tone: "mid" }, { r: 0.6, steps: 2 });
    box(`conv.leg${i}b`, [x - 2, y1 - 4, z0], [x + 2, y1 - 1, 18], { tone: "mid" }, { r: 0.6, steps: 2 });
  });
  box("conv.rail0", [x0, y0, 18], [x1, y0 + 3, 27], { tone: "mid" }, { r: 0.8, bevel: 0.4 });
  box("conv.belt", [x0 + 4.4, y0 + 3, 21], [x1 - 4.4, y1 - 3, CONV.z], { tone: "mid" }, {
    r: 3,
    cls: "fm-navy",
    extra: `<path class="iso-line fm-belt-flow" data-tone="faint" d="${path3([[x0 + 6, (y0 + y1) / 2, CONV.z], [x1 - 6, (y0 + y1) / 2, CONV.z]])}"/>`,
  });
  [x0 + 1.2, x1 - 1.2].forEach((x, i) => disc(`conv.roller${i}`, FY([x, y0 + 3, 21.3]), 0, y1 - y0 - 6, 3.2, { tone: "mid" }));
  box("conv.rail1", [x0, y1 - 3, 18], [x1, y1, 27], { tone: "mid" }, {
    r: 0.8,
    bevel: 0.4,
    extra: (() => {
      const t = k.sideTicks(x0 + 4, x1 - 4, 4, 5, y1, 27, [1.4, 2.8], P, "x");
      return Ln(t.minor, { tone: "lo" }) + Ln(t.major, { tone: "mid" });
    })(),
  });
}

// ---------------------------------------------------------------- 5. outputs and the decision gate

const SORT = { c: [256, 19], host: null };
const PEDESTALS = [[288, -60], [296, 12], [288, 52]];
const PED_TOP = 26;
{
  const [cx, cy] = SORT.c;
  cyl("sort.base", cx, cy, 14, 0, 4, { tone: "lo" }, { bevel: 0.6 });
  SORT.host = cyl("sort.body", cx, cy, 11, 4, 28, { tone: "mid" }, { inner: Ln([12, 22].map((z) => k.sideArc(cx, cy, 11, z, P, 40)).join(""), { tone: "faint" }), extra: ledRow([[cx + 5.2, cy + 9.7, 24], [cx + 1, cy + 11, 24], [cx - 3.4, cy + 10.5, 24]], { delay: 400 }) });
  cyl("sort.cap", cx, cy, 12.5, 28, 31, { tone: "hi" }, { bevel: 0.6, cls: "fm-blue", extra: Ln(k.ring(cx, cy, 9, 31, P, 40), { tone: "lo" }) });
}
PEDESTALS.forEach(([px, py], i) => {
  cyl(`ped${i}.base`, px, py, 15, 0, 4, { tone: "lo" }, { bevel: 0.6, extra: Ln(k.ring(px, py, 13, 4, P, 40), { tone: "faint" }) });
  const column = cyl(`ped${i}.column`, px, py, 11, 4, PED_TOP - 3, { tone: "mid" }, { inner: Ln([10, 17].map((z) => k.sideArc(px, py, 11, z, P, 40)).join(""), { tone: "faint" }) });
  cyl(`ped${i}.dish`, px, py, 14, PED_TOP - 3, PED_TOP, { tone: "hi" }, { bevel: 0.6, cls: KIND_CLASS[i] === "fm-white" ? "" : KIND_CLASS[i], extra: Ln(k.ring(px, py, 12, PED_TOP, P, 48), { tone: "lo" }) });
  const T = tabletSvg(i, px, py, PED_TOP, { scale: 1 });
  const ring = `<path class="fm-select" data-sel="${i}" d="${k.ring(px, py, 12.6, PED_TOP + 0.05, P, 56)}"/>`;
  put(`ped${i}.tablet`, [px, py, PED_TOP + 2], `${ring}<g data-ped="${i}">${T.svg}</g>`, [record({ ...T.shape, name: `ped${i}.tablet` })], { cls: KIND_CLASS[i], bias: 0.05 });
  // Chute from the sorter to the pedestal.
  const [cx, cy] = SORT.c;
  const u = G.unit3([px - cx, py - cy, 0]);
  const z = [18, 9.5, 14][i];
  const a = boss(`chute${i}.out`, SORT.host, [cx, cy], 11, u, z, 5, 1.6, { cls: "fm-teal" });
  const b = boss(`chute${i}.in`, column, [px, py], 11, G.mul3(u, -1), z, 5, 1.6, { cls: "fm-teal" });
  pipe(`chute${i}`, [a, b], 2.6, { cls: "fm-teal" });
});
// Label plates between each pedestal and the gate, reading along the row.
const OUT_NAMES = ["LOWEST COST", "DIFFERENTIATION", "MANUFACTURABILITY"];
const OUT_SPAN = [[-79, -41], [-13, 37], [39, 95]];
PEDESTALS.forEach((_, i) => {
  const [ya, yb] = OUT_SPAN[i];
  const plate = { x: 312, y: ya, w: 12, d: yb - ya, r: 1.2 };
  box(`ped${i}.label`, [plate.x, plate.y, 0], [plate.x + plate.w, plate.y + plate.d, 1.2], { tone: "lo" }, {
    r: 1.2,
    steps: 2,
    bevel: 0,
    extra: `<g class="fm-tight">${label(onTopY(plate.x + 8, (ya + yb) / 2, 1.2), OUT_NAMES[i], 4.9)}</g>`,
  });
});
// Station label plates on the bed in front of the conveyor.
STATION_NAMES.slice(0, 5).forEach((name, i) => {
  const x = STATION_X[i];
  const plate = { x: x - 30, y: 39, w: 60, d: 12, r: 1.2 };
  box(`label.${name}`, [plate.x, plate.y, BZ], [plate.x + plate.w, plate.y + plate.d, BZ + 1.2], { tone: "lo" }, {
    r: 1,
    steps: 2,
    bevel: 0,
    extra: label(onTop(x, plate.y + 8.4, BZ + 1.2), name, 6.6) + screwsOnTop([[plate.x + 2.4, plate.y + 4.5], [plate.x + plate.w - 2.4, plate.y + 4.5]], BZ + 1.2, 0.4),
  });
});

// The decision gate: a portal over the three pedestals with a selector carriage and a lamp.
const GATE = { x: 340, y0: -96, y1: 72, z: 96 };
{
  // One post at the back; the beam is cantilevered over the pedestals on a diagonal brace.
  box("gate.post", [GATE.x - 5, GATE.y0 - 5, 3], [GATE.x + 5, GATE.y0 + 5, GATE.z], { tone: "mid" }, {
    r: 1.4,
    bevel: 0.6,
    inner: Ln([30, 60].map((z) => k.sideSeam({ x: GATE.x - 5, y: GATE.y0 - 5, w: 10, d: 10, r: 1.4 }, z, P, 3)).join(""), { tone: "faint" }),
  });
  box("gate.foot", [GATE.x - 9, GATE.y0 - 9, 0], [GATE.x + 9, GATE.y0 + 9, 3], { tone: "lo" }, { r: 1.6, extra: screwsOnTop(k.corners({ x: GATE.x - 9, y: GATE.y0 - 9, w: 18, d: 18 }, 2.6), 3) });
  pipe("gate.brace", [[GATE.x, GATE.y0 + 5, 40], [GATE.x, GATE.y0 + 16, 40], [GATE.x, GATE.y0 + 58, 82], [GATE.x, GATE.y0 + 58, GATE.z]], 2.2, { cls: "fm-blue", bend: 6 });
  box("gate.beam", [GATE.x - 5, GATE.y0 - 34, GATE.z], [GATE.x + 5, GATE.y1, GATE.z + 8], { tone: "mid" }, {
    r: 1.4,
    bevel: 0.7,
    cls: "fm-blue",
    extra: (() => {
      const t = k.sideTicks(GATE.y0 + 4, GATE.y1 - 4, 4, 5, GATE.x + 5, GATE.z + 8, [1.4, 2.8], P, "y");
      return Ln(t.minor, { tone: "lo" }) + Ln(t.major, { tone: "mid" }) + label(onSide(GATE.x + 5.05, GATE.y0 - 17, GATE.z + 6.4), "DECISION", 5.6);
    })(),
  });
}
// The human console at the front corner: three buttons and a selector lever in a slot.
const CONSOLE = { x0: 192, x1: 232, y0: 64, y1: 86, z: 22 };
{
  const { x0, x1, y0, y1, z } = CONSOLE;
  box("console.body", [x0, y0, 0], [x1, y1, z], { tone: "mid" }, {
    r: 2,
    bevel: 0.8,
    extra:
      Ln(k.planOutline({ x: x0 + 3, y: y0 + 11, w: x1 - x0 - 6, d: y1 - y0 - 14, r: 1.5 }, z, P, 3), { tone: "faint" }) +
      label(onFront((x0 + x1) / 2, y1 + 0.05, 10), "HUMAN", 6),
  });
  box("console.slot", [x0 + 5, y0 + 4, z], [x1 - 5, y0 + 7, z + 0.4], { tone: "lo" }, { r: 1.2, steps: 2, bevel: 0 });
  [0, 1, 2].forEach((i) => {
    const bx = x0 + 9 + i * 10;
    cyl(`console.button${i}`, bx, y0 + 14, 3, z, z + 2, { tone: "hi" }, { cls: KIND_CLASS[i] === "fm-white" ? "" : KIND_CLASS[i], bevel: 0.3 });
  });
}

// ---------------------------------------------------------------- settle, slots for live parts

A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const indexOf = (name) => R.items.findIndex((item) => item.name === name);

// Live parts drawn in reserved slots of the settled order.
const BELT_X = { from: -24, to: 236 };
const TAB_COUNT = 9;
const tabletsOnBelt = Array.from({ length: TAB_COUNT }, (_, i) => {
  const kind = i % 3;
  const T = tabletSvg(kind, 0, 19, CONV.z, { scale: 0.5 });
  return `<g class="${KIND_CLASS[kind]}" data-tab="${i}" data-kind="${kind}">${T.svg}</g>`;
}).join("");

const picker = (() => {
  const x = PICK.rest;
  const parts = [];
  parts.push(S(k.slabOf({ x: x - 6, y: PICK.y - 5, w: 12, d: 10, r: 1.2 }, PICK.z + 5, 5, P, 3, 0.5), { tone: "mid" }));
  parts.push(S(k.slabOf({ x: x - 2.5, y: PICK.y + 5, w: 5, d: 26, r: 0.8 }, PICK.z + 6, 3.5, P, 2, 0.3), { tone: "mid" }));
  parts.push(S(k.cylinder(x, PICK.y + 28, 1.3, 52, PICK.z + 6 - 52, P, 16), { tone: "hi" }));
  parts.push(S(k.slabOf({ x: x - 4, y: PICK.y + 25, w: 8, d: 6, r: 0.6 }, 50, 3, P, 2), { tone: "mid" }, {}));
  parts.push(S(k.slabOf({ x: x - 3.6, y: PICK.y + 25.4, w: 1.2, d: 5.2, r: 0.3 }, 45, 5, P, 1), { tone: "hi" }));
  parts.push(S(k.slabOf({ x: x + 2.4, y: PICK.y + 25.4, w: 1.2, d: 5.2, r: 0.3 }, 45, 5, P, 1), { tone: "hi" }));
  return parts.join("");
})();

const gateCarriage = (() => {
  const y = PEDESTALS[1][1];
  const [px] = PEDESTALS[1];
  const parts = [];
  parts.push(S(k.slabOf({ x: GATE.x - 8, y: y - 9, w: 16, d: 18, r: 1.6 }, GATE.z - 3, 14, P, 3, 0.6), { tone: "hi" }));
  parts.push(S(k.slabOf({ x: px, y: y - 3, w: GATE.x - 8 - px, d: 6, r: 0.8 }, GATE.z + 2, 4, P, 2, 0.4), { tone: "mid" }));
  parts.push(S(k.cylinder(px, y, 1.6, 72, GATE.z + 2 - 72, P, 16), { tone: "mid" }));
  parts.push(S(G.solidOf([[0, 6.5], [6, 6.5], [8, 3]], G.frameOf([px, y, 66], [0, 0, -1], [1, 0, 0], [0, -1, 0]), P, {}), { tone: "hi" }));
  const top = at([px, y, 66]);
  const left = at([px - 12, y, PED_TOP + 5]);
  const right = at([px + 12, y, PED_TOP + 5]);
  const lamp = at([px - 5, y, 66]);
  const lamp2 = at([px + 5, y, 66]);
  const beam = `<path class="fm-beam" d="M${f2(lamp[0])} ${f2(lamp[1])}L${f2(lamp2[0])} ${f2(lamp2[1])}L${f2(right[0] + 4)} ${f2(right[1] - 6)}L${f2(left[0] - 4)} ${f2(left[1] + 6)}Z"/>`;
  return `<g data-part="beam">${beam}</g>` + parts.join("") + ledRow([[GATE.x + 8.05, y, GATE.z + 4]], { delay: 0 });
})();

const slots = new Map();
const addSlot = (index, svg) => slots.set(index, (slots.get(index) ?? "") + svg);
addSlot(indexOf("conv.belt"), `<g data-part="tablets">${tabletsOnBelt}</g>`);
addSlot(indexOf("retr.beam"), `<g data-part="picker">${picker}</g>`);
addSlot(
  Math.max(...PEDESTALS.map((_, i) => indexOf(`ped${i}.tablet`)), indexOf("gate.beam")),
  `<g data-part="carriage">${gateCarriage}</g>`,
);
addSlot(indexOf("sort.cap"), `<path data-part="flap" class="iso-line" data-tone="hi" data-free="start" style="stroke-width:1.6" d=""/>`);
addSlot(indexOf("console.slot"), `<g data-part="lever"></g>`);
addSlot(indexOf("bench.dial"), `<path data-part="bench-needle" class="iso-line" data-tone="lit" data-free="start" style="stroke-width:1" d=""/>`);
addSlot(indexOf("cost.body"), `<g data-part="cost-needle" transform="${onFront(COST.dial[0], COST.dial[1] + 0.1, COST.dial[2])}"><path class="iso-line" data-tone="lit" data-free="end" style="stroke-width:1.1" d="M0 2.4L0 -9.6"/><circle class="fm-hub" r="1.1"/></g>`);

const groups = R.items.map((item, index) => `<g class="it${item.cls ? ` ${item.cls}` : ""}" data-name="${item.name}"${item.attrs ?? ""}>${item.svg}</g>${slots.get(index) ?? ""}`);

const LABEL_TEXT =
  "An isometric formulation decision machine. Five input modules on the left (global market formulations, internal development knowledge, gRIS project data, manufacturing process and equipment data, COGS and economic data) feed a header. A pipe climbs the back portal into a tablet press, and further pipes, a conveyor and an evidence bus join six stations: benchmarking, retrieval, candidate generation, manufacturing simulation, cost scoring and traceability. A sorter sends three tablet concepts (lowest cost, differentiation, manufacturability) to three pedestals, and a human decision gate selects one.";

const svg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, body: [...back, `<g class="fm-plant">${groups.join("")}</g>`] });

const DATA = {
  P,
  candidates: CANDIDATES,
  pedestals: PEDESTALS.map(([x, y]) => [x, y, PED_TOP]),
  sorter: { c: SORT.c, z: 31, r: 9 },
  gate: { restY: PEDESTALS[1][1] },
  belt: { from: BELT_X.from, to: BELT_X.to, count: TAB_COUNT },
  picker: { rest: PICK.rest, range: [-108, -80] },
  bench: { c: BENCH.dial, top: BENCH.dialZ + 6 },
  console: CONSOLE,
};

const CSS = readFileSync(join(HERE, "machine.css"), "utf8");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));

const body =
  `<style>${CSS}</style>` +
  k.plateHtml({
    fig: "Fig 1",
    title: "Formulation decision machine",
    hint: "Hover a candidate · 1 2 3",
    readout: CANDIDATES[1].readout,
    body: `<div class="iso-stage fm-stage" tabindex="0" role="radiogroup" aria-label="Formulation decision machine. Press 1, 2 or 3, or the arrow keys, to choose the candidate the decision gate selects.">${svg}<span class="fm-sr" role="status" aria-live="polite" data-status></span></div>`,
  });

const page = k.pageHtml({ title: "Formulation decision machine", theme: "light", body, script: kitScript() + LIVE, width: 1240 });
writeFileSync(join(HERE, "formulation-machine.html"), page);
console.log("wrote formulation-machine.html", `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `scale ${KS.toFixed(3)}`);

// The trace head carries its tape and each pedestal tablet its selection ring: both reach past the body on purpose.
A.auditOrExit(R, P, { cover: ["trace.head", "ped0.tablet", "ped1.tablet", "ped2.tablet"] });
