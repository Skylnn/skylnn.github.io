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
// 5) Kartlarda fare ışığı (sonradan eklenen kartlarda da çalışır)
document.addEventListener("mousemove", e => {
  const k = e.target.closest(".kart");
  if (!k) return;
  const r = k.getBoundingClientRect();
  k.style.setProperty("--x", (e.clientX - r.left) + "px");
  k.style.setProperty("--y", (e.clientY - r.top) + "px");
});
// 6) Üstte ilerleme çubuğu + yukarı çık düğmesi
const ilerleme = document.querySelector("#ilerleme");
const yukari = document.querySelector("#yukari");
addEventListener("scroll", () => {
  const h = document.documentElement;
  const oran = h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1);
  if (ilerleme) ilerleme.style.width = (oran * 100) + "%";
  if (yukari) yukari.classList.toggle("goster", h.scrollTop > 400);
});
if (yukari) yukari.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

// 7) Mobil menü
const menuDugme = document.querySelector("#menu");
const menuler = document.querySelector("#menuler");
if (menuDugme && menuler) {
  const kapat = () => { menuler.classList.remove("acik"); menuDugme.textContent = "☰"; menuDugme.setAttribute("aria-expanded", "false"); };
  menuDugme.addEventListener("click", () => {
    const acik = menuler.classList.toggle("acik");
    menuDugme.textContent = acik ? "✕" : "☰";
    menuDugme.setAttribute("aria-expanded", acik);
  });
  menuler.querySelectorAll("a").forEach(a => a.addEventListener("click", kapat));
}

// 8) Menüde bulunduğun bölümü vurgula
const menuLinkleri = document.querySelectorAll('#menuler a[href^="#"]');
if (menuLinkleri.length) {
  const iz = new IntersectionObserver(girdiler => {
    girdiler.forEach(g => {
      if (g.isIntersecting) {
        menuLinkleri.forEach(a => a.classList.toggle("aktif", a.getAttribute("href") === "#" + g.target.id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach(s => iz.observe(s));
}

// 9) Sayaçlar: görünür olunca 0'dan hedefe sayar
document.querySelectorAll("[data-hedef]").forEach(el => {
  const hedef = +el.dataset.hedef, ek = el.dataset.ek || "";
  new IntersectionObserver((girdiler, gozlem) => {
    if (!girdiler[0].isIntersecting) return;
    gozlem.disconnect();
    const sure = 1200, basla = performance.now();
    (function adim(simdi) {
      const p = Math.min((simdi - basla) / sure, 1);
      el.textContent = Math.round(hedef * (1 - Math.pow(1 - p, 3))) + ek;
      if (p < 1) requestAnimationFrame(adim);
    })(basla);
  }, { threshold: 0.6 }).observe(el);
});

// 10) Teknoloji çubukları: görünür olunca dolar
document.querySelectorAll(".beceri").forEach(b => {
  new IntersectionObserver((girdiler, gozlem) => {
    if (!girdiler[0].isIntersecting) return;
    b.querySelector(".cubuk i").style.width = b.dataset.seviye + "%";
    gozlem.disconnect();
  }, { threshold: 0.5 }).observe(b);
});

// 11) Terminal animasyonu
const terminal = document.querySelector("#t-icerik");
if (terminal) {
  const satirlar = [
    { k: "whoami", c: "gokhan | devops & sysadmin" },
    { k: "kubectl get nodes", c: "master    Ready\nworker-1  Ready\nworker-2  Ready" },
    { k: "systemctl is-active nginx", c: "active" },
    { k: "echo $MOTTO", c: "Her gün biraz daha otomasyon." }
  ];
  const bekle = ms => new Promise(r => setTimeout(r, ms));

  (async function calistir() {
    while (true) {
      let gecmis = "";
      for (const s of satirlar) {
        for (let i = 0; i <= s.k.length; i++) {
          terminal.innerHTML = gecmis + '<span class="p">$</span> ' + s.k.slice(0, i) + '<span class="im">▋</span>';
          await bekle(55);
        }
        await bekle(300);
        gecmis += '<span class="p">$</span> ' + s.k + '\n<span class="o">' + s.c + '</span>\n';
        terminal.innerHTML = gecmis;
        await bekle(900);
      }
      await bekle(3000);
    }
  })();
}
