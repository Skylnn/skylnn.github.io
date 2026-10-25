const KULLANICI = "Skylnn";
const REPO = "skylnn.github.io";

// Yazının başındaki --- ... --- bölümünü (başlık, tarih, özet) ayırır
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

async function yazilariGetir() {
  const onbellek = sessionStorage.getItem("yazilar");
  if (onbellek) return JSON.parse(onbellek);

  const r = await fetch(`https://api.github.com/repos/${KULLANICI}/${REPO}/contents/posts`);
  if (!r.ok) throw new Error("posts klasörü okunamadı");
  const dosyalar = (await r.json()).filter(f => f.name.endsWith(".md"));

  const yazilar = await Promise.all(dosyalar.map(async f => {
    const metin = await (await fetch(f.download_url)).text();
    const { meta } = ayir(metin);
    return { dosya: f.name, baslik: meta.title || f.name, tarih: meta.date || "", ozet: meta.summary || "" };
  }));

  yazilar.sort((a, b) => b.tarih.localeCompare(a.tarih)); // en yeni üstte
  sessionStorage.setItem("yazilar", JSON.stringify(yazilar));
  return yazilar;
}

// ---- blog.html: yazı listesi ----
const liste = document.querySelector("#liste");
if (liste) {
  yazilariGetir().then(yazilar => {
    const ciz = (dizi) => {
      liste.innerHTML = dizi.length ? dizi.map(y => `
        <article class="kart">
          <small>${y.tarih}</small>
          <h3>${y.baslik}</h3>
          <p>${y.ozet}</p>
          <a href="post.html?yazi=${encodeURIComponent(y.dosya)}">Oku →</a>
        </article>`).join("") : "Yazı bulunamadı.";
    };
    ciz(yazilar);
    document.querySelector("#ara").addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      ciz(yazilar.filter(y => (y.baslik + y.ozet).toLowerCase().includes(q)));
    });
  }).catch(() => liste.textContent = "Yazılar yüklenemedi.");
}

// ---- post.html: tek yazı ----
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
        document.title = (meta.title || "Yazı") + " | Gökhan";
        icerik.innerHTML = `<small>${meta.date || ""}</small><h1>${meta.title || ""}</h1>` + marked.parse(govde);
      })
      .catch(() => icerik.textContent = "Yazı yüklenemedi.");
  }
}
