// Reine Rechenlogik ohne DOM. Kennt keine festen Zahlen: jede Grenze, jeder Satz und jeder
// Freibetrag kommt aus dem Werte-Objekt (werte/<jahr>.js). 52 Wochen und 12 Monate sind Kalender.

const cent = (x) => Math.round(x * 100) / 100;
const eur = (x) => x.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

// § 32a Abs. 1 EStG. Tarif aus den Werten, zvE und Steuer auf volle Euro abgerundet.
export function einkommensteuer(zvE, t) {
  const x = Math.floor(zvE);
  if (x <= t.grundfreibetrag) return 0;
  if (x <= t.zone2bis) { const y = (x - t.grundfreibetrag) / 10000; return Math.floor((t.z2a * y + t.z2b) * y); }
  if (x <= t.zone3bis) { const z = (x - t.zone2bis) / 10000; return Math.floor((t.z3a * z + t.z3b) * z + t.z3c); }
  // lineare Zonen, die letzte hat bis: null
  const z = t.linear.find((l) => l.bis === null || x <= l.bis);
  return Math.floor(z.satz * x - z.abzug);
}

// Arbeitnehmeranteile Sozialversicherung pro Monat. art ist die tatsächliche Einordnung (siehe einordnen).
export function sozialabgaben(brutto, art, e, W) {
  const w = (k) => W[k].wert;
  const G = w("minijobGrenze");
  const OG = w("uebergangsbereichBis");
  const ab = { rv: 0, kv: 0, pv: 0, av: 0, basis: 0 };
  if (art === "kurzfristig") return ab;
  if (art === "minijob") {
    if (e.rvBefreit) return ab;
    // unter der Mindestbemessungsgrundlage zahlt der Minijobber die Differenz zum vollen Beitrag
    const gesamt = cent(Math.max(brutto, w("minijobRvMindestbemessung")) * w("rvSatz"));
    return { ...ab, rv: cent(gesamt - cent(brutto * w("minijobRvPauschaleAG"))) };
  }
  // Übergangsbereich, § 20 Abs. 2a SGB IV
  const imUeb = brutto > G && brutto <= OG;
  const basis = imUeb ? (OG / (OG - G)) * (brutto - G) : brutto;
  const rv = cent(basis * w("rvSatz") / 2);
  if (art === "werkstudent") return { ...ab, rv, basis };
  // Kinderlosenzuschlag trägt der Arbeitnehmer allein, im Übergangsbereich auf die Gesamtbemessung mit Faktor F
  const F = w("faktorF");
  const basisGesamt = imUeb ? F * G + (OG / (OG - G) - (G / (OG - G)) * F) * (brutto - G) : brutto;
  const kinderlos = !e.kinder && e.alter >= w("pvKinderlosZuschlagAb");
  return {
    basis, rv,
    av: cent(basis * w("avSatz") / 2),
    kv: cent(basis * (w("kvSatz") + w("kvZusatzbeitrag")) / 2),
    pv: cent(basis * w("pvSatz") / 2 + (kinderlos ? basisGesamt * w("pvKinderlosZuschlag") : 0)),
  };
}

// Durchschnittliches Monatsbrutto (bei kurzfristig: pro Arbeitsmonat) und Jahresbrutto
export function verdienst(e) {
  const kurz = e.jobart === "kurzfristig";
  let monat = e.brutto;
  if (e.modus === "stunde") {
    const stundenJahr = kurz ? e.stdVorlesung * 52 : e.stdVorlesung * (52 - e.ferienWochen) + e.stdFerien * e.ferienWochen;
    monat = (e.stundenlohn * stundenJahr) / 12;
  }
  return { monat: cent(monat), jahr: cent(monat * (kurz ? e.monate : 12)) };
}

// Wochen im Jahr mit mehr als 20 Stunden, Semesterferien zählen mit (Rundschreiben Studenten 2016)
function wochenUeber(e, grenze) {
  return (e.stdVorlesung > grenze ? 52 - e.ferienWochen : 0) + (e.stdFerien > grenze ? e.ferienWochen : 0);
}

