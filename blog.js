const KULLANICI = "Skylnn";
const REPO = "skylnn.github.io";

// Metindeki özel karakterleri güvenli hâle getirir
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Yazının başındaki --- ... --- bölümünü (başlık, tarih, özet, etiket) ayırır
function ayir(metin) {
  metin = metin.replace(/\r\n/g, "\n");
  const m = metin.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, icerik: metin };
  const meta = {};
  m[1].split("\n").forEach(satir => {
    const i = satir.indexOf(":");
    if (i > 0) meta[satir.slice(0, i).trim()] = satir.slice(i + 1).trim().replace(/^"|"$/g, "");
  });
  return { meta, icerik: m[2] };
}

// "2026-10-25" -> Date (saat dilimi kaymasına karşı elle çözülür)
function tarihAl(t) {
  const [y, m, d] = String(t || "").split("-").map(Number);
  return y ? new Date(y, (m || 1) - 1, d || 1) : null;
}
const tamTarih = d => d ? d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "";

async function yazilariGetir() {
  // 2 dakika önbellek: yeni yazı eklenince çok beklemezsin
  const o = JSON.parse(sessionStorage.getItem("yazilar_v2") || "null");
  if (o && Date.now() - o.t < 120000) return o.veri;

  const r = await fetch(`https://api.github.com/repos/${KULLANICI}/${REPO}/contents/posts`);
  if (!r.ok) throw new Error("posts klasörü okunamadı");
  const dosyalar = (await r.json()).filter(f => f.name.endsWith(".md"));

  const yazilar = await Promise.all(dosyalar.map(async f => {
    const metin = await (await fetch(f.download_url)).text();
    const { meta, icerik: govde } = ayir(metin);
    return {
      dosya: f.name,
      baslik: meta.title || f.name,
      tarih: meta.date || "",
      ozet: meta.summary || "",
      etiketler: (meta.tags || "").split(",").map(s => s.trim()).filter(Boolean),
      okuma: Math.max(1, Math.round(govde.split(/\s+/).length / 200))
    };
  }));

  yazilar.sort((a, b) => b.tarih.localeCompare(a.tarih)); // en yeni üstte
  sessionStorage.setItem("yazilar_v2", JSON.stringify({ t: Date.now(), veri: yazilar }));
  return yazilar;
}

