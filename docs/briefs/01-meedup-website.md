# Anweisungsblatt 01: Neue meedup-Website

## Ziel

Baue meedup.de komplett neu auf und hoste die Seite auf Cloudflare. Die alte Seite (GitHub Pages, Repo im Account `meedupinfo`) dient nur als Quelle für Branding, Impressum und Datenschutz. Alles andere wird neu geschrieben.

## Was meedup ist

meedup ist eine GbR (Schedi Samet und Lukas Jannik Achenbach). meedup verbindet Studierende mit echten Aufgaben aus Unternehmen. Der aktuelle Fokus:

1. Kostenlose Tools für Studierende bauen eine Community auf. Die ersten Tools sind der Nebenjobrechner, der Netzwerk-Tracker und zapply! by meedup.
2. Challenges im Hackathon-Format sind eines der Produkte und werden schrittweise eingeführt.
3. Unternehmen sind die zahlende Seite. Es gibt zwei Segmente:
   1. Gestandene Unternehmen, die mehr Sichtbarkeit für bestimmte Stellen brauchen.
   2. Innovationsfreudige Unternehmen, die besonders engagierte neue Teammitglieder für Lead-Positionen suchen.

## Rahmen für alle meedup-Projekte

1. Sichtbare Texte auf Deutsch. Studierende werden geduzt, Unternehmen gesiezt.
2. In allen sichtbaren Texten keine Gedankenstriche und keine Semikolons.
3. Kein Tracking, keine Cookies, keine externen Requests. Schriften liegen selbst gehostet im Repo, kein Google Fonts CDN.
4. Kein Framework und kein Build-Schritt. Reines HTML, CSS und Vanilla JS.
5. Mobile first. Muss ab 360 px Breite ohne horizontales Scrollen funktionieren.
6. Barrierearm: semantisches HTML, sichtbarer Fokus, Kontrast nach WCAG AA, Labels an allen Formularfeldern.
7. Erst einen kurzen Plan zeigen, dann umsetzen. Kleine Commits mit klaren Nachrichten.
8. Vor jeder Änderung an DNS, Domains oder Cloudflare-Einstellungen bei Schedi nachfragen.

## Repo und Struktur

Neues Repo `meedup-website` im GitHub-Account `meedupinfo`. Die Tools Nebenjobrechner und Netzwerk-Tracker liegen später als Unterordner im selben Repo und haben eigene Anweisungsblätter.

```
meedup-website/
├─ wrangler.jsonc
├─ docs/briefs/            Anweisungsblätter (diese Dateien)
└─ public/
   ├─ index.html
   ├─ studierende/index.html
   ├─ unternehmen/index.html
   ├─ ueber-uns/index.html
   ├─ kontakt/index.html
   ├─ impressum/index.html
   ├─ datenschutz/index.html
   ├─ 404.html
   ├─ robots.txt
   ├─ sitemap.xml
   ├─ nebenjobrechner/     siehe Anweisungsblatt 02
   ├─ netzwerk-tracker/    siehe Anweisungsblatt 03
   └─ assets/
      ├─ meedup.css        Design-Tokens und Basis-Styles, wird von allen Tools genutzt
      ├─ logo.svg
      └─ fonts/
```

Header und Footer werden in jeder Seite direkt eingefügt. Bei mehr als etwa acht Seiten auf einen Static-Site-Generator wechseln, vorher nicht.

## Seiten

1. **Start:** Klare Aussage, was meedup ist. Zwei Einstiege: „Für Studierende“ und „Für Unternehmen“. Die drei Tools als Karten.
2. **Für Studierende:** Tools, Challenges im Hackathon-Format, Community (Instagram und LinkedIn).
3. **Für Unternehmen:** Die zwei Segmente mit ihrem jeweiligen Problem, Ablauf einer Challenge, Kontakt-Aufruf. Servicegebühr und Preisgeld für Studierende werden immer als getrennte Posten beschrieben.
4. **Über uns:** Schedi und Lukas, Herkunft HAWK, Mission.
5. **Kontakt:** Formular mit Umschalter Unternehmen oder Partner. Felder: Name, E-Mail, Organisation, Nachricht, Pflicht-Checkbox zur Datenschutzerklärung.
6. **Impressum und Datenschutz:** Texte aus dem alten Repo unverändert übernehmen. Inhaltliche Änderungen nur nach Rücksprache.
7. **404:** Kurz, mit Link zur Startseite.

Tools, die noch nicht live sind, bekommen auf ihren Karten den Hinweis „Ab Januar 2027“ und keinen Link.

## Design

1. Farben, Logo und Schriften aus der alten Seite übernehmen und in `assets/meedup.css` als CSS-Variablen festlegen (`--meedup-primary`, `--meedup-bg`, `--meedup-text` usw.).
2. Hell- und Dunkelmodus über `prefers-color-scheme`.
3. Ruhig und klar. Keine Stock-Fotos, keine Animationen außer dezenten Hover-Effekten.

## Kontaktformular

Prüfe zuerst, wie das Formular auf der alten Seite verschickt wurde, und übernimm das, wenn es ohne Tracking funktioniert. Gibt es keinen sauberen Versand, schickt das Formular per `POST /api/kontakt` an ein kleines Worker-Skript `src/worker.js`, das die Daten serverseitig an die HubSpot Forms API weitergibt. Portal-ID und Formular-GUID erfragst du bei Schedi. Kein HubSpot-Skript im Browser.

Ohne Formular-Backend braucht das Projekt kein Worker-Skript, nur statische Assets.

## Deployment auf Cloudflare

1. Deployment als Cloudflare Worker mit Static Assets (`assets.directory = "./public"` in `wrangler.jsonc`).
2. Repo in Cloudflare unter Workers & Pages mit GitHub verbinden. Jeder Push auf `main` deployt automatisch.
3. Erst testen unter der `workers.dev`-Adresse.
4. Umzug der Domain, nur mit Schedi zusammen:
   1. In Cloudflare DNS die vier A-Records `185.199.108.153` bis `185.199.111.153` und den CNAME `www → meedupinfo.github.io` löschen.
   2. Im Worker unter Settings → Domains & Routes die Custom Domains `meedup.de` und `www.meedup.de` hinzufügen.
   3. Redirect Rule: `www.meedup.de/*` dauerhaft (301) auf `https://meedup.de/${1}`.
   4. Im alten GitHub-Repo die Custom Domain unter Settings → Pages entfernen.
5. **Nicht anfassen:** MX, SPF, DMARC, alle `_domainkey`-Einträge, `autodiscover`, Brevo-Code. Daran hängen die Mails.

## Abnahme

1. Alle Seiten laden unter meedup.de und www leitet auf meedup.de weiter.
2. Im Browser-Netzwerk-Tab gibt es keine Requests an fremde Domains.
3. Lighthouse auf Mobil: Performance, Barrierefreiheit, Best Practices und SEO jeweils mindestens 95.
4. Keine kaputten Links. Impressum und Datenschutz sind von jeder Seite im Footer erreichbar.
5. Testmail an eine @meedup.de-Adresse kommt nach dem Umzug an.
6. `sitemap.xml` und `robots.txt` sind erreichbar.
