// Prüffälle. Start: node rechner.test.mjs
// Erwartete Werte stammen aus amtlichen Beispielen und Rechnern (Quelle je Fall), nicht aus diesem Code.
import assert from "node:assert/strict";
import { berechne, einkommensteuer, sozialabgaben, bafoegAnrechnung, studiBeitrag } from "./rechner.js";
import W from "./werte/2026.js";
import W27 from "./werte/2027.js";

const basis = {
  jobart: "minijob", modus: "monat", brutto: 0, stundenlohn: 0, stdVorlesung: 10, stdFerien: 10, ferienWochen: 20, monate: 2,
  alter: 21, rvBefreit: false, kv: "familie", kasse: "", kinder: false, kindergeld: false, erstausbildung: true,
  bafoeg: false, bafoegBetrag: 0, stipendium: "keins", grundstipendium: 0, studienkosten: 0, stipBetrag: 0,
};
const r = (x) => berechne({ ...basis, ...x }, W);
const ampel = (res, titel) => res.ampeln.find((a) => a.titel === titel)?.status;
let n = 0;
const fall = (name, fn) => { fn(); n++; console.log("ok", name); };

// Jeder Wert hat Quelle und Prüfdatum
fall("Werte vollständig", () => {
  for (const werte of [W, W27]) for (const [k, v] of Object.entries(werte)) {
    if (k === "jahr") continue;
    assert.ok(v.quelle && v.geprueft && "wert" in v, `${werte.jahr} ${k}`);
  }
});

// Steuer: BMF-Einkommensteuerrechner 2026, Grundtabelle (bmf-steuerrechner.de/ekst)
fall("ESt 2026 nach BMF-Rechner", () => {
  assert.equal(einkommensteuer(15000, W.estTarif.wert), 435);
  assert.equal(einkommensteuer(20000, W.estTarif.wert), 1570);
  assert.equal(einkommensteuer(12348, W.estTarif.wert), 0);
});

// 1. Minijob an der Grenze: DRV-Broschüre "Tipps für Studierende" 3/2026 S. 5, 603 Euro, AN-Anteil RV 21,71 Euro
fall("Minijob genau an der Grenze", () => {
  const x = r({ brutto: 603 });
  assert.equal(x.art, "minijob");
  assert.equal(x.sv.rv, 21.71);
  assert.equal(x.steuer.jahr, 0);
  assert.equal(x.netto.monat, 581.29);
  assert.equal(ampel(x, "Minijob-Grenze"), "gelb");
  assert.equal(ampel(x, "Familienversicherung"), "gelb");
  assert.equal(r({ brutto: 603, rvBefreit: true }).sv.rv, 0);
});
// 1 Euro darüber ist es ein Midijob (§ 8 Abs. 1a SGB IV). DRV Zahlen und Tabellen 1/2026 S. 13: AN-Bemessung bei 603,01 = 0,01
fall("Minijob 1 Euro über der Grenze", () => {
  const x = r({ brutto: 604 });
  assert.equal(x.art, "midijob");
  assert.equal(ampel(x, "Minijob-Grenze"), "rot");
  assert.equal(ampel(x, "Familienversicherung"), "rot");
  assert.equal(Math.round(sozialabgaben(603.01, "midijob", basis, W).basis * 100) / 100, 0.01);
});

// 2. Werkstudent: DRV-Broschüre "Tipps für Studierende" S. 7, 2.100 Euro bei 20 Stunden: nur RV, 9,3 % = 195,30 Euro
fall("Werkstudent 20 Stunden", () => {
  const x = r({ jobart: "werkstudent", brutto: 2100, stdVorlesung: 20, kv: "selbst" });
  assert.equal(x.art, "werkstudent");
  assert.deepEqual([x.sv.rv, x.sv.kv, x.sv.pv, x.sv.av], [195.3, 0, 0, 0]);
  assert.equal(ampel(x, "20-Stunden-Regel"), "gelb");
});
// 21 Stunden: Privileg weg, alle Zweige mit den amtlichen AN-Sätzen (BAnz AT 18.12.2025 B5):
// AV 1,3 % = 27,30. KV 7,3 % + 1,45 % = 183,75. PV 1,8 % = 37,80 (21 Jahre, kein Zuschlag)
fall("Werkstudent 21 Stunden", () => {
  const x = r({ jobart: "werkstudent", brutto: 2100, stdVorlesung: 21, kv: "selbst" });
  assert.equal(x.art, "midijob");
  assert.deepEqual([x.sv.rv, x.sv.av, x.sv.kv, x.sv.pv], [195.3, 27.3, 183.75, 37.8]);
  assert.equal(ampel(x, "20-Stunden-Regel"), "rot");
});
// Semesterferien zählen für die 26-Wochen-Regel mit (Rundschreiben GKV-SV, DRV, BA vom 23.11.2016)
fall("Werkstudent 26-Wochen-Regel", () => {
  assert.equal(r({ jobart: "werkstudent", brutto: 1500, stdVorlesung: 15, stdFerien: 35, ferienWochen: 20 }).art, "werkstudent");
  assert.equal(r({ jobart: "werkstudent", brutto: 1500, stdVorlesung: 15, stdFerien: 35, ferienWochen: 27 }).art, "midijob");
});

