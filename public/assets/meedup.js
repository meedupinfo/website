// Bewegung im Stil von noho.ink: Wörter gleiten aus einer Maske, Blöcke blenden beim Scrollen ein,
// weiches Scrollen über Lenis, Header weicht beim Runterscrollen aus.
// Läuft nur, wenn das Inline-Skript im <head> die Klasse "motion" gesetzt hat (also ohne "Bewegung reduzieren").
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("motion")) return;
  window.meedupMotion = true;

  var STEP = 40; // ms Versatz pro Wort

  // Überschriften in Wortmasken zerlegen, Farbchips im Satz bekommen ihren Platz in der Reihenfolge
  document.querySelectorAll("h1, .big").forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var mask = document.createElement("span");
            var word = document.createElement("span");
            mask.className = "w";
            word.textContent = part;
            word.style.transitionDelay = i++ * STEP + "ms";
            mask.appendChild(word);
            frag.appendChild(mask);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.classList.contains("chip")) {
          n.style.transitionDelay = i++ * STEP + 200 + "ms";
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    })(el);
    el.classList.add("split");
  });

  // Einblenden beim Scrollen, Geschwister nacheinander
  var items = document.querySelectorAll(
    "h1, .big, .sub, .actions, .section-title, .lead, .tile:not(.empty), .panel, .facts li, .rows h3, .rows li, .faq details, .process li, form"
  );
  items.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (s) { return s.tagName === el.tagName; });
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 6) * 80 + "ms");
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -6% 0px" });
  // zwei Frames warten, damit der Startzustand gemalt ist und die Übergänge sicher laufen
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { items.forEach(function (el) { io.observe(el); }); });
  });

  // Weiches Scrollen
  if (window.Lenis) new window.Lenis({ autoRaf: true, anchors: true });

  // Header beim Runterscrollen ausblenden, beim Hochscrollen zeigen
  var header = document.querySelector(".site-header");
  var last = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    header.classList.toggle("away", y > last && y > 160);
    last = y;
  }, { passive: true });
})();
