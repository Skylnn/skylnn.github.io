// 1) Tema düğmesi (seçimini hatırlar)
const html = document.documentElement;
const kayitli = localStorage.getItem("tema");
if (kayitli) html.dataset.theme = kayitli;

document.querySelector("#tema").addEventListener("click", () => {
  const yeni = html.dataset.theme === "dark" ? "light" : "dark";
  html.dataset.theme = yeni;
  localStorage.setItem("tema", yeni);
});

// 2) Daktilo efekti
const alan = document.querySelector("#daktilo");
if (alan) {
  const kelimeler = ["System Administrator", "Linux Meraklısı", "Kubernetes Öğrencisi"];
  let k = 0, h = 0, siliyor = false;

  function yaz() {
    const kelime = kelimeler[k];
    alan.textContent = kelime.slice(0, h);
    h += siliyor ? -1 : 1;
    let bekle = siliyor ? 50 : 100;
    if (!siliyor && h > kelime.length) { siliyor = true; bekle = 1500; }
    else if (siliyor && h < 0) { siliyor = false; k = (k + 1) % kelimeler.length; bekle = 400; }
    setTimeout(yaz, bekle);
  }
  yaz();
}

// 3) Kaydırınca beliren bölümler
const gozlemci = new IntersectionObserver((girdiler) => {
  girdiler.forEach(g => { if (g.isIntersecting) g.target.classList.add("gorunur"); });
}, { threshold: 0.15 });

document.querySelectorAll(".bolum, .kart").forEach(el => {
  el.classList.add("gizli");
  gozlemci.observe(el);
});

// 4) Parçacık ağı arka planı
const tuval = document.querySelector("#arka");
if (tuval && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const c = tuval.getContext("2d");
  let W, H, noktalar = [];
  const fare = { x: -999, y: -999 };

  function boyutla() {
    const dpr = window.devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    tuval.width = W * dpr; tuval.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const adet = Math.min(90, Math.floor(W * H / 18000));
    noktalar = Array.from({ length: adet }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4
    }));
  }
  addEventListener("resize", boyutla);
  addEventListener("mousemove", e => { fare.x = e.clientX; fare.y = e.clientY; });
  addEventListener("mouseleave", () => { fare.x = -999; fare.y = -999; });

  function cizgi(x1, y1, x2, y2, mesafe, limit, renk) {
    c.strokeStyle = `rgba(${renk}, ${(1 - mesafe / limit) * 0.5})`;
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }

  function ciz() {
    c.clearRect(0, 0, W, H);
    const renk = html.dataset.theme === "dark" ? "165,168,255" : "99,102,241";

    for (let i = 0; i < noktalar.length; i++) {
      const p = noktalar[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      c.fillStyle = `rgba(${renk}, 0.7)`;
      c.beginPath(); c.arc(p.x, p.y, 2, 0, Math.PI * 2); c.fill();

      for (let j = i + 1; j < noktalar.length; j++) {
        const q = noktalar[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 130) cizgi(p.x, p.y, q.x, q.y, d, 130, renk);
      }
      const df = Math.hypot(p.x - fare.x, p.y - fare.y);
      if (df < 170) cizgi(p.x, p.y, fare.x, fare.y, df, 170, renk);
    }
    requestAnimationFrame(ciz);
  }
  boyutla();
  ciz();
}

// 5) Kartlarda fare ışığı
document.querySelectorAll(".kart").forEach(k => {
  k.addEventListener("mousemove", e => {
    const r = k.getBoundingClientRect();
    k.style.setProperty("--x", (e.clientX - r.left) + "px");
    k.style.setProperty("--y", (e.clientY - r.top) + "px");
  });
});
