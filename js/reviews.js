/* ====== YOUR APPROVED REVIEWS: add new ones here ======
   Copy the format below. Put a comma after each review.
   Example:
   { name: "Ravi K", detail: "12-week fat loss", rating: 5, text: "Their plan changed how I eat and train." },
======================================================= */
const REVIEWS = [

];

(function () {
  const $ = s => document.querySelector(s);
  const list = $("#revList"), sum = $("#revSummary"), form = $("#revForm");
  if (!list) return;
  const stars = n => "\u2605".repeat(n) + "\u2606".repeat(5 - n);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  };

  // show approved reviews
  if (REVIEWS.length) {
    const avg = REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length;
    sum.textContent = avg.toFixed(1) + " out of 5, from " + REVIEWS.length + " client review" + (REVIEWS.length > 1 ? "s" : "") + ".";
    REVIEWS.forEach(r => {
      const q = el("blockquote");
      q.append(el("div", "stars", stars(r.rating)), el("p", "", r.text),
               el("cite", "", r.name + (r.detail ? ", " + r.detail : "")));
      list.append(q);
    });
  } else {
    sum.textContent = "No reviews yet. Be the first to share your experience with H'ANN.";
  }

  // send a new review to H'ANN on WhatsApp (published after approval)
  if (!form) return;
  form.noValidate = true;                       // show our own clear messages instead of silent browser pop-ups
  const note = $("#rvNote");
  const say = (html, bad) => { note.innerHTML = html; note.style.color = bad ? "#ff8a80" : ""; };

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#rvName").value.trim(), text = $("#rvText").value.trim();
    const rate = form.querySelector('input[name="rate"]:checked');
    if (!name) return say("Please enter your name.", true);
    if (!rate) return say("Please choose a star rating.", true);
    if (text.length < 20) return say("Please write at least 20 characters in your review.", true);

    const phone = (typeof CONFIG !== "undefined" ? String(CONFIG.whatsapp) : "").replace(/\D/g, "");
    if (!phone || phone === "919999999999") return say("The WhatsApp number is not set yet. Add your real number in js/config.js.", true);

    const msg = "New review for H'ANN\nName: " + name + "\nRating: " + rate.value + "/5\nReview: " + text;
    const url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(msg);
    window.open(url, "_blank");
    form.reset();
    say('Thank you! WhatsApp should open with your review. Press <b>send</b> there and we will publish it after approval. If it did not open, <a href="' + url + '" target="_blank" rel="noopener">tap here to open WhatsApp</a>.');
  });
})();
