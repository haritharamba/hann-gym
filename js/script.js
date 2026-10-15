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

/* ===== v5: TDEE calculator (same inputs and logic as calculator.net/tdee-calculator) ===== */
// Activity factors: BMR x factor = TDEE
const LEVELS = [["BMR", 1], ["Sedentary", 1.2], ["Light", 1.375], ["Moderate", 1.465], ["Active", 1.55], ["Very Active", 1.725], ["Extra Active", 1.9]];

// Pure calculation (no page code), so it can be tested on its own. h in cm, w in kg.
function calcPlan({ male, age, h, w, act, bf, std, formula }) {
  const bmi = w / ((h / 100) ** 2);
  const asian = std !== "intl";                          // Asian/Indian BMI cut-offs: overweight 23, obese 25
  const ow = asian ? 23 : 25, ob = asian ? 25 : 30;
  const hasBF = formula === "katch" && bf > 0;
  const bmr = hasBF ? 370 + 21.6 * w * (1 - bf / 100)                              // Katch-McArdle
                    : 10 * w + 6.25 * h - 5 * age + (male ? 5 : -161);              // Mifflin St Jeor
  const maint = Math.round(bmr * act);                                              // TDEE
  const table = LEVELS.map(([n, f]) => [n, f, Math.round(bmr * f)]);
  const minCal = male ? 1500 : 1200;                                                // minimum daily calories: 1,500 men, 1,200 women
  const pctOf = v => Math.round(v / maint * 100);                                   // % of maintenance, like calculator.net
  const mk = ([name, rate, d]) => ({ name, rate, cal: maint + d, pct: pctOf(maint + d) });
  const lose = [["Mild weight loss", "0.25 kg/week", -250], ["Weight loss", "0.5 kg/week", -500], ["Extreme weight loss", "1 kg/week", -1000]]
    .filter(t => maint + t[2] >= minCal).map(mk);                                   // hidden when it would go below the minimum
  const gainT = [["Mild weight gain", "0.25 kg/week", 250], ["Weight gain", "0.5 kg/week", 500], ["Fast weight gain", "1 kg/week", 1000]].map(mk);
  const warn = maint - 1000 < minCal;                                               // doctor warning, as on calculator.net
  const muscular = hasBF && bmi >= ow && bf <= (male ? 15 : 24);

  const cat = asian ? (bmi < 18.5 ? "Underweight" : bmi < 23 ? "Normal" : bmi < 25 ? "Overweight" : "Obese")
    : bmi < 16 ? "Severe Thinness" : bmi < 17 ? "Moderate Thinness" : bmi < 18.5 ? "Mild Thinness" : bmi < 25 ? "Normal"
    : bmi < 30 ? "Overweight" : bmi < 35 ? "Obese Class I" : bmi < 40 ? "Obese Class II" : "Obese Class III";   // WHO classes, as on calculator.net
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

  const cal = goal === "loss" ? Math.max(minCal, maint - 500) : goal === "gain" ? maint + (bmi < 18.5 ? 500 : 250) : maint;
  const refW = (bmi >= 30 && !muscular) ? 25 * (h / 100) ** 2 : w;   // protein from a healthy reference weight when BMI is high
  const p = Math.round(refW * (goal === "loss" ? 2 : goal === "gain" ? 1.8 : 1.7));
  const f = Math.round(cal * .25 / 9);
  const c = Math.max(0, Math.round((cal - p * 4 - f * 9) / 4));
  return { bmi, bmr, maint, table, lose, gainT, warn, minCal, cat, goal, prog, plan, cal, p, f, c, hasBF, ow, ob,
           wLo: 18.5 * (h / 100) ** 2, wHi: ow * (h / 100) ** 2,
           prime: bmi / 25, pi: w / ((h / 100) ** 3) };
}

