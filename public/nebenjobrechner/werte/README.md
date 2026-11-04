# Werte für den Nebenjobrechner

Jede Zahl, mit der der Rechner arbeitet, steht in `werte/<jahr>.js`. `rechner.js` enthält keine Grenzen, Sätze oder Freibeträge. Jeder Eintrag hat diese Form:

```js
minijobGrenze: { wert: 603, quelle: "https://...", geprueft: "2026-11-04" }
```

Ist ein Wert noch nicht amtlich bestätigt (zum Beispiel weil die Verordnung fürs nächste Jahr erst als Entwurf vorliegt), bekommt er zusätzlich `unsicher: true` und einen kurzen `hinweis`. Die Seite zeigt dann einen Hinweis an.

## Jedes Jahr im Herbst (Oktober bis Dezember)

1. Datei kopieren: `cp werte/2027.js werte/2028.js` und darin `jahr` anpassen.
2. In `app.js` die neue Datei in der Liste `JAHRE` ergänzen.
3. Jeden Wert in der neuen Datei mit der angegebenen Quelle abgleichen, `wert` anpassen, `geprueft` auf das heutige Datum setzen und `unsicher` entfernen, wenn die Quelle endgültig ist.
4. Tests laufen lassen (siehe unten). Wenn sich Werte geändert haben, die Testfälle für das neue Jahr aus den amtlichen Beispielen der Quellen ergänzen.

## Was sich typischerweise wann ändert und wo es steht

| Wert | Wann | Quelle |
| --- | --- | --- |
| Mindestlohn | alle 2 Jahre (Beschluss Mindestlohnkommission im Juni) | bmas.de, Mindestlohnanpassungsverordnung |
| Minijob-Grenze | folgt dem Mindestlohn (§ 8 Abs. 1a SGB IV) | minijob-zentrale.de |
| Übergangsbereich, Faktor F | jedes Jahr im Dezember | minijob-zentrale.de, deutsche-rentenversicherung.de |
| Beitragssätze, durchschnittlicher Zusatzbeitrag | Bekanntmachung BMG Anfang November | bundesgesundheitsministerium.de, deutsche-rentenversicherung.de |
| Bezugsgröße, Grenze Familienversicherung | Sozialversicherungs-Rechengrößenverordnung (Oktober bis Dezember) | bmas.de, gkv-spitzenverband.de |
| Steuertarif § 32a EStG, Pauschbeträge | Gesetzgebung, meist im Dezember verkündet | gesetze-im-internet.de, bundesfinanzministerium.de |
| BAföG-Freibeträge und Sozialpauschalen | nur bei einer BAföG-Novelle, meist zum Wintersemester | gesetze-im-internet.de/baf_g, bafög.de |
| Kindergeld, Familienversicherung Altersgrenzen | selten | arbeitsagentur.de/familie-und-kinder, gesetze-im-internet.de/sgb_5/__10.html |
| Stipendien | bei Änderung der BMBF-Richtlinien | stipendiumplus.de, deutschlandstipendium.de |

## Tests

```bash
cd public/nebenjobrechner
node rechner.test.mjs
```

Ohne Ausgabe von Fehlern und mit der Zeile `alle Prüffälle grün` ist alles in Ordnung. Die erwarteten Zahlen in den Tests stammen aus den amtlichen Beispielen und Rechnern, die neben jedem Fall verlinkt sind, nicht aus dem eigenen Code. Neue Erwartungswerte also immer dort nachrechnen lassen.