// 3. Midijob: DRV Zahlen und Tabellen 1/2026 S. 13 (Übergangsbereich-Tabelle)
fall("Midijob im Übergangsbereich", () => {
  const m700 = r({ jobart: "midijob", brutto: 700 });
  assert.equal(Math.round(m700.sv.basis * 100) / 100, 138.87);
  assert.equal(m700.sv.rv, 12.91);
  const m1000 = r({ jobart: "midijob", brutto: 1000 });
  assert.equal(Math.round(m1000.sv.basis * 100) / 100, 568.36);
  assert.equal(m1000.sv.rv, 52.86);
  // Mitte des Übergangsbereichs (603 bis 2.000): Tabellenwert 1.400 Euro, AN-Bemessung 1.141,02
  const m1400 = r({ jobart: "midijob", brutto: 1400 });
  assert.equal(Math.round(m1400.sv.basis * 100) / 100, 1141.02);
  assert.equal(ampel(m1400, "Obergrenze Übergangsbereich"), "gruen");
  // Kinderlosenzuschlag ab 23 auf die Gesamtbemessung 510,28 (DRV, Übergangsbereich): 0,6 % = 3,06 plus 1,8 % von 138,87 = 2,50
  assert.equal(r({ jobart: "midijob", brutto: 700, alter: 23 }).sv.pv, 5.56);
});

// 4. BAföG: Rechenweg der amtlichen Beispiele auf bafög.de (Werbungskosten 102,50, Sozialpauschale 22,3 %)
// mit Freibetrag 389 Euro ab 1.1.2026 (BGBl. 2025 I Nr. 279). Beispiel "Tobias" 960 Euro: 666,28 vor Freibetrag.
fall("BAföG Rechenweg amtliches Beispiel", () => {
  assert.equal(bafoegAnrechnung(960 * 12, 0, 0, W), 277.28);
});
// bafög.de: "BAföG-Geförderte dürfen bis zur Minijobgrenze hinzuverdienen", 603 Euro ab 2026
fall("BAföG knapp unter der Hinzuverdienstgrenze", () => {
  const x = r({ brutto: 603, bafoeg: true, bafoegBetrag: 992 });
  assert.equal(x.bafoeg.kuerzung, 0);
  assert.equal(x.bafoeg.bleibt, 992);
  assert.ok(x.bafoeg.grenze >= 603 && x.bafoeg.grenze < 604);
  assert.equal(ampel(x, "BAföG-Hinzuverdienst"), "gelb");
});
// 703 Euro: (703 - 102,50) mal 0,777 = 466,59, minus 389 = 77,59 Euro Anrechnung
fall("BAföG über der Hinzuverdienstgrenze", () => {
  const x = r({ jobart: "midijob", brutto: 703, bafoeg: true, bafoegBetrag: 992 });
  assert.equal(x.bafoeg.kuerzung, 77.59);
  assert.equal(x.bafoeg.bleibt, 914.41);
  assert.equal(ampel(x, "BAföG-Hinzuverdienst"), "rot");
});

// 5. Deutschlandstipendium + BAföG + Minijob. Deutschlandstipendium 300 Euro (§ 5 StipG), nicht aufs BAföG angerechnet
// (bafög.de Begabtenförderung). BAföG-Höchstsatz 992 Euro (bafög.de). Minijob 603 Euro netto 581,29 (DRV).
fall("Deutschlandstipendium plus BAföG plus Minijob", () => {
  const x = r({ brutto: 603, bafoeg: true, bafoegBetrag: 992, stipendium: "deutschland" });
  assert.equal(x.bafoeg.kuerzung, 0);
  assert.equal(x.stipendium.betrag, 300);
  assert.equal(x.gesamt, 1873.29);
});

// Begabtenförderungswerk: kein BAföG daneben (§ 2 Abs. 6 Nr. 2 BAföG), Studienkostenpauschale nie gekürzt (ZNB I.2.2)
fall("Begabtenförderungswerk", () => {
  const x = r({ jobart: "midijob", brutto: 703, bafoeg: true, bafoegBetrag: 500, stipendium: "begabt", grundstipendium: 400, studienkosten: 300 });
  assert.equal(x.bafoeg.bleibt, 0);
  assert.equal(x.stipendium.kuerzung, 77.59);
  assert.equal(x.stipendium.betrag, 622.41);
});

