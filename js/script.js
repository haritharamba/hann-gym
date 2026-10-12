// Contact settings come from js/config.js. If that file fails to load, the rest of the site still works.
const C = typeof CONFIG !== "undefined" ? CONFIG : { whatsapp: "", phoneShow: "", instagram: "" };
if (typeof CONFIG === "undefined") console.warn("js/config.js did not load: check that the file exists in the js folder.");

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const setText = (s, t) => { const e = $(s); if (e) e.textContent = t; };

setText("#phoneShow", C.phoneShow);
setText("#igShow", "@" + C.instagram);
setText("#yr", new Date().getFullYear());
const call = $("#callLink"); if (call) call.href = "tel:+" + C.whatsapp;

// WhatsApp buttons (open the app on phones, WhatsApp Web/desktop on computers)
$$("[data-wa]").forEach(a => {
  a.href = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(a.dataset.wa);
  a.target = "_blank"; a.rel = "noopener";
});

// Instagram buttons (app first on phones, website as fallback)
const igWeb = "https://instagram.com/" + C.instagram;
$$("[data-ig]").forEach(a => {
  a.href = igWeb; a.target = "_blank"; a.rel = "noopener";
  a.addEventListener("click", e => {
    if (!isMobile) return;
    e.preventDefault();
    const t = setTimeout(() => window.open(igWeb, "_blank"), 900);
    addEventListener("pagehide", () => clearTimeout(t), { once: true });
    location.href = "instagram://user?username=" + C.instagram;
  });
});

// Nav
const nav = $("#nav"), menu = $("#menu"), burger = $("#burger");
addEventListener("scroll", () => nav.classList.toggle("solid", scrollY > 40), { passive: true });
burger.addEventListener("click", () => burger.setAttribute("aria-expanded", menu.classList.toggle("open")));
$$("#menu a").forEach(a => a.addEventListener("click", () => menu.classList.remove("open")));

// Before/after sliders
$$(".ba").forEach(b => {
  const r = $("input", b), before = $(".before", b), bar = $(".bar", b);
  const move = () => { before.style.clipPath = `inset(0 ${100 - r.value}% 0 0)`; bar.style.left = r.value + "%"; };
  r.addEventListener("input", move);
});

// Apply for Coaching -> WhatsApp / Instagram chooser
const bm = $("#bookModal");
$$("[data-book]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); bm.hidden = false; }));
bm.addEventListener("click", e => { if (e.target === bm || e.target.closest("[data-close]")) bm.hidden = true; });
addEventListener("keydown", e => { if (e.key === "Escape") bm.hidden = true; });

/* ===== v3: premium interactions ===== */
// scroll progress bar + hero parallax
const prog = $("#prog"), heroImg = $(".hero-bg img");
addEventListener("scroll", () => {
  const h = document.documentElement;
  if (prog) prog.style.width = (scrollY / (h.scrollHeight - innerHeight) * 100) + "%";
  if (heroImg && scrollY < innerHeight) heroImg.style.transform = `translateY(${scrollY * .25}px) scale(1.08)`;
}, { passive: true });

// glow that follows the mouse in the hero
const hero = $(".hero");
if (hero) {
  const g = document.createElement("div");
  g.className = "hero-glow";
  hero.appendChild(g);
  hero.addEventListener("mousemove", e => {
    const r = hero.getBoundingClientRect();
    g.style.setProperty("--mx", e.clientX - r.left + "px");
    g.style.setProperty("--my", e.clientY - r.top + "px");
  });
}

// reveal on scroll
$$(".sec h2,.sec .lead,.ba-grid>div,.quotes blockquote,.steps li,.svc,.two>div,.pgrid .ph,.statbar>div,.about>div").forEach((el, i) => {
  el.classList.add("rv");
  el.style.transitionDelay = (i % 4) * 90 + "ms";
});
const rio = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const el = en.target;
  el.classList.add("in");
  rio.unobserve(el);
  setTimeout(() => { el.classList.remove("rv", "in"); el.style.transitionDelay = ""; }, 1400);
}), { threshold: .15 });
$$(".rv").forEach(el => rio.observe(el));

