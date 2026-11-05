// Werte für 2026. Jede Zahl mit Quelle und Prüfdatum. Anleitung: werte/README.md
const G = "2026-11-04";
const DRV_ZUT = "https://www.deutsche-rentenversicherung.de/Schwaben/DE/Presse-und-Fachinformationen/Experten/Zahlen-und-Tabellen/ZuT_2026_1.pdf";
const BANZ = "https://bundesanzeiger.de/pub/publication/tEVvKJtcxc4VdUgfyAg/content/tEVvKJtcxc4VdUgfyAg/BAnz%20AT%2018.12.2025%20B5.pdf?inline=";

export default {
  jahr: 2026,
  ampelGelbAb: { wert: 0.9, quelle: "meedup Anweisungsblatt 02: gelb ab 90 Prozent der Grenze", geprueft: G },

  // Sozialversicherung
  mindestlohn: { wert: 13.9, quelle: "https://www.gesetze-im-internet.de/milov5/BJNR10C0A0025.html", geprueft: G },
  minijobGrenze: { wert: 603, quelle: DRV_ZUT, geprueft: G },
  uebergangsbereichBis: { wert: 2000, quelle: "https://www.gesetze-im-internet.de/sgb_4/__20.html", geprueft: G },
  faktorF: { wert: 0.6619, quelle: BANZ, geprueft: G },
  rvSatz: { wert: 0.186, quelle: BANZ, geprueft: G },
  avSatz: { wert: 0.026, quelle: "https://www.gesetze-im-internet.de/sgb_3/__341.html", geprueft: G },
  kvSatz: { wert: 0.146, quelle: "https://www.gesetze-im-internet.de/sgb_5/__241.html", geprueft: G },
  kvZusatzbeitrag: { wert: 0.029, quelle: BANZ, geprueft: G, hinweis: "durchschnittlicher Zusatzbeitrag, deine Kasse kann abweichen" },
  pvSatz: { wert: 0.036, quelle: BANZ, geprueft: G },
  pvKinderlosZuschlag: { wert: 0.006, quelle: "https://www.gesetze-im-internet.de/sgb_11/__55.html", geprueft: G },
  pvKinderlosZuschlagAb: { wert: 23, quelle: "https://www.gesetze-im-internet.de/sgb_11/__55.html", geprueft: G },
  minijobRvPauschaleAG: { wert: 0.15, quelle: DRV_ZUT, geprueft: G },
  minijobRvMindestbemessung: { wert: 175, quelle: "https://www.minijob-zentrale.de/DE/meta/faq-bereich/rentenversicherung/53_beitrag_bei_rv-pflicht/faq_53_beitrag_bei_rv-pflicht.html", geprueft: G },
  kurzfristigMonate: { wert: 3, quelle: "https://www.gesetze-im-internet.de/sgb_4/__8.html", geprueft: G, hinweis: "oder 70 Arbeitstage im Kalenderjahr" },
  werkstudentStunden: { wert: 20, quelle: "https://www.deutsche-rentenversicherung.de/SharedDocs/Downloads/DE/Broschueren/national/tipps_fuer_studierende.pdf", geprueft: G },
  werkstudentWochen: { wert: 26, quelle: "https://www.deutsche-rentenversicherung.de/SharedDocs/Downloads/DE/Broschueren/national/tipps_fuer_studierende.pdf", geprueft: G },
  famVersGrenze: { wert: 565, quelle: "https://www.gkv-spitzenverband.de/media/dokumente/presse/zahlen_und_grafiken/20260101_Faktenblatt_Rechengroessen_Beitragsrecht.pdf", geprueft: G },
  famVersAlter: { wert: 25, quelle: "https://www.gesetze-im-internet.de/sgb_5/__10.html", geprueft: G },

  // Steuer
  arbeitnehmerPauschbetrag: { wert: 1230, quelle: "https://www.gesetze-im-internet.de/estg/__9a.html", geprueft: G },
  sonderausgabenPauschbetrag: { wert: 36, quelle: "https://www.gesetze-im-internet.de/estg/__10c.html", geprueft: G },
  vorsorgeHoechstbetrag: { wert: 1900, quelle: "https://www.gesetze-im-internet.de/estg/__39b.html", geprueft: G, hinweis: "Höchstbetrag für KV, PV und AV in der Vorsorgepauschale" },
  estTarif: {
    wert: {
      grundfreibetrag: 12348,
      zone2bis: 17799, z2a: 914.51, z2b: 1400,
      zone3bis: 69878, z3a: 173.1, z3b: 2397, z3c: 1034.87,
      linear: [{ bis: 277825, satz: 0.42, abzug: 11135.63 }, { bis: null, satz: 0.45, abzug: 19470.38 }],
    },
    quelle: "https://www.gesetze-im-internet.de/estg/__32a.html", geprueft: G,
  },

  // BAföG
  bafoegFreibetrag: { wert: 389, quelle: "https://www.recht.bund.de/eli/bund/bgbl-1/2025/279", geprueft: G, hinweis: "Bekanntmachung nach § 23 Abs. 6 BAföG, gilt ab 1.1.2026" },
  bafoegSozialpauschale: { wert: 0.223, quelle: "https://www.gesetze-im-internet.de/baf_g/__21.html", geprueft: G },
  bafoegSozialpauschaleMax: { wert: 17200, quelle: "https://www.gesetze-im-internet.de/baf_g/__21.html", geprueft: G, hinweis: "Euro im Jahr" },
  bafoegStipendiumFrei: { wert: 300, quelle: "https://www.gesetze-im-internet.de/baf_g/__21.html", geprueft: G, hinweis: "§ 21 Abs. 3 Satz 1 Nr. 2, begabungs- und leistungsabhängige Stipendien bis 300 Euro im Monatsdurchschnitt" },

  // Kindergeld
  kindergeldAlter: { wert: 25, quelle: "https://www.gesetze-im-internet.de/estg/__32.html", geprueft: G },
  kindergeldStunden: { wert: 20, quelle: "https://www.gesetze-im-internet.de/estg/__32.html", geprueft: G, hinweis: "§ 32 Abs. 4 Satz 3 EStG, gilt nach abgeschlossener Erstausbildung" },
  kindergeldUeberMonate: { wert: 2, quelle: "https://www.bzst.de/SharedDocs/Downloads/DE/Kindergeldberechtigte/da_kg_2024_randstrichfassung.pdf?__blob=publicationFile&v=2", geprueft: G, hinweis: "DA-KG A 20.3.1: höchstens zwei Monate über 20 Stunden, wenn der Jahresdurchschnitt bei höchstens 20 bleibt" },

  // Eigene Krankenversicherung im Studium
  kvdsBemessung: { wert: 855, quelle: "https://www.gkv-spitzenverband.de/media/dokumente/presse/zahlen_und_grafiken/20260101_Faktenblatt_Rechengroessen_Beitragsrecht.pdf", geprueft: "2026-11-05", hinweis: "§ 236 SGB V: BAföG-Bedarf 475 plus 380 Euro (§ 13 BAföG)" },
  kvdsSatzAnteil: { wert: 0.7, quelle: "https://www.gesetze-im-internet.de/sgb_5/__245.html", geprueft: "2026-11-05", hinweis: "sieben Zehntel des allgemeinen Beitragssatzes, Zusatzbeitrag der Kasse voll" },
  kvdsBisAlter: { wert: 30, quelle: "https://www.gesetze-im-internet.de/sgb_5/__5.html", geprueft: "2026-11-05", hinweis: "§ 5 Abs. 1 Nr. 9 SGB V, längstens bis zur Vollendung des 30. Lebensjahres" },
  kvSatzErmaessigt: { wert: 0.14, quelle: "https://www.gesetze-im-internet.de/sgb_5/__243.html", geprueft: "2026-11-05", hinweis: "ohne Krankengeldanspruch, gilt für freiwillig versicherte Studierende" },
  freiwilligMindestbemessung: { wert: 1318.33, quelle: "https://www.gkv-spitzenverband.de/media/dokumente/presse/zahlen_und_grafiken/20260101_Faktenblatt_Rechengroessen_Beitragsrecht.pdf", geprueft: "2026-11-05", hinweis: "§ 240 Abs. 4 SGB V, ein Neunzigstel der Bezugsgröße pro Tag" },

  // Krankenkassen, Zusatzbeitrag je Kasse (Anteil, nicht Prozent)
  krankenkassen: {
    wert: [
      { name: "Techniker Krankenkasse", zusatz: 0.0269, bereich: "bundesweit" },
      { name: "BARMER", zusatz: 0.0329, bereich: "bundesweit" },
      { name: "DAK-Gesundheit", zusatz: 0.032, bereich: "bundesweit" },
      { name: "KKH", zusatz: 0.0378, bereich: "bundesweit" },
      { name: "hkk", zusatz: 0.0259, bereich: "bundesweit" },
      { name: "HEK", zusatz: 0.0289, bereich: "bundesweit" },
      { name: "IKK classic", zusatz: 0.0385, bereich: "bundesweit" },
      { name: "IKK gesund plus", zusatz: 0.0339, bereich: "bundesweit" },
      { name: "BIG direkt gesund", zusatz: 0.0369, bereich: "bundesweit" },
      { name: "Mobil Krankenkasse", zusatz: 0.0389, bereich: "bundesweit" },
      { name: "Audi BKK", zusatz: 0.026, bereich: "bundesweit" },
      { name: "SBK", zusatz: 0.038, bereich: "bundesweit" },
      { name: "pronova BKK", zusatz: 0.037, bereich: "bundesweit" },
      { name: "VIACTIV", zusatz: 0.0419, bereich: "bundesweit" },
      { name: "Knappschaft", zusatz: 0.043, bereich: "bundesweit" },
      { name: "AOK PLUS", zusatz: 0.031, bereich: "Sachsen, Thüringen" },
      { name: "AOK Bayern", zusatz: 0.0269, bereich: "Bayern" },
      { name: "AOK Baden-Württemberg", zusatz: 0.0299, bereich: "Baden-Württemberg" },
      { name: "AOK Nordost", zusatz: 0.035, bereich: "Berlin, Brandenburg, Mecklenburg-Vorpommern" },
      { name: "AOK Niedersachsen", zusatz: 0.0298, bereich: "Niedersachsen" },
      { name: "AOK Rheinland/Hamburg", zusatz: 0.0329, bereich: "Hamburg, Nordrhein-Westfalen" },
      { name: "AOK NordWest", zusatz: 0.0299, bereich: "Nordrhein-Westfalen, Schleswig-Holstein" },
      { name: "AOK Hessen", zusatz: 0.0298, bereich: "Hessen" },
      { name: "AOK Rheinland-Pfalz/Saarland", zusatz: 0.0247, bereich: "Rheinland-Pfalz, Saarland" },
      { name: "AOK Bremen/Bremerhaven", zusatz: 0.0329, bereich: "Bremen" },
      { name: "AOK Sachsen-Anhalt", zusatz: 0.0289, bereich: "Sachsen-Anhalt" },
    ],
    quelle: "https://www.gkv-spitzenverband.de/krankenkassenliste.pdf", geprueft: "2026-11-05", hinweis: "Stand der Liste 05.11.2026. IKK classic bis 31.07.2026 3,40 Prozent",
  },

  // Stipendien
  studienkostenpauschale: { wert: 300, quelle: "https://www.bmftr.bund.de/SharedDocs/Downloads/DE/2026/begabtenfoerderung_zus_nebenbestimmungen_01.10.26.pdf?__blob=publicationFile", geprueft: G, hinweis: "ZNB I.2.2, einkommensunabhängig. Eigenes Einkommen mindert nach ZNB I.3 nur das Grundstipendium, nach §§ 21 bis 25 BAföG" },
  deutschlandstipendium: { wert: 300, quelle: "https://www.gesetze-im-internet.de/stipg/__5.html", geprueft: G },
};