// Welche Regeln gelten wirklich? Gewählte Jobart kann durch Verdienst oder Stunden kippen.
export function einordnen(e, brutto, W) {
  const w = (k) => W[k].wert;
  let art = e.jobart;
  if (art === "kurzfristig" && e.monate > w("kurzfristigMonate")) art = "minijob";
  if (art === "werkstudent" && (e.stdVorlesung > w("werkstudentStunden") || wochenUeber(e, w("werkstudentStunden")) > w("werkstudentWochen"))) art = "midijob";
  if (art === "minijob" && brutto > w("minijobGrenze")) art = "midijob";
  // Midijob oder Werkstudent bis zur Minijob-Grenze ist sozialversicherungsrechtlich ein Minijob
  if ((art === "midijob" || art === "werkstudent") && brutto <= w("minijobGrenze")) art = "minijob";
  return art;
}

function job(e, W) {
  const w = (k) => W[k].wert;
  const v = verdienst(e);
  const art = einordnen(e, v.monat, W);
  const sv = sozialabgaben(v.monat, art, { ...e, rvBefreit: e.rvBefreit && e.jobart === "minijob" }, W);
  const svMonat = cent(sv.rv + sv.kv + sv.pv + sv.av);
  const monate = e.jobart === "kurzfristig" ? e.monate : 12;

  // ponytail: Jahresnäherung statt BMF-Programmablaufplan, PAP umsetzen falls monatliche Lohnsteuer exakt gebraucht wird
  let steuerJahr = 0;
  if (art !== "minijob") {
    const vorsorge = (sv.rv + Math.min(w("vorsorgeHoechstbetrag") / monate, sv.kv + sv.pv + sv.av)) * monate;
    const zvE = Math.max(0, v.jahr - w("arbeitnehmerPauschbetrag") - w("sonderausgabenPauschbetrag") - vorsorge);
    steuerJahr = einkommensteuer(zvE, w("estTarif"));
  }
  const nettoJahr = cent(v.jahr - svMonat * monate - steuerJahr);
  return {
    art, brutto: v, sv, svMonat, monate,
    steuer: { jahr: steuerJahr, monat: cent(steuerJahr / monate) },
    netto: { monat: cent(v.monat - svMonat - steuerJahr / monate), jahr: nettoJahr, schnitt: cent(nettoJahr / 12) },
  };
}

// Anrechenbares Einkommen pro Monat nach §§ 21 bis 23 BAföG (gilt auch für das Grundstipendium, ZNB I.3)
export function bafoegAnrechnung(jahrBrutto, steuerJahr, stipendiumMonat, W) {
  const w = (k) => W[k].wert;
  const einkuenfte = Math.max(0, jahrBrutto - w("arbeitnehmerPauschbetrag"));
  const sozial = Math.min(einkuenfte * w("bafoegSozialpauschale"), w("bafoegSozialpauschaleMax"));
  // shortcut: Stipendium über 300 Euro zählt hier mit in den Freibetrag, Sonderfälle nach § 23 Abs. 4 BAföG nicht abgebildet
  const monat = (einkuenfte - steuerJahr - sozial) / 12 + Math.max(0, stipendiumMonat - w("bafoegStipendiumFrei"));
  return Math.max(0, cent(monat - w("bafoegFreibetrag")));
}

// Höchstes Monatsbrutto ohne Anrechnung, per Halbierung (Anrechnung steigt mit dem Brutto)
function grenzeOhneAnrechnung(e, W, stipendiumMonat) {
  let lo = 0, hi = 20000;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const j = job({ ...e, modus: "monat", brutto: mid }, W);
    if (bafoegAnrechnung(j.brutto.jahr, j.steuer.jahr, stipendiumMonat, W) > 0) hi = mid; else lo = mid;
  }
  return Math.floor(lo * 100) / 100;
}