// count-up numbers
const cio = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const el = en.target, end = +el.dataset.count, step = Math.max(1, Math.round(end / 60));
  let n = 0;
  const id = setInterval(() => { n = Math.min(end, n + step); el.textContent = n + "+"; if (n >= end) clearInterval(id); }, 25);
  cio.unobserve(el);
}), { threshold: .6 });
$$("[data-count]").forEach(el => cio.observe(el));

// spotlight on service cards
$$(".svc").forEach(c => c.addEventListener("mousemove", e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty("--x", e.clientX - r.left + "px");
  c.style.setProperty("--y", e.clientY - r.top + "px");
}));

// magnetic buttons (desktop only)
if (!isMobile) $$(".btn").forEach(b => {
  b.addEventListener("mousemove", e => {
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .2}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
  });
  b.addEventListener("mouseleave", () => b.style.transform = "");
});

/* ===== v4.1: BMI + calorie calculator ===== */
// Pure calculation (no page code), so it can be tested on its own
function calcPlan({ male, age, h, w, act, bf, std }) {
  const bmi = w / ((h / 100) ** 2);
  const asian = std !== "intl";                 // Asian/Indian cut-offs: overweight 23, obese 25
  const ow = asian ? 23 : 25, ob = asian ? 25 : 30;
  const hasBF = bf >= 5 && bf <= 60;
  const bmr = hasBF ? 370 + 21.6 * w * (1 - bf / 100)                              // Katch-McArdle
                    : 10 * w + 6.25 * h - 5 * age + (male ? 5 : -161);              // Mifflin-St Jeor
  const maint = Math.round(bmr * act);
  const floor = male ? 1500 : 1200;             // never below a safe minimum
  const loss = Math.max(floor, maint - Math.min(500, Math.round(maint * .2 / 50) * 50));
  const gain = maint + Math.min(500, Math.max(250, Math.round(maint * .1 / 50) * 50));
  const muscular = hasBF && bmi >= ow && bf <= (male ? 15 : 24);

  const cat = muscular ? "BMI high, body fat low"
            : bmi < 18.5 ? "Underweight" : bmi < ow ? "Healthy range" : bmi < ob ? "Overweight" : "Obese range";
  let goal, prog, plan;
  if (bmi < 18.5) { goal = "gain"; prog = "Lean Muscle Gain Coaching";
    plan = "4-day split with progressive overload, a steady calorie surplus, high protein and weekly weigh-ins."; }
  else if (muscular) { goal = "maint"; prog = "Muscle Building and Recomposition";
    plan = "Your BMI reads high but your body fat is low, which points to muscle. Eat near maintenance and keep building."; }
  else if (bmi < 25) { goal = "maint"; prog = "Muscle Building and Recomposition";
    plan = bmi >= ow ? "Your BMI is in the overweight range for Indians. Eat near maintenance, train for muscle and keep an eye on your waist measurement."
                     : "4 to 5 day split, eat near maintenance and add calories as your strength goes up."; }
  else if (bmi < 30) { goal = "loss"; prog = "Body Transformation (Fat Loss)";
    plan = "4 strength days plus daily walking, a controlled calorie deficit and weekly check-ins."; }
  else { goal = "loss"; prog = "Fat Loss Transformation";
    plan = "3 strength days, daily walking, a gradual deficit and weekly check-ins. Start easy and build up."; }

  const cal = goal === "loss" ? loss : goal === "gain" ? gain : maint;
  const refW = (bmi >= 30 && !muscular) ? 25 * (h / 100) ** 2 : w;   // protein from a healthy reference weight when BMI is high
  const p = Math.round(refW * (goal === "loss" ? 2 : goal === "gain" ? 1.8 : 1.7));
  const f = Math.round(cal * .25 / 9);
  const c = Math.max(0, Math.round((cal - p * 4 - f * 9) / 4));
  return { bmi, bmr, maint, loss, gain, cat, goal, prog, plan, cal, p, f, c, hasBF, ow, ob,
           wLo: 18.5 * (h / 100) ** 2, wHi: (ow - .1) * (h / 100) ** 2 };
}

