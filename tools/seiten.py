# Hält Head, Header und Footer aller Seiten in public/ einheitlich.
#
# Aufruf aus dem Repo:  python3 tools/seiten.py   (danach das Ergebnis committen)
#
# Seiteninhalte bearbeitet man direkt im HTML zwischen <main id="inhalt"> und </main>.
# Dieses Skript übernimmt pro Seite Titel, Beschreibung, Inhalt und alles nach </footer>
# (z. B. seitenspezifische Skripte) und baut den gemeinsamen Rahmen aus der Vorlage unten neu.
# Eigene Head-Zeilen einer Seite gehören zwischen <!-- seite-head --> und <!-- /seite-head -->.
# Die Seiten bleiben fertiges HTML, Cloudflare braucht keinen Build-Schritt.
import pathlib, re

PUB = pathlib.Path(__file__).resolve().parent.parent / "public"
BASE = "https://meedup.de"
LINKEDIN = "https://www.linkedin.com/company/meedup"
NAV = [("/studierende/", "Für Studierende"), ("/unternehmen/", "Für Unternehmen"),
       ("/ueber-uns/", "Über uns"), ("/kontakt/", "Kontakt")]
MARK = '<svg class="mark" aria-hidden="true" focusable="false"><use href="/assets/star.svg#s"/></svg>'


def render(path, p):
    cur = ' aria-current="page"'
    nav = "".join(f'<li><a href="{h}"{cur if path.startswith(h) else ""}>{t}</a></li>' for h, t in NAV)
    canonical = f'<link rel="canonical" href="{BASE}{path}">\n' if p["canonical"] else ""
    extra = f'<!-- seite-head -->\n{p["head"]}\n<!-- /seite-head -->\n' if p["head"] is not None else ""
    return f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{p["title"]}</title>
<meta name="description" content="{p["desc"]}">
{canonical}<meta name="theme-color" content="#eff4ee" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d1d35" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/assets/icon-32.png?v=2" sizes="32x32" type="image/png">
<link rel="icon" href="/assets/favicon.svg?v=2" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=2">
<link rel="preload" href="/assets/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/roboto-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/meedup.css">
{extra}<script>
// Bewegung: "motion" immer mit JS, "reduce" wenn das System weniger Bewegung wünscht. Fällt das Skript aus, bleibt alles sichtbar.
document.documentElement.classList.add("motion");
if (matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("reduce");
setTimeout(function () {{ if (!window.meedupMotion) document.documentElement.classList.remove("motion"); }}, 2500);
</script>
<script src="/assets/vendor/lenis.min.js" defer></script>
<script src="/assets/meedup.js" defer></script>
</head>
<body>
<a class="skip" href="#inhalt">Zum Inhalt springen</a>
<header class="site-header">
  <div class="wrap">
    <a class="logo" href="/" aria-label="meedup Startseite">{MARK}<img src="/assets/logo.png" alt="" width="480" height="118"></a>
    <nav aria-label="Hauptnavigation"><ul class="nav">{nav}</ul></nav>
  </div>
</header>
<main id="inhalt">
{p["main"]}
</main>
<footer class="site-footer">
  <svg class="star" data-speed="0.12" style="--s:420px;--o:.07;right:-120px;top:-140px" aria-hidden="true" focusable="false"><use href="/assets/star.svg#s"/></svg>
  <div class="wrap">
    <div>
      <a class="logo" href="/" aria-label="meedup Startseite">{MARK}<img src="/assets/logo.png" alt="" width="480" height="118" loading="lazy"></a>
      <p class="tagline">talent meets future</p>
    </div>
    <nav aria-label="Fußnavigation"><ul>
      <li><a href="/studierende/">Für Studierende</a></li>
      <li><a href="/impressum/">Impressum</a></li>
      <li><a href="/unternehmen/">Für Unternehmen</a></li>
      <li><a href="/datenschutz/">Datenschutz</a></li>
      <li><a href="/ueber-uns/">Über uns</a></li>
      <li><a href="{LINKEDIN}" rel="noopener">LinkedIn</a></li>
      <li><a href="/kontakt/">Kontakt</a></li>
    </ul></nav>
    <small>© 2026 meedup GbR</small>
  </div>
</footer>
{p["tail"]}</body>
</html>
"""


def parse(html, name):
    def grab(pattern):
        m = re.search(pattern, html, re.S)
        if not m:
            raise SystemExit(f"{name}: {pattern!r} nicht gefunden, Seite bitte von Hand prüfen")
        return m.group(1)
    head = re.search(r"<!-- seite-head -->\n(.*?)\n<!-- /seite-head -->", html, re.S)
    return {
        "title": grab(r"<title>(.*?)</title>"),
        "desc": grab(r'<meta name="description" content="(.*?)">'),
        "canonical": '<link rel="canonical"' in html,
        "head": head.group(1) if head else None,
        "main": grab(r'<main id="inhalt">\n(.*)\n</main>'),
        "tail": grab(r"</footer>\n(.*?)</body>"),
    }


for f in sorted(PUB.rglob("*.html")):
    rel = f.relative_to(PUB).as_posix()
    path = "/404" if rel == "404.html" else "/" + rel.removesuffix("index.html")
    old = f.read_text()
    new = render(path, parse(old, rel))
    assert render(path, parse(new, rel)) == new, f"{rel}: zweiter Lauf würde wieder ändern"
    if new != old:
        f.write_text(new)
        print("aktualisiert:", rel)
print("fertig")