// ================= blog.html: liste + tarih cetveli =================
const liste = document.querySelector("#liste");
if (liste) {
  const cetvel = document.querySelector("#cetvel");
  const etiketKutu = document.querySelector("#etiketler");
  const sayac = document.querySelector("#sayac");
  const ara = document.querySelector("#ara");
  let hepsi = [], seciliEtiket = "", spy = null, reveal = null;

  function filtrele() {
    const q = ara.value.toLowerCase().trim();
    return hepsi.filter(y =>
      (!q || (y.baslik + " " + y.ozet + " " + y.etiketler.join(" ")).toLowerCase().includes(q)) &&
      (!seciliEtiket || y.etiketler.includes(seciliEtiket)));
  }

  function etiketleriCiz() {
    const say = {};
    hepsi.forEach(y => y.etiketler.forEach(t => say[t] = (say[t] || 0) + 1));
    const adlar = Object.keys(say).sort();
    etiketKutu.innerHTML = adlar.length
      ? `<button class="etk-btn${seciliEtiket ? "" : " secili"}" data-t="">Tümü</button>` +
        adlar.map(t => `<button class="etk-btn${t === seciliEtiket ? " secili" : ""}" data-t="${esc(t)}">#${esc(t)} <em>${say[t]}</em></button>`).join("")
      : "";
  }

  function ciz() {
    const dizi = filtrele();
    sayac.textContent = dizi.length + " yazı";
    if (spy) spy.disconnect();
    if (reveal) reveal.disconnect();

    if (!dizi.length) {
      liste.innerHTML = '<p class="bos">Yazı bulunamadı.</p>';
      cetvel.innerHTML = "";
      return;
    }

    // Yazıları aya göre grupla
    const aylar = new Map();
    dizi.forEach(y => {
      const d = tarihAl(y.tarih);
      const k = d ? d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") : "tarihsiz";
      if (!aylar.has(k)) aylar.set(k, {
        yil: d ? d.getFullYear() : "Tarihsiz",
        ad: d ? d.toLocaleDateString("tr-TR", { month: "long" }) : "Tarihsiz",
        yazilar: []
      });
      aylar.get(k).yazilar.push({ ...y, d });
    });

    const simdi = Date.now();
    const kimlik = y => "y-" + y.dosya.replace(/\W/g, "-");

    // Sağdaki zaman çizelgesi
    liste.innerHTML = [...aylar].map(([k, g]) => `
      <section class="ay" id="ay-${k}">
        <div class="ay-baslik">${g.ad} ${g.yil !== "Tarihsiz" ? g.yil : ""}<small>${g.yazilar.length} yazı</small></div>
        ${g.yazilar.map(y => {
          const yeni = y.d && (simdi - y.d) < 14 * 864e5;
          return `
          <div class="z-oge gizli" id="${kimlik(y)}">
            <span class="nokta"></span>
            <article class="kart">
              <div class="meta"><time>${tamTarih(y.d)}</time> · ${y.okuma} dk okuma${yeni ? ' <b class="yeni">Yeni</b>' : ""}</div>
              <h3>${esc(y.baslik)}</h3>
              <p>${esc(y.ozet)}</p>
              ${y.etiketler.length ? `<div class="etk">${y.etiketler.map(t => `<span>#${esc(t)}</span>`).join("")}</div>` : ""}
              <a href="post.html?yazi=${encodeURIComponent(y.dosya)}">Oku →</a>
            </article>
          </div>`;
        }).join("")}
      </section>`).join("");

    // Soldaki tarih cetveli: yıl > ay > gün
    const yillar = new Map();
    aylar.forEach((g, k) => {
      if (!yillar.has(g.yil)) yillar.set(g.yil, []);
      yillar.get(g.yil).push([k, g]);
    });
    cetvel.innerHTML = [...yillar].map(([yil, ayListe]) => `
      <div class="c-yil">${yil}</div>
      ${ayListe.map(([k, g]) => `
        <a class="c-ay" href="#ay-${k}" data-k="ay-${k}"><i></i><span>${g.ad}</span><em>${g.yazilar.length}</em></a>
        <div class="c-gunler">${g.yazilar.map(y => `<a href="#${kimlik(y)}" title="${esc(y.baslik)}">${y.d ? y.d.getDate() : "•"}</a>`).join("")}</div>`).join("")}`).join("");

    const ilk = cetvel.querySelector(".c-ay");
    if (ilk) ilk.classList.add("aktif");

    // Kaydırdıkça cetvelde bulunduğun ayı vurgula
    spy = new IntersectionObserver(girdiler => {
      girdiler.forEach(e => {
        if (e.isIntersecting) {
          cetvel.querySelectorAll(".c-ay").forEach(a => a.classList.toggle("aktif", a.dataset.k === e.target.id));
        }
      });
    }, { rootMargin: "-25% 0px -65% 0px" });
    liste.querySelectorAll(".ay").forEach(s => spy.observe(s));

    // Kartlar ekrana girince yavaşça belirsin
    reveal = new IntersectionObserver(girdiler => {
      girdiler.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("gorunur"); reveal.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    liste.querySelectorAll(".gizli").forEach(el => reveal.observe(el));
  }

  etiketKutu.addEventListener("click", e => {
    const b = e.target.closest(".etk-btn");
    if (!b) return;
    seciliEtiket = b.dataset.t;
    etiketleriCiz();
    ciz();
  });
  ara.addEventListener("input", ciz);

  yazilariGetir()
    .then(yazilar => { hepsi = yazilar; etiketleriCiz(); ciz(); })
    .catch(() => liste.textContent = "Yazılar yüklenemedi.");
}

// ================= post.html: tek yazı =================
const icerik = document.querySelector("#icerik");
if (icerik) {
  const dosya = new URLSearchParams(location.search).get("yazi");
  if (!dosya || !/^[\w.-]+\.md$/.test(dosya)) {
    icerik.textContent = "Yazı bulunamadı.";
  } else {
    fetch(`https://raw.githubusercontent.com/${KULLANICI}/${REPO}/main/posts/${dosya}`)
      .then(r => r.text())
      .then(metin => {
        const { meta, icerik: govde } = ayir(metin);
        const dk = Math.max(1, Math.round(govde.split(/\s+/).length / 200));
        const etk = (meta.tags || "").split(",").map(s => s.trim()).filter(Boolean);
        document.title = (meta.title || "Yazı") + " | Gökhan";
        icerik.innerHTML =
          `<small>${esc(tamTarih(tarihAl(meta.date)))} · ${dk} dk okuma</small>` +
          `<h1>${esc(meta.title || "")}</h1>` +
          (etk.length ? `<div class="etk">${etk.map(t => `<span>#${esc(t)}</span>`).join("")}</div>` : "") +
          marked.parse(govde);
      })
      .catch(() => icerik.textContent = "Yazı yüklenemedi.");
  }
}