const calcForm = $("#calcForm");
if (calcForm) calcForm.addEventListener("submit", e => {
  e.preventDefault();
  const male = calcForm.g.value === "m";
  const age = +$("#cAge").value, h = +$("#cH").value, w = +$("#cW").value, act = +$("#cAct").value;
  if (!age || !h || !w) return;
  const bfEl = $("#cBF"), stdEl = $("#cStd");
  const std = stdEl ? stdEl.value : "asian";
  const r = calcPlan({ male, age, h, w, act, bf: bfEl ? parseFloat(bfEl.value) : NaN, std });
  const fmt = n => Math.round(n).toLocaleString("en-IN");
  const pct = g => Math.round(g / r.cal * 100);
  const goalName = { loss: "fat loss", gain: "muscle gain", maint: "body recomposition" }[r.goal];
  const pos = Math.min(100, Math.max(0, (r.bmi - 15) / 25 * 100));
  const a = (18.5 - 15) / 25 * 100, b = (r.ow - 15) / 25 * 100, c2 = (r.ob - 15) / 25 * 100;
  const grad = `linear-gradient(90deg,#4aa3ff 0 ${a}%,#3ecf8e ${a}% ${b}%,#EBC577 ${b}% ${c2}%,#A9772B ${c2}%)`;

  const msg = `Hi, I used the H'ANN calculator. ${male ? "Male" : "Female"}, ${age} years, ${h} cm, ${w} kg${r.hasBF ? ", " + bfEl.value + "% body fat" : ""}. BMI ${r.bmi.toFixed(1)}. My target is ${fmt(r.cal)} kcal/day. I am interested in ${r.prog}.`;
  const wa = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg);

  $("#calcOut").innerHTML = `
    <div class="bmi-top"><div><span class="cat">Your BMI</span><b class="big">${r.bmi.toFixed(1)}</b><span class="cat">${r.cat}</span></div>
      <div class="scale" style="background:${grad}"><i id="bmiMark"></i></div></div>
    <p class="rest">Healthy weight for your height: <b>${r.wLo.toFixed(0)} to ${r.wHi.toFixed(0)} kg</b>. Your body burns about <b>${fmt(r.bmr)} kcal</b> a day at rest (${r.hasBF ? "calculated from your body fat %" : "BMR"}).</p>
    <div class="kcals">
      <div class="kc ${r.goal === "loss" ? "rec" : ""}"><span>Fat loss</span><b>${fmt(r.loss)}</b><small>kcal/day, ${fmt(r.maint - r.loss)} below maintenance</small></div>
      <div class="kc ${r.goal === "maint" ? "rec" : ""}"><span>Maintenance</span><b>${fmt(r.maint)}</b><small>kcal/day to stay the same</small></div>
      <div class="kc ${r.goal === "gain" ? "rec" : ""}"><span>Muscle gain</span><b>${fmt(r.gain)}</b><small>kcal/day, ${fmt(r.gain - r.maint)} above maintenance</small></div>
    </div>
    <h3>Daily macros for ${goalName} (${fmt(r.cal)} kcal)</h3>
    <div class="macro"><span>Protein</span><div class="mbar"><i data-w="${pct(r.p * 4)}"></i></div><b>${r.p} g</b></div>
    <div class="macro"><span>Carbs</span><div class="mbar"><i data-w="${pct(r.c * 4)}"></i></div><b>${r.c} g</b></div>
    <div class="macro"><span>Fats</span><div class="mbar"><i data-w="${pct(r.f * 9)}"></i></div><b>${r.f} g</b></div>
    <div class="recbox"><span class="cat">Recommended coaching</span><h3>${r.prog}</h3><p>${r.plan}</p>
      <a class="btn" href="${wa}" target="_blank" rel="noopener">Get my plan on WhatsApp</a></div>
    <p class="note">These are estimates. BMI uses ${std === "intl" ? "international (WHO)" : "Asian/Indian"} cut-offs and does not measure muscle. Calories are a starting point and are adjusted at your weekly check-ins. If you have a medical condition, take medication or are pregnant, check with your doctor before changing your diet.</p>`;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    $("#bmiMark").style.left = pos + "%";
    $$("#calcOut .mbar i").forEach(i => i.style.width = i.dataset.w + "%");
  }));
});
