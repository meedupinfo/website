// Werte für 2027. Jede Zahl mit Quelle und Prüfdatum. Anleitung: werte/README.md
// Regel für unsichere Werte: Bei reinen Gesetzentwürfen steht hier das geltende Recht, der Entwurfswert im hinweis.
// Im Dezember 2026 alle Einträge mit unsicher: true erneut prüfen.
const G = "2026-11-04";
const ENTWURF_EST = "https://dserver.bundestag.de/btd/21/082/2108235.pdf";
const RECHENGR = "https://www.bmas.de/DE/Service/Presse/Pressemitteilungen/2026/bundeskabinett-beschliesst-sozialversicherungsrechengroessen-2027.html";

export default {
  jahr: 2027,
  ampelGelbAb: { wert: 0.9, quelle: "meedup Anweisungsblatt 02: gelb ab 90 Prozent der Grenze", geprueft: G },

  // Sozialversicherung
  mindestlohn: { wert: 14.6, quelle: "https://www.gesetze-im-internet.de/milov5/BJNR10C0A0025.html", geprueft: G },
  minijobGrenze: { wert: 633, quelle: "https://magazin.minijob-zentrale.de/minijob-grenze-2027/", geprueft: G },
  uebergangsbereichBis: { wert: 2000, quelle: "https://www.gesetze-im-internet.de/sgb_4/__20.html", geprueft: G },
  faktorF: { wert: 0.6619, quelle: "https://www.gesetze-im-internet.de/sgb_4/__20.html", geprueft: G, unsicher: true, hinweis: "BMAS gibt F für 2027 bis 31.12.2026 bekannt. 0,6619 = 28 / 42,3, gilt nur, wenn alle Beitragssätze gleich bleiben" },
  rvSatz: { wert: 0.186, quelle: "https://www.deutsche-rentenversicherung.de/DRV/DE/Experten/Zahlen-und-Fakten/Werte-der-Rentenversicherung/werte-der-rentenversicherung_node.html", geprueft: G, unsicher: true, hinweis: "18,6 Prozent nur laut Entwurf Rentenversicherungsbericht 2026, Verordnung steht aus" },
  avSatz: { wert: 0.026, quelle: "https://www.gesetze-im-internet.de/sgb_3/__341.html", geprueft: G },
  kvSatz: { wert: 0.146, quelle: "https://www.gesetze-im-internet.de/sgb_5/__241.html", geprueft: G },
  kvZusatzbeitrag: { wert: 0.029, quelle: "https://www.bundesgesundheitsministerium.de/presse/pressemitteilungen/zusatzbeitragssatz-gkv-2027-festgelegt", geprueft: G, hinweis: "durchschnittlicher Zusatzbeitrag, deine Kasse kann abweichen" },
  pvSatz: { wert: 0.036, quelle: "https://www.gesetze-im-internet.de/sgb_11/__55.html", geprueft: G, unsicher: true, hinweis: "keine Änderung angekündigt, Pflegeneuordnungsgesetz noch nicht beschlossen" },
  pvKinderlosZuschlag: { wert: 0.006, quelle: "https://www.gesetze-im-internet.de/sgb_11/__55.html", geprueft: G, unsicher: true, hinweis: "Entwurf Pflegeneuordnungsgesetz (BT-Drs. 21/8869) plant 0,9 Prozent ab 1.1.2027" },
  pvKinderlosZuschlagAb: { wert: 23, quelle: "https://www.gesetze-im-internet.de/sgb_11/__55.html", geprueft: G },
  minijobRvPauschaleAG: { wert: 0.15, quelle: "https://www.gesetze-im-internet.de/sgb_6/__172.html", geprueft: G },
  minijobRvMindestbemessung: { wert: 175, quelle: "https://www.minijob-zentrale.de/DE/meta/faq-bereich/rentenversicherung/53_beitrag_bei_rv-pflicht/faq_53_beitrag_bei_rv-pflicht.html", geprueft: G },
  kurzfristigMonate: { wert: 3, quelle: "https://www.gesetze-im-internet.de/sgb_4/__8.html", geprueft: G, hinweis: "oder 70 Arbeitstage im Kalenderjahr" },
  werkstudentStunden: { wert: 20, quelle: "https://www.deutsche-rentenversicherung.de/SharedDocs/Downloads/DE/Broschueren/national/tipps_fuer_studierende.pdf", geprueft: G },
  werkstudentWochen: { wert: 26, quelle: "https://www.deutsche-rentenversicherung.de/SharedDocs/Downloads/DE/Broschueren/national/tipps_fuer_studierende.pdf", geprueft: G },
  famVersGrenze: { wert: 590, quelle: RECHENGR, geprueft: G, unsicher: true, hinweis: "ein Siebtel der Bezugsgröße 4.130 Euro laut Kabinettsbeschluss vom 7.10.2026, Zustimmung Bundesrat steht aus" },
  famVersAlter: { wert: 25, quelle: "https://www.gesetze-im-internet.de/sgb_5/__10.html", geprueft: G },

  // Steuer
  arbeitnehmerPauschbetrag: { wert: 1230, quelle: "https://www.gesetze-im-internet.de/estg/__9a.html", geprueft: G, unsicher: true, hinweis: "geltendes Recht. Entwurf Einkommensteuerreformgesetz 2027 (BT-Drs. 21/8235) plant 1.430 Euro" },
  sonderausgabenPauschbetrag: { wert: 36, quelle: "https://www.gesetze-im-internet.de/estg/__10c.html", geprueft: G },
  vorsorgeHoechstbetrag: { wert: 1900, quelle: "https://www.gesetze-im-internet.de/estg/__39b.html", geprueft: G, hinweis: "Höchstbetrag für KV, PV und AV in der Vorsorgepauschale" },
  estTarif: {
    wert: {
      grundfreibetrag: 12348,
      zone2bis: 17799, z2a: 914.51, z2b: 1400,
      zone3bis: 69878, z3a: 173.1, z3b: 2397, z3c: 1034.87,
      linear: [{ bis: 277825, satz: 0.42, abzug: 11135.63 }, { bis: null, satz: 0.45, abzug: 19470.38 }],
    },
    quelle: "https://www.gesetze-im-internet.de/estg/__32a.html", geprueft: G, unsicher: true,
    hinweis: "geltender Tarif ab 2026. Entwurf 2027 (" + ENTWURF_EST + "): Grundfreibetrag 12.564, Zone 2 bis 17.799 mit 952,24 und 1.400, Zone 3 bis 70.600 mit 170,74, 2.397 und 993,86, dann 0,42 x minus 11.241,73 bis 249.999, 0,45 x minus 18.741,70 bis 279.999, 0,47 x minus 24.341,68",
  },

  // BAföG
  bafoegFreibetrag: { wert: 413, quelle: "https://www.gesetze-im-internet.de/baf_g/__23.html", geprueft: G, unsicher: true, hinweis: "Bekanntmachung nach § 23 Abs. 6 steht aus. (633 minus 1.230/12) mal 0,777, aufgerundet. Mit Arbeitnehmer-Pauschbetrag 1.430 aus dem Steuerentwurf wären es 400" },
  bafoegSozialpauschale: { wert: 0.223, quelle: "https://www.gesetze-im-internet.de/baf_g/__21.html", geprueft: G },
  bafoegSozialpauschaleMax: { wert: 17200, quelle: "https://www.gesetze-im-internet.de/baf_g/__21.html", geprueft: G, hinweis: "Euro im Jahr" },
  bafoegStipendiumFrei: { wert: 300, quelle: "https://www.gesetze-im-internet.de/baf_g/__21.html", geprueft: G, hinweis: "§ 21 Abs. 3 Satz 1 Nr. 2, begabungs- und leistungsabhängige Stipendien bis 300 Euro im Monatsdurchschnitt" },

  // Kindergeld
  kindergeldAlter: { wert: 25, quelle: "https://www.gesetze-im-internet.de/estg/__32.html", geprueft: G },
  kindergeldStunden: { wert: 20, quelle: "https://www.gesetze-im-internet.de/estg/__32.html", geprueft: G, hinweis: "§ 32 Abs. 4 Satz 3 EStG, gilt nach abgeschlossener Erstausbildung" },
  kindergeldUeberMonate: { wert: 2, quelle: "https://www.bzst.de/SharedDocs/Downloads/DE/Kindergeldberechtigte/da_kg_2024_randstrichfassung.pdf?__blob=publicationFile&v=2", geprueft: G, hinweis: "DA-KG A 20.3.1: höchstens zwei Monate über 20 Stunden, wenn der Jahresdurchschnitt bei höchstens 20 bleibt" },

  // Stipendien
  studienkostenpauschale: { wert: 300, quelle: "https://www.bmftr.bund.de/SharedDocs/Downloads/DE/2026/begabtenfoerderung_zus_nebenbestimmungen_01.10.26.pdf?__blob=publicationFile", geprueft: G, hinweis: "ZNB I.2.2, einkommensunabhängig. Eigenes Einkommen mindert nach ZNB I.3 nur das Grundstipendium, nach §§ 21 bis 25 BAföG" },
  deutschlandstipendium: { wert: 300, quelle: "https://www.gesetze-im-internet.de/stipg/__5.html", geprueft: G },
};
