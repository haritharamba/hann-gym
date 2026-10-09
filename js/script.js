const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const setText = (s, t) => { const e = $(s); if (e) e.textContent = t; };

setText("#phoneShow", CONFIG.phoneShow);
setText("#igShow", "@" + CONFIG.instagram);
setText("#yr", new Date().getFullYear());
const call = $("#callLink");
if (call) call.href = "tel:+" + CONFIG.whatsapp;

// WhatsApp buttons (open the app on phones, WhatsApp Web/desktop on computers)
$$("[data-wa]").forEach(a => {
    a.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(a.dataset.wa);
    a.target = "_blank";
    a.rel = "noopener";
});

// Instagram buttons (app first on phones, website as fallback)
const igWeb = "https://instagram.com/" + CONFIG.instagram;
$$("[data-ig]").forEach(a => {
    a.href = igWeb;
    a.target = "_blank";
    a.rel = "noopener";
    a.addEventListener("click", e => {
        if (!isMobile) return;
        e.preventDefault();
        const t = setTimeout(() => window.open(igWeb, "_blank"), 900);
        addEventListener("pagehide", () => clearTimeout(t), { once: true });
        location.href = "instagram://user?username=" + CONFIG.instagram;
    });
});

// Nav
const nav = $("#nav"),
    menu = $("#menu"),
    burger = $("#burger");
addEventListener("scroll", () => nav.classList.toggle("solid", scrollY > 40), { passive: true });
burger.addEventListener("click", () => burger.setAttribute("aria-expanded", menu.classList.toggle("open")));
$$("#menu a").forEach(a => a.addEventListener("click", () => menu.classList.remove("open")));

// Before/after sliders
$$(".ba").forEach(b => {
    const r = $("input", b),
        before = $(".before", b),
        bar = $(".bar", b);
    const move = () => {
        before.style.clipPath = `inset(0 ${100 - r.value}% 0 0)`;
        bar.style.left = r.value + "%";
    };
    r.addEventListener("input", move);
});

// Apply for Coaching -> WhatsApp / Instagram chooser
const bm = $("#bookModal");
$$("[data-book]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    bm.hidden = false;
}));
bm.addEventListener("click", e => { if (e.target === bm || e.target.closest("[data-close]")) bm.hidden = true; });
addEventListener("keydown", e => { if (e.key === "Escape") bm.hidden = true; });

/* ===== v3: premium interactions ===== */
// scroll progress bar + hero parallax
const prog = $("#prog"),
    heroImg = $(".hero-bg img");
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
    setTimeout(() => {
        el.classList.remove("rv", "in");
        el.style.transitionDelay = "";
    }, 1400);
}), { threshold: .15 });
$$(".rv").forEach(el => rio.observe(el));

// count-up numbers
const cio = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target,
        end = +el.dataset.count,
        step = Math.max(1, Math.round(end / 60));
    let n = 0;
    const id = setInterval(() => {
        n = Math.min(end, n + step);
        el.textContent = n + "+";
        if (n >= end) clearInterval(id);
    }, 25);
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