// Eigene Krankenversicherung: GKV-Spitzenverband Faktenblatt Rechengrößen 2026
// KV 87,38 Euro plus Zusatzbeitrag (855 mal 2,9 % = 24,80), PV 30,78 Euro, kinderlos 35,91 Euro.
// Freiwillig ab 30: BMG Beitragsseite, Mindestbemessung 1.318,33 Euro mal 16,9 % = 222,80 Euro KV.
fall("Selbst versichert im Studium", () => {
  assert.deepEqual(studiBeitrag(22, false, 0, 500, W), { kv: 87.38, pv: 30.78, summe: 118.16, studentisch: true });
  assert.equal(studiBeitrag(22, false, 0.029, 500, W).kv, 112.18);
  assert.equal(studiBeitrag(24, false, 0, 500, W).pv, 35.91);
  assert.equal(studiBeitrag(31, true, 0.029, 500, W).kv, 222.8);
});
// Ab 25 endet die Familienversicherung (§ 10 Abs. 2 Nr. 3 SGB V), der eigene Beitrag geht vom Gesamtbetrag ab
fall("Familienversicherung endet mit 25", () => {
  const jung = r({ brutto: 500, alter: 24 });
  assert.equal(jung.kv.selbst, false);
  const alt = r({ brutto: 500, alter: 25 });
  assert.equal(alt.kv.selbst, true);
  assert.equal(alt.kv.beitrag, 148.09);
  assert.equal(alt.gesamt, Math.round((jung.gesamt - 148.09) * 100) / 100);
  assert.equal(ampel(alt, "Familienversicherung"), "rot");
});
// Über der Einkommensgrenze endet sie auch: Werkstudent 700 Euro, (700 minus 102,50) über 565 Euro
fall("Familienversicherung endet über der Einkommensgrenze", () => {
  const x = r({ jobart: "werkstudent", brutto: 700, alter: 21 });
  assert.equal(x.kv.selbst, true);
  assert.equal(ampel(x, "Familienversicherung"), "rot");
  assert.equal(r({ jobart: "werkstudent", brutto: 660, alter: 21 }).kv.selbst, false);
  // Midijob: über den Job pflichtversichert, kein zusätzlicher Beitrag
  assert.equal(r({ jobart: "midijob", brutto: 1000, alter: 26 }).kv.beitrag, 0);
});
// Kindergeld gibt es nur bis 25 (§ 32 Abs. 4 EStG), darüber keine Kindergeld-Ampel
fall("Kindergeld nach Alter", () => {
  assert.equal(ampel(r({ kindergeld: true, alter: 24 }), "Kindergeld"), "gruen");
  assert.equal(ampel(r({ kindergeld: true, alter: 25 }), "Kindergeld"), undefined);
});

// Die Rechenkette der ersten Karte ergibt exakt die große Zahl, in allen Jobarten und Kombinationen
fall("Rechenkette summiert sich zur großen Zahl", () => {
  const faelle = [
    { brutto: 603 }, { brutto: 603, rvBefreit: true }, { brutto: 450, alter: 27 },
    { jobart: "midijob", brutto: 1234.56, alter: 24 }, { jobart: "werkstudent", brutto: 1900, stdVorlesung: 21, alter: 26, kasse: "hkk" },
    { jobart: "kurzfristig", brutto: 2100, monate: 3, alter: 25 },
    { brutto: 703, bafoeg: true, bafoegBetrag: 992, stipendium: "deutschland" },
    { jobart: "midijob", brutto: 703, bafoeg: true, bafoegBetrag: 500, stipendium: "begabt", grundstipendium: 400, studienkosten: 300 },
    { jobart: "werkstudent", modus: "stunde", stundenlohn: 17.3, stdVorlesung: 18, stdFerien: 35, ferienWochen: 12, stipendium: "sonstig", stipBetrag: 450, kv: "selbst" },
  ];
  for (const x of faelle) {
    const res = r(x);
    const posten = res.zeilen.filter((z) => !z.summe);
    const summe = Math.round(posten.reduce((a, z) => a + z.betrag * 100, 0)) / 100;
    assert.equal(summe, res.gesamt, JSON.stringify(x));
    const job = res.zeilen.slice(0, res.zeilen.findIndex((z) => z.summe));
    assert.equal(Math.round(job.reduce((a, z) => a + z.betrag * 100, 0)) / 100, res.zeilen.find((z) => z.summe).betrag);
    assert.ok(posten.every((z) => z.grund && z.ziel), "jede Zeile hat Grund und Sprungziel");
  }
});

// 2027: Minijob-Grenze 633 Euro (Minijob-Zentrale, 7.10.2026)
fall("2027 Minijob-Grenze", () => {
  assert.equal(berechne({ ...basis, brutto: 633 }, W27).art, "minijob");
  assert.equal(berechne({ ...basis, brutto: 634 }, W27).art, "midijob");
});

console.log(`alle Prüffälle grün (${n})`);
