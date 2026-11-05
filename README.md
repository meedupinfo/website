# meedup.de

Statische Website, reines HTML, CSS und Vanilla JS. Cloudflare liefert `public/` als Worker mit Static Assets aus (`wrangler.jsonc`). Jeder Push auf `main` geht live, andere Branches bekommen eine Vorschau unter `<branch>-website.meedupinfo.workers.dev`.

## Seiten bearbeiten

1. Inhalt direkt im HTML der Seite ändern, zwischen `<main id="inhalt">` und `</main>`.
2. Head, Header oder Footer nur in der Vorlage in `tools/seiten.py` ändern und danach für alle Seiten übernehmen:

```bash
python3 tools/seiten.py
```

Neue Seite: eine bestehende Seite kopieren, Titel, Beschreibung und Inhalt anpassen, dann das Skript laufen lassen. Eigene Head-Zeilen einer Seite gehören zwischen `<!-- seite-head -->` und `<!-- /seite-head -->`.

Anweisungsblätter liegen in `docs/briefs/`.