// Monatsbeitrag der eigenen Kranken- und Pflegeversicherung im Studium.
// Bis zur Altersgrenze der studentischen KV (§ 236, § 245 SGB V), danach freiwillig (§ 240 Abs. 4 SGB V).
export function studiBeitrag(alter, kinder, zusatz, brutto, W) {
  const w = (k) => W[k].wert;
  const zuschlag = !kinder && alter >= w("pvKinderlosZuschlagAb") ? w("pvKinderlosZuschlag") : 0;
  const studentisch = alter < w("kvdsBisAlter");
  // shortcut: freiwillig zählt hier nur der Nebenjob als Einnahme, weitere Einnahmen fehlen
  const basis = studentisch ? w("kvdsBemessung") : Math.max(w("freiwilligMindestbemessung"), brutto);
  const kv = cent(basis * ((studentisch ? w("kvSatz") * w("kvdsSatzAnteil") : w("kvSatzErmaessigt")) + zusatz));
  const pv = cent(basis * (w("pvSatz") + zuschlag));
  return { kv, pv, summe: cent(kv + pv), studentisch };
}

// Familienversicherung prüfen. Wer nicht (mehr) familienversichert ist und nicht über den Job
// pflichtversichert ist, zahlt den eigenen Beitrag, der vom Gesamtbetrag abgeht.
export function krankenversicherung(e, j, W) {
  const w = (k) => W[k].wert;
  const q = (k) => W[k].quelle;
  const kassen = w("krankenkassen");
  const kasse = kassen.find((k) => k.name === e.kasse);
  const zusatz = kasse ? kasse.zusatz : w("kvZusatzbeitrag");
  const b = j.brutto.monat;
  const ueberJob = j.art === "midijob";
  const zuAlt = e.alter >= w("famVersAlter");
  const minijob = j.art === "minijob";
  const grenze = minijob ? w("minijobGrenze") : w("famVersGrenze");
  const einkommen = minijob ? b : Math.max(0, j.brutto.jahr - w("arbeitnehmerPauschbetrag")) / 12;
  const familie = e.kv === "familie" && !zuAlt && !ueberJob && einkommen <= grenze;
  const selbst = !ueberJob && !familie;
  const beitrag = selbst ? studiBeitrag(e.alter, e.kinder, zusatz, b, W) : null;
  const preis = beitrag ? ` Im Studium kostet dich das ${kasse ? "bei der " + kasse.name : "im Schnitt"} etwa ${eur(beitrag.summe)} im Monat.` : "";
  const vergleich = selbst ? kassen.map((k) => ({ name: k.name, bereich: k.bereich, zusatz: k.zusatz, summe: studiBeitrag(e.alter, e.kinder, k.zusatz, b, W).summe })).sort((a, c) => a.summe - c.summe) : [];

  let ampel = null;
  if (e.kv === "familie" || zuAlt) {
    const gelbAb = w("ampelGelbAb");
    let status = einkommen > grenze ? "rot" : einkommen >= grenze * gelbAb ? "gelb" : "gruen";
    let text = minijob ? `Mit einem Minijob bis ${eur(grenze)} bleibst du familienversichert.`
      : `Dein Einkommen nach Werbungskosten liegt bei ${eur(einkommen)} im Monat. Die Grenze ist ${eur(grenze)}.`;
    if (zuAlt) { status = "rot"; text = `Ab ${w("famVersAlter")} endet die Familienversicherung und du musst dich selbst versichern. Ein Freiwilligendienst verlängert sie um seine Dauer.`; }
    else if (ueberJob) { status = "rot"; text = "Mit diesem Job bist du über den Job pflichtversichert. Die Familienversicherung endet, der Beitrag steht schon oben in den Abgaben."; }
    else if (einkommen > grenze) text += " Darüber endet die Familienversicherung und du musst dich selbst versichern.";
    else if (e.alter === w("famVersAlter") - 1 && status === "gruen") { status = "gelb"; text += ` Mit ${w("famVersAlter")} endet sie.`; }
    ampel = { titel: "Familienversicherung", status, text: text + (status === "rot" && !ueberJob ? preis : ""), quelle: q(zuAlt ? "famVersAlter" : minijob ? "minijobGrenze" : "famVersGrenze") };
  }
  return { ampel, familie, selbst, ueberJob, beitrag: beitrag ? beitrag.summe : 0, detail: beitrag, kasse: kasse ? kasse.name : null, vergleich, quelle: q("kvdsBemessung") };
}

