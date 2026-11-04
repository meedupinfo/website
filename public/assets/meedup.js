// Bewegung für meedup.de. Das Inline-Skript im <head> setzt "motion" und bei "Bewegung reduzieren" zusätzlich "reduce".
// Volle Variante: Wortmasken, Gleiten beim Scrollen, Parallax-Sterne, weiches Scrollen, ausweichender Header.
// Sanfte Variante (.reduce): nur Einblenden ohne Bewegung.
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("motion")) return;
  window.meedupMotion = true;
  var reduce = root.classList.contains("reduce");
  var slice = Array.prototype.slice;

  // Überschriften in Wortmasken zerlegen (nur volle Variante)
  if (!reduce) {
    document.querySelectorAll("h1, .big").forEach(function (el) {
      var i = 0;
      (function walk(node) {
        slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var mask = document.createElement("span");
              var word = document.createElement("span");
              mask.className = "w";
              word.textContent = part;
              word.style.transitionDelay = i++ * 40 + "ms";
              mask.appendChild(word);
              frag.appendChild(mask);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1) {
            walk(n);
          }
        });
      })(el);
      el.classList.add("split");
    });
  }

  // Einblenden beim Scrollen, Geschwister nacheinander
  var items = slice.call(document.querySelectorAll("h1, .big, .rv"));
  document.querySelectorAll(".rv").forEach(function (el) {
    var sibs = slice.call(el.parentNode.children).filter(function (s) { return s.classList.contains("rv"); });
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 5) * 90 + "ms");
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -6% 0px" });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { items.forEach(function (el) { io.observe(el); }); });
  });

  if (reduce) return;

  // Weiches Scrollen
  if (window.Lenis) new window.Lenis({ autoRaf: true, anchors: true });

  // Parallax: Sterne bewegen sich je nach data-speed gegen die Scrollrichtung und drehen sich leicht
  var stars = slice.call(document.querySelectorAll(".star[data-speed]"));
  var header = document.querySelector(".site-header");
  var last = window.scrollY;
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    stars.forEach(function (s) {
      var r = s.parentNode.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var off = (r.top + r.height / 2 - vh / 2) * parseFloat(s.dataset.speed);
      s.style.transform = "translate3d(0," + off.toFixed(1) + "px,0) rotate(" + (off * 0.08).toFixed(2) + "deg)";
    });
  }
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    header.classList.toggle("away", y > last && y > 160);
    last = y;
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  frame();
})();