/* ===== v4: BMI + calorie calculator ===== */
const calcForm = $("#calcForm");
if (calcForm) calcForm.addEventListener("submit", e => {
    e.preventDefault();
    const male = calcForm.g.value === "m";
    const age = +$("#cAge").value,
        h = +$("#cH").value,
        w = +$("#cW").value,
        act = +$("#cAct").value;
    if (!age || !h || !w) return;
    const fmt = n => Math.round(n).toLocaleString("en-IN");

    const bmi = w / ((h / 100) ** 2);
    const bmr = 10 * w + 6.25 * h - 5 * age + (male ? 5 : -161); // Mifflin-St Jeor
    const maint = Math.round(bmr * act / 10) * 10;
    const floor = male ? 1500 : 1200; // never go below a safe minimum
    const loss = Math.max(floor, maint - Math.min(500, Math.round(maint * .2 / 50) * 50));
    const gain = maint + Math.min(500, Math.max(250, Math.round(maint * .1 / 50) * 50));

    let cat, goal, prog, plan;
    if (bmi < 18.5) {
        cat = "Underweight";
        goal = "gain";
        prog = "Lean Muscle Gain Coaching";
        plan = "4-day split with progressive overload, a steady calorie surplus, high protein and weekly weigh-ins.";
    } else if (bmi < 25) {
        cat = "Healthy range";
        goal = "maint";
        prog = "Muscle Building and Recomposition";
        plan = "4 to 5 day split, eat near maintenance and add calories as your strength goes up.";
    } else if (bmi < 30) {
        cat = "Overweight";
        goal = "loss";
        prog = "Body Transformation (Fat Loss)";
        plan = "4 strength days plus daily walking, a controlled calorie deficit and weekly check-ins.";
    } else {
        cat = "High (obese range)";
        goal = "loss";
        prog = "Fat Loss Transformation";
        plan = "3 strength days, daily walking, a gradual deficit and weekly check-ins. Start easy and build up.";
    }

    const cal = goal === "loss" ? loss : goal === "gain" ? gain : maint;
    const refW = bmi >= 30 ? 25 * (h / 100) ** 2 : w; // protein from a healthy reference weight if BMI is high
    const p = Math.round(refW * (goal === "loss" ? 2 : goal === "gain" ? 1.8 : 1.7));
    const f = Math.round(cal * .25 / 9);
    const c = Math.max(0, Math.round((cal - p * 4 - f * 9) / 4));
    const pct = g => Math.round(g / cal * 100);
    const goalName = { loss: "fat loss", gain: "muscle gain", maint: "body recomposition" }[goal];
    const pos = Math.min(100, Math.max(0, (bmi - 15) / 25 * 100));

    const msg = `Hi, I used the H'ANN calculator. ${male ? "Male" : "Female"}, ${age} years, ${h} cm, ${w} kg. BMI ${bmi.toFixed(1)}. My target is ${fmt(cal)} kcal/day. I am interested in ${prog}.`;
    const wa = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);

    $("#calcOut").innerHTML = `
    <div class="bmi-top"><div><span class="cat">Your BMI</span><b class="big">${bmi.toFixed(1)}</b><span class="cat">${cat}</span></div>
      <div class="scale"><i id="bmiMark"></i></div></div>
    <p class="rest">Your body burns about <b>${fmt(bmr)} kcal</b> a day at rest (BMR).</p>
    <div class="kcals">
      <div class="kc ${goal === "loss" ? "rec" : ""}"><span>Fat loss</span><b>${fmt(loss)}</b><small>kcal/day, ${fmt(maint - loss)} below maintenance</small></div>
      <div class="kc ${goal === "maint" ? "rec" : ""}"><span>Maintenance</span><b>${fmt(maint)}</b><small>kcal/day to stay the same</small></div>
      <div class="kc ${goal === "gain" ? "rec" : ""}"><span>Muscle gain</span><b>${fmt(gain)}</b><small>kcal/day, ${fmt(gain - maint)} above maintenance</small></div>
    </div>
    <h3>Daily macros for ${goalName} (${fmt(cal)} kcal)</h3>
    <div class="macro"><span>Protein</span><div class="mbar"><i data-w="${pct(p * 4)}"></i></div><b>${p} g</b></div>
    <div class="macro"><span>Carbs</span><div class="mbar"><i data-w="${pct(c * 4)}"></i></div><b>${c} g</b></div>
    <div class="macro"><span>Fats</span><div class="mbar"><i data-w="${pct(f * 9)}"></i></div><b>${f} g</b></div>
    <div class="recbox"><span class="cat">Recommended coaching</span><h3>${prog}</h3><p>${plan}</p>
      <a class="btn" href="${wa}" target="_blank" rel="noopener">Get my plan on WhatsApp</a></div>
    <p class="note">Estimates only, using the Mifflin-St Jeor formula. BMI does not measure muscle, so very muscular people can read high. If you have a medical condition, take medication or are pregnant, check with your doctor before changing your diet.</p>`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
        $("#bmiMark").style.left = pos + "%";
        $$("#calcOut .mbar i").forEach(i => i.style.width = i.dataset.w + "%");
    }));
});