const calcForm = $("#calcForm");
if (calcForm) {
  const sync = () => {                                   // show the right fields for the chosen units and formula
    const us = calcForm.u.value === "us";
    $("#hMetric").hidden = us; $("#hUS").hidden = !us;
    $("#wLbl").textContent = us ? "Weight (pounds)" : "Weight (kg)";
    $("#bfRow").hidden = $("#cForm").value !== "katch";
  };
  calcForm.addEventListener("change", sync);
  sync();

  calcForm.addEventListener("submit", e => {
    e.preventDefault();
    const out = $("#calcOut");
    const err = m => { out.innerHTML = `<p class="calc-err">${m}</p>`; };
    const us = calcForm.u.value === "us", male = calcForm.g.value === "m";
    const age = +$("#cAge").value, act = +$("#cAct").value, formula = $("#cForm").value;
    const h = us ? ((+$("#cFt").value || 0) * 12 + (+$("#cIn").value || 0)) * 2.54 : +$("#cH").value;
    const w = us ? +$("#cW").value * 0.45359237 : +$("#cW").value;
    const bf = parseFloat($("#cBF").value);
    if (!(age >= 18 && age <= 80)) return err("Please enter an age between 18 and 80.");
    if (!(h >= 90 && h <= 260)) return err("Please enter a valid height.");
    if (!(w >= 25 && w <= 400)) return err("Please enter a valid weight.");
    if (formula === "katch" && !(bf >= 3 && bf <= 70)) return err("Katch-McArdle needs your body fat %, between 3 and 70.");

    const std = $("#cStd").value;
    const r = calcPlan({ male, age, h, w, act, bf, std, formula });
    const kj = $("#cUnit").value === "kj", un = kj ? "kJ" : "Calories";
    const fmt = n => Math.round(n).toLocaleString("en-IN");
    const U = n => fmt(kj ? n * 4.184 : n);
    const formulaName = r.hasBF ? "Katch-McArdle" : "Mifflin St Jeor";
    const lvTable = `<table class="lv"><tbody>${r.table.map(([n, f, v]) => `<tr class="${f === act ? "on" : ""}"><td>${n === "BMR" ? "Basal Metabolic Rate (BMR)" : n}</td><td>${U(v)} ${un}/day</td></tr>`).join("")}</tbody></table>`;

    if (act === 1) {                                     // BMR option: no daily target
      out.innerHTML = `<span class="cat">Basal Metabolic Rate (${formulaName})</span><b class="big">${U(r.bmr)}</b><span class="cat">${un}/day</span>
        ${lvTable}<p class="note">BMR is what your body burns at complete rest. It is not a daily eating target. Choose an activity level to see your daily calories (TDEE), calorie goals and macros.</p>`;
      return;
    }

    const goalName = { loss: "fat loss", gain: "muscle gain", maint: "body recomposition" }[r.goal];
    const pct = g => Math.round(g / r.cal * 100);
    const pos = Math.min(100, Math.max(0, (r.bmi - 15) / 25 * 100));
    const a = (18.5 - 15) / 25 * 100, b = (r.ow - 15) / 25 * 100, c2 = (r.ob - 15) / 25 * 100;
    const grad = `linear-gradient(90deg,#4aa3ff 0 ${a}%,#3ecf8e ${a}% ${b}%,#EBC577 ${b}% ${c2}%,#A9772B ${c2}%)`;
    const msg = `Hi, I used the H'ANN calculator. ${male ? "Male" : "Female"}, ${age} years, ${Math.round(h)} cm, ${Math.round(w * 10) / 10} kg${r.hasBF ? ", " + bf + "% body fat" : ""}. BMI ${r.bmi.toFixed(1)}. My maintenance is ${fmt(r.maint)} kcal/day and my target is ${fmt(r.cal)} kcal/day. I am interested in ${r.prog}.`;
    const wa = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg);

    const n = (x, d) => Number(x.toFixed(d)).toString();            // 81.0 shows as 81, like calculator.net
    const ticks = (std === "intl" ? [18.5, 25, 30, 35, 40] : [18.5, 23, 25, 30]).map(v => `<span class="tk" style="left:${(v - 15) / 25 * 100}%">${v}</span>`).join("");
    const tiers = arr => arr.map(t => `<div class="kc ${t.cal === r.cal ? "rec" : ""}"><span>${t.name}</span><b>${U(t.cal)}</b><small>${t.rate}, ${t.pct}% of maintenance</small></div>`).join("");
    out.innerHTML = `
      <p class="rest">The estimated TDEE, or body weight maintenance energy requirement, is</p>
      <b class="big">${U(r.maint)}</b><span class="cat">${un} per day</span>
      <p class="rest">BMR: <b>${U(r.bmr)} ${un}/day</b> (${formulaName}). TDEE = BMR x activity factor.</p>
      <div class="bmi-top"><div><span class="cat">BMI</span><b class="big">${r.bmi.toFixed(1)}</b><span class="cat">kg/m2 (${r.cat})</span></div>
        <div class="scale" style="background:${grad}"><i id="bmiMark"></i>${ticks}</div></div>
      <p class="rest">Healthy BMI range: <b>18.5 kg/m2 - ${r.ow} kg/m2</b><br>Healthy weight for the height: <b>${n(r.wLo, 1)} kg - ${n(r.wHi, 1)} kg</b><br>BMI Prime: <b>${n(r.prime, 2)}</b> &nbsp; Ponderal Index: <b>${n(r.pi, 1)} kg/m3</b></p>
      <h3>Energy intake to lose weight</h3>
      <div class="kcals">${tiers(r.lose)}</div>
      ${r.warn ? `<p class="note">Please consult a doctor when losing 1 kg or more per week, since it needs you to eat less than the minimum recommendation of ${fmt(r.minCal)} calories a day.</p>` : ""}
      <h3>Energy intake to gain weight</h3>
      <div class="kcals">${tiers(r.gainT)}</div>
      ${lvTable}
      <h3>Daily macros for ${goalName} (${U(r.cal)} ${un})</h3>
      <div class="macro"><span>Protein</span><div class="mbar"><i data-w="${pct(r.p * 4)}"></i></div><b>${r.p} g</b></div>
      <div class="macro"><span>Carbs</span><div class="mbar"><i data-w="${pct(r.c * 4)}"></i></div><b>${r.c} g</b></div>
      <div class="macro"><span>Fats</span><div class="mbar"><i data-w="${pct(r.f * 9)}"></i></div><b>${r.f} g</b></div>
      <div class="recbox"><span class="cat">Recommended coaching</span><h3>${r.prog}</h3><p>${r.plan}</p>
        <a class="btn" href="${wa}" target="_blank" rel="noopener">Get my plan on WhatsApp</a></div>
      <p class="note">Estimates only. BMI uses ${$("#cStd").value === "intl" ? "international (WHO)" : "Asian/Indian"} cut-offs and does not measure muscle. Fat loss never goes below ${fmt(r.minCal)} calories. Calories are adjusted at your weekly check-ins. If you have a medical condition, take medication or are pregnant, check with your doctor before changing your diet.</p>`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      $("#bmiMark").style.left = pos + "%";
      $$("#calcOut .mbar i").forEach(i => i.style.width = i.dataset.w + "%");
    }));
  });
}
