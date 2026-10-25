// 1) Tema düğmesi (seçimi hatırlar)
const html = document.documentElement;
const kayitli = localStorage.getItem("tema");
if (kayitli) html.dataset.theme = kayitli;

document.querySelector("#tema").addEventListener("click", () => {
  const yeni = html.dataset.theme === "dark" ? "light" : "dark";
  html.dataset.theme = yeni;
  localStorage.setItem("tema", yeni);
});

// 2) Daktilo efekti
const kelimeler = ["System Administrator", "Linux Meraklısı", "Kubernetes Öğrencisi"];
const alan = document.querySelector("#daktilo");
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

// 3) Kaydırınca beliren bölümler
const gozlemci = new IntersectionObserver((girdiler) => {
  girdiler.forEach(g => { if (g.isIntersecting) g.target.classList.add("gorunur"); });
}, { threshold: 0.15 });

document.querySelectorAll(".bolum, .kart").forEach(el => {
  el.classList.add("gizli");
  gozlemci.observe(el);
});