export function berechne(e, W) {
  const w = (k) => W[k].wert;
  const q = (k) => W[k].quelle;
  const gelbAb = w("ampelGelbAb");
  const ampel = (ist, grenze) => (ist > grenze ? "rot" : ist >= grenze * gelbAb ? "gelb" : "gruen");
  const j = job(e, W);
  const b = j.brutto.monat;
  const G = w("minijobGrenze");
  const OG = w("uebergangsbereichBis");
  const ampeln = [];

  // 1. Minijob-Grenze
  if (e.jobart === "minijob") {
    ampeln.push({ titel: "Minijob-Grenze", status: ampel(b, G), quelle: q("minijobGrenze"),
      text: b > G ? `Mit ${eur(b)} liegst du über ${eur(G)}. Das ist kein Minijob mehr, sondern ein Midijob mit eigenen Sozialabgaben.`
        : `Bis ${eur(G)} im Monatsdurchschnitt bleibt es ein Minijob. Dir bleiben noch ${eur(G - b)}.` });
  }
  // 2. Obergrenze Übergangsbereich
  if (e.jobart === "midijob" || (e.jobart === "werkstudent" && b > G)) {
    ampeln.push({ titel: "Obergrenze Übergangsbereich", status: ampel(b, OG), quelle: q("uebergangsbereichBis"),
      text: b <= G ? `Bis ${eur(G)} ist dein Job ein Minijob, kein Midijob. So wird er hier auch gerechnet.`
        : b > OG ? `Über ${eur(OG)} gibt es keine reduzierten Beiträge mehr. Du zahlst den vollen Anteil.`
        : `Zwischen ${eur(G + 0.01)} und ${eur(OG)} zahlst du reduzierte Beiträge. Je näher an ${eur(OG)}, desto weniger Ersparnis.` });
  }
  // 3. 20-Stunden-Regel Werkstudent
  if (e.jobart === "werkstudent") {
    const std = w("werkstudentStunden");
    const wochen = wochenUeber(e, std);
    let status = ampel(e.stdVorlesung, std);
    let text = `In der Vorlesungszeit höchstens ${std} Stunden pro Woche. Du arbeitest ${e.stdVorlesung}.`;
    if (e.stdVorlesung > std) {
      text = `Mit ${e.stdVorlesung} Stunden in der Vorlesungszeit verlierst du das Werkstudentenprivileg und zahlst alle Sozialabgaben. Ausnahme: die Stunden über ${std} liegen abends, nachts oder am Wochenende und der Job ist auf ${w("werkstudentWochen")} Wochen befristet.`;
    } else if (wochen > w("werkstudentWochen")) {
      status = "rot";
      text = `In den Semesterferien darfst du mehr arbeiten, aber höchstens ${w("werkstudentWochen")} Wochen im Jahr über ${std} Stunden. Bei dir sind es ${wochen}. Damit gilt das Privileg nicht mehr.`;
    } else if (wochen > 0) {
      status = status === "gruen" ? "gelb" : status;
      text += ` In den Semesterferien sind mehr Stunden ok. Du kommst auf ${wochen} von höchstens ${w("werkstudentWochen")} Wochen über ${std} Stunden im Jahr.`;
    }
    ampeln.push({ titel: "20-Stunden-Regel", status, text, quelle: q("werkstudentStunden") });
  }
  // kurzfristige Beschäftigung
  if (e.jobart === "kurzfristig") {
    const m = w("kurzfristigMonate");
    ampeln.push({ titel: "Kurzfristige Beschäftigung", status: e.monate > m ? "rot" : e.monate === m ? "gelb" : "gruen", quelle: q("kurzfristigMonate"),
      text: e.monate > m ? `Mehr als ${m} Monate oder 70 Arbeitstage im Jahr gehen nicht. Dein Job wird dann wie ein Minijob oder Midijob behandelt und so gerechnet.`
        : `Höchstens ${m} Monate oder 70 Arbeitstage im Kalenderjahr, dann fallen keine Sozialabgaben an.` });
  }
  // 4. Familienversicherung und eigene Krankenversicherung
  const kv = krankenversicherung(e, j, W);
  if (kv.ampel) ampeln.push(kv.ampel);
  // 5. Kindergeld
  // über der Altersgrenze gibt es kein Kindergeld, die Frage entfällt
  if (e.kindergeld && e.alter < w("kindergeldAlter")) {
    const std = w("kindergeldStunden");
    const schnitt = e.jobart === "kurzfristig" ? 0 : (e.stdVorlesung * (52 - e.ferienWochen) + e.stdFerien * e.ferienWochen) / 52;
    let status = "gruen", text;
    if (e.erstausbildung) text = "In deiner ersten Ausbildung darfst du so viel arbeiten, wie du willst. Ein direkt anschließender Master zählt meist noch dazu.";
    else if (j.art === "minijob" || e.jobart === "kurzfristig") text = "Ein Minijob oder ein kurzfristiger Job ist für das Kindergeld immer unschädlich.";
    else if (e.stdVorlesung > std) { status = "rot"; text = `Nach der ersten Ausbildung sind höchstens ${std} Stunden pro Woche erlaubt. Mit ${e.stdVorlesung} Stunden fällt das Kindergeld weg.`; }
    else if (e.stdFerien > std) {
      const ok = e.ferienWochen <= (w("kindergeldUeberMonate") * 52) / 12 && schnitt <= std;
      status = ok ? "gelb" : "rot";
      text = ok ? `Mehr als ${std} Stunden in den Ferien sind ok, wenn es höchstens ${w("kindergeldUeberMonate")} Monate sind und der Jahresschnitt bei höchstens ${std} bleibt.`
        : `Mehr als ${std} Stunden über mehr als ${w("kindergeldUeberMonate")} Monate oder im Jahresschnitt kosten dich das Kindergeld für diese Zeit.`;
    } else { status = ampel(e.stdVorlesung, std); text = `Nach der ersten Ausbildung sind bis ${std} Stunden pro Woche erlaubt. Du arbeitest ${e.stdVorlesung}.`; }
    ampeln.push({ titel: "Kindergeld", status, text, quelle: q("kindergeldStunden") });
  }

  // Stipendium
  const stip = { art: e.stipendium, betrag: 0, punkte: [] };
  const merit = e.stipendium === "deutschland" ? w("deutschlandstipendium") : e.stipendium === "sonstig" ? e.stipBetrag : 0;
  if (e.stipendium === "deutschland") {
    stip.betrag = w("deutschlandstipendium");
    stip.punkte.push(
      { titel: "BAföG", status: "gruen", text: `Das Deutschlandstipendium wird nicht aufs BAföG angerechnet.`, quelle: q("bafoegStipendiumFrei") },
      { titel: "Steuer und Krankenversicherung", status: "gruen", text: "In der Regel steuerfrei und zählt nicht als Einkommen für die Familienversicherung.", quelle: "https://www.deutschlandstipendium.de/deutschlandstipendium/de/studierende/haeufig-gestellte-fragen/haeufig-gestellte-fragen.html" },
      { titel: "Nebenjob", status: "gruen", text: "Es wird unabhängig vom Einkommen vergeben. Dein Nebenjob ändert daran nichts.", quelle: q("deutschlandstipendium") });
  } else if (e.stipendium === "sonstig") {
    stip.betrag = e.stipBetrag;
    const frei = w("bafoegStipendiumFrei");
    stip.punkte.push(
      { titel: "BAföG", status: e.stipBetrag > frei ? "gelb" : "gruen", quelle: q("bafoegStipendiumFrei"),
        text: `Wird es nach Begabung und Leistung vergeben, bleiben bis ${eur(frei)} im Monat anrechnungsfrei. Andere Stipendien zählen voll.` },
      { titel: "Steuer und Krankenversicherung", status: "gelb", quelle: "https://www.gesetze-im-internet.de/estg/__3.html",
        text: "Steuerfrei und ohne Einfluss auf die Familienversicherung ist es nur, wenn es aus öffentlichen oder gemeinnützigen Mitteln kommt und keine Gegenleistung verlangt (§ 3 Nr. 44 EStG)." });
  } else if (e.stipendium === "begabt") {
    const kuerzung = Math.min(e.grundstipendium, bafoegAnrechnung(j.brutto.jahr, j.steuer.jahr, 0, W));
    stip.betrag = cent(e.grundstipendium - kuerzung + e.studienkosten);
    stip.kuerzung = kuerzung;
    const grenze = grenzeOhneAnrechnung(e, W, 0);
    stip.punkte.push(
      { titel: "Hinzuverdienst", status: kuerzung > 0 ? "rot" : ampel(b, grenze), quelle: q("studienkostenpauschale"),
        text: kuerzung > 0 ? `Dein Grundstipendium sinkt um ${eur(kuerzung)} im Monat. Die Studienkostenpauschale bleibt immer gleich.`
          : `Bis etwa ${eur(grenze)} brutto im Monat bleibt dein Grundstipendium ungekürzt. Die Studienkostenpauschale ist unabhängig vom Einkommen.` },
      { titel: "BAföG", status: e.bafoeg ? "rot" : "gruen", quelle: "https://www.gesetze-im-internet.de/baf_g/__2.html",
        text: "Neben einem Begabtenförderungswerk gibt es kein BAföG. Das Grundstipendium wird nach den BAföG-Regeln berechnet." },
      { titel: "Steuer und Krankenversicherung", status: "gruen", quelle: "https://www.gesetze-im-internet.de/estg/__3.html",
        text: "Steuerfrei nach § 3 Nr. 44 EStG und kein Einkommen für die Familienversicherung." });
  }

  // 6. BAföG
  let bafoeg = null;
  if (e.bafoeg) {
    if (e.stipendium === "begabt") {
      bafoeg = { betrag: e.bafoegBetrag, kuerzung: e.bafoegBetrag, bleibt: 0, ausgeschlossen: true };
    } else {
      const anr = bafoegAnrechnung(j.brutto.jahr, j.steuer.jahr, merit, W);
      const kuerzung = Math.min(e.bafoegBetrag, anr);
      const grenze = grenzeOhneAnrechnung(e, W, merit);
      bafoeg = { betrag: e.bafoegBetrag, anrechenbar: anr, kuerzung, bleibt: cent(e.bafoegBetrag - kuerzung), grenze, nochFrei: cent(Math.max(0, grenze - b)) };
      ampeln.push({ titel: "BAföG-Hinzuverdienst", status: kuerzung > 0 ? "rot" : ampel(b, grenze), quelle: q("bafoegFreibetrag"),
        text: kuerzung > 0 ? `Dein BAföG sinkt um ${eur(kuerzung)} im Monat.`
          : `Bis etwa ${eur(grenze)} brutto im Monat wird nichts angerechnet. Du kannst noch ${eur(bafoeg.nochFrei)} dazuverdienen.` });
    }
  }

  const gesamt = cent(j.netto.schnitt + (bafoeg ? bafoeg.bleibt : 0) + stip.betrag - kv.beitrag);
  const unsicher = Object.entries(W).filter(([, v]) => v && v.unsicher).map(([k, v]) => ({ name: k, hinweis: v.hinweis }));
  return { ...j, ampeln, bafoeg, stipendium: stip, kv, gesamt, unsicher };
}
