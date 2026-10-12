const DATA = __DATA__;
const P = DATA.P;
const stage = document.querySelector(".fm-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const status = stage.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const $ = (selector) => svg.querySelector(selector);
const tablets = [...svg.querySelectorAll("[data-tab]")];
const picker = $('[data-part="picker"]');
const carriage = $('[data-part="carriage"]');
const flap = $('[data-part="flap"]');
const lever = $('[data-part="lever"]');
const benchNeedle = $('[data-part="bench-needle"]');
const costNeedle = $('[data-part="cost-needle"]');
const costBase = costNeedle.getAttribute("transform");
const peds = [0, 1, 2].map((i) => svg.querySelector(`[data-ped="${i}"]`));
const rings = [0, 1, 2].map((i) => svg.querySelector(`[data-sel="${i}"]`));

// The selector lever: a knob riding in the console slot, built once and translated.
const C = DATA.console;
const slotX = (i) => C.x0 + 9 + i * 10;
lever.innerHTML =
  solidSvg(slabOf({ x: slotX(0) - 1.2, y: C.y0 + 4.6, w: 2.4, d: 1.8, r: 0.6 }, C.z, 7, P, 2), { tone: "mid" }) +
  solidSvg(cylinder(slotX(0), C.y0 + 5.5, 2.4, C.z + 7, 3.2, P, 20, 0.3), { tone: "hi" });

const state = { sel: 1, gateY: DATA.pedestals[1][1], flap: 0, lever: 1, bench: DATA.candidates[1].bench, cost: DATA.candidates[1].cost, pick: DATA.picker.rest, belt: 0 };
let touring = !still.matches;
let clock = 0;
let last = 0;
let frame = 0;
let visible = false;
let idle = 0;

const ease = (value, target, dt, seconds) => (still.matches ? target : value + (target - value) * (1 - Math.exp(-dt / seconds)));
const angleTo = (i) => {
  const [px, py] = DATA.pedestals[i];
  const [cx, cy] = DATA.sorter.c;
  return Math.atan2(py - cy, px - cx);
};

function select(i, announce = true) {
  state.sel = i;
  peds.forEach((group, j) => group.querySelectorAll(".iso-solid").forEach((el) => el.toggleAttribute("data-lit", j === i)));
  rings.forEach((ring, j) => ring.toggleAttribute("data-on", j === i));
  const text = DATA.candidates[i].readout;
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", `Candidate ${DATA.candidates[i].key}: ${DATA.candidates[i].name}`);
  if (announce) status.textContent = `Candidate ${DATA.candidates[i].key}, ${DATA.candidates[i].name}, selected at the decision gate`;
}

function draw() {
  carriage.setAttribute("transform", translateAlong(P, [0, state.gateY - DATA.gate.restY, 0]));
  const [cx, cy] = DATA.sorter.c;
  const r = DATA.sorter.r;
  flap.setAttribute("d", lineOnTop([cx - Math.cos(state.flap) * 2.5, cy - Math.sin(state.flap) * 2.5], [cx + Math.cos(state.flap) * r, cy + Math.sin(state.flap) * r], DATA.sorter.z, P));
  lever.setAttribute("transform", translateAlong(P, [(slotX(2) - slotX(0)) * (state.lever / 2), 0, 0]));
  picker.setAttribute("transform", translateAlong(P, [state.pick - DATA.picker.rest, 0, 0]));
  const [bx, by] = DATA.bench.c;
  const a = (-0.75 + state.bench * 1.5) * Math.PI;
  benchNeedle.setAttribute("d", lineOnTop([bx - Math.sin(a) * 1.4, by + Math.cos(a) * 1.4], [bx + Math.sin(a) * 5.6, by - Math.cos(a) * 5.6], DATA.bench.top + 0.2, P));
  costNeedle.setAttribute("transform", `${costBase} rotate(${(-130 + state.cost * 260).toFixed(2)})`);
  const span = DATA.belt.to - DATA.belt.from;
  const gap = span / DATA.belt.count;
  tablets.forEach((el, i) => {
    const u = (((state.belt + i * gap) % span) + span) % span;
    const x = DATA.belt.from + u;
    const fade = Math.min(1, u / 14, (span - u) / 14);
    el.setAttribute("transform", translateAlong(P, [x, 0, 0]));
    el.setAttribute("opacity", Math.max(0, fade).toFixed(3));
  });
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) {
    clock += dt;
    const next = Math.floor(clock / 4.2) % 3;
    if (next !== state.sel) select(next, false);
  }
  const target = DATA.candidates[state.sel];
  state.gateY = ease(state.gateY, DATA.pedestals[state.sel][1], dt, 0.55);
  state.flap = ease(state.flap, angleTo(state.sel), dt, 0.35);
  state.lever = ease(state.lever, state.sel, dt, 0.3);
  state.bench = ease(state.bench, target.bench, dt, 0.7);
  state.cost = ease(state.cost, target.cost, dt, 0.9);
  if (!still.matches) {
    state.belt += dt * 16;
    const t = now / 1000;
    const [lo, hi] = DATA.picker.range;
    const want = Math.floor(t / 2.6) % 2 ? hi : lo;
    state.pick = ease(state.pick, want, dt, 0.6);
  }
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}

const run = () => {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
};
const settleStill = () => {
  if (!still.matches) return;
  const target = DATA.candidates[state.sel];
  Object.assign(state, { gateY: DATA.pedestals[state.sel][1], flap: angleTo(state.sel), lever: state.sel, bench: target.bench, cost: target.cost });
  draw();
};

function choose(i) {
  touring = false;
  clearTimeout(idle);
  idle = setTimeout(() => {
    touring = !still.matches;
    clock = state.sel * 4.2;
    run();
  }, 6000);
  if (i !== state.sel) select(i);
  settleStill();
  run();
}

function nearestPedestal(event) {
  const m = svg.getScreenCTM();
  if (!m) return -1;
  const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(m.inverse());
  let best = -1;
  let dist = 70;
  DATA.pedestals.forEach((ped, i) => {
    const [sx, sy] = iso(ped, P);
    const d = Math.hypot(p.x - sx, p.y - sy);
    if (d < dist) {
      dist = d;
      best = i;
    }
  });
  return best;
}

stage.addEventListener("pointermove", (event) => {
  const i = nearestPedestal(event);
  if (i >= 0) choose(i);
});
stage.addEventListener("click", (event) => {
  const i = nearestPedestal(event);
  if (i >= 0) choose(i);
});
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (["1", "2", "3"].includes(event.key)) to = Number(event.key) - 1;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") to = (state.sel + 1) % 3;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = (state.sel + 2) % 3;
  if (to === null) return;
  event.preventDefault();
  choose(to);
});
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);
still.addEventListener("change", () => {
  touring = !still.matches;
  settleStill();
  run();
});

select(1, false);
settleStill();
draw();
