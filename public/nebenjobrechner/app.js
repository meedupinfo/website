// UI: stellt die Fragen erst einzeln (Onboarding mit Zurück), danach alle Fragen plus Ergebnis live.
// Rechnet mit rechner.js. Speichert nichts.
import { berechne } from "./rechner.js";
import w2026 from "./werte/2026.js";
import w2027 from "./werte/2027.js";

const JAHRE = { 2026: w2026, 2027: w2027 };
const $ = (id) => document.getElementById(id);
const form = $("eingaben");
const eur = (x) => x.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const prozent = (x) => (x * 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " %";
const datum = (iso) => new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
const NAMEN = { minijob: "Minijob", midijob: "sozialversicherungspflichtiger Job", werkstudent: "Werkstudentenjob", kurzfristig: "kurzfristige Beschäftigung" };
const JOBINFO = (W) => ({
  minijob: `Im Schnitt höchstens ${eur(W.minijobGrenze.wert)} im Monat.`,
  midijob: `Mehr als ein Minijob, aber höchstens ${eur(W.uebergangsbereichBis.wert)} im Monat.`,
  werkstudent: `Du bist eingeschrieben und arbeitest in der Vorlesungszeit höchstens ${W.werkstudentStunden.wert} Stunden pro Woche.`,
  kurzfristig: `Von vornherein auf höchstens ${W.kurzfristigMonate.wert} Monate oder 70 Arbeitstage im Jahr begrenzt, zum Beispiel ein Ferienjob.`,
});

// Jahr: aktuelles Jahr, sonst das neueste vorhandene
const jahre = Object.keys(JAHRE);
const aktuell = String(new Date().getFullYear());
$("jahr").innerHTML = jahre.map((j) => `<option ${j === (JAHRE[aktuell] ? aktuell : jahre.at(-1)) ? "selected" : ""}>${j}</option>`).join("");

function kassenAuswahl(W) {
  const sel = $("kasse");
  const vorher = sel.value;
  sel.innerHTML = `<option value="">Weiß ich nicht, Durchschnitt nehmen</option>` +
    W.krankenkassen.wert.map((k) => `<option${k.name === vorher ? " selected" : ""}>${k.name}</option>`).join("");
}

function lesen(W) {
  const f = new FormData(form);
  const zahl = (k) => Math.max(0, parseFloat(String(f.get(k) || "0").replace(",", ".")) || 0);
  const alter = Math.round(zahl("alter"));
  return {
    jobart: f.get("jobart"), modus: f.get("modus"),
    brutto: zahl("brutto"), stundenlohn: zahl("stundenlohn"),
    stdVorlesung: zahl("stdVorlesung"), stdFerien: zahl("stdFerien"),
    ferienWochen: Math.min(52, zahl("ferienWochen")), monate: Math.max(1, Math.min(12, Math.round(zahl("monate")) || 1)),
    alter, rvBefreit: f.get("rvBefreit") === "on", kinder: f.get("kinder") === "on", kasse: f.get("kasse") || "",
    // über den Altersgrenzen entfallen Kindergeld und Familienversicherung automatisch
    kv: alter >= W.famVersAlter.wert ? "selbst" : f.get("kv"),
    kindergeld: alter < W.kindergeldAlter.wert && f.get("kindergeld") === "ja", erstausbildung: f.get("erstausbildung") === "ja",
    bafoeg: f.get("bafoeg") === "ja", bafoegBetrag: zahl("bafoegBetrag"),
    stipendium: f.get("stipendium"), grundstipendium: zahl("grundstipendium"), studienkosten: zahl("studienkosten"), stipBetrag: zahl("stipBetrag"),
  };
}

// Felder ein- und ausblenden, die für die Auswahl keine Rolle spielen
function sichtbarkeit(e, W) {
  const kurz = e.jobart === "kurzfristig";
  const stunden = e.modus === "stunde" || e.jobart === "werkstudent" || (e.kindergeld && !e.erstausbildung && !kurz);
  const zeige = {
    minijob: e.jobart === "minijob", kurzfristig: kurz, stunden, arbeitszeit: stunden || kurz,
    kgfrage: e.alter < W.kindergeldAlter.wert, kindergeld: e.kindergeld,
    famfrage: e.alter < W.famVersAlter.wert, famalt: e.alter >= W.famVersAlter.wert,
    kinderlos: e.alter >= W.pvKinderlosZuschlagAb.wert,
    bafoeg: e.bafoeg, begabt: e.stipendium === "begabt", sonstig: e.stipendium === "sonstig",
  };
  form.querySelectorAll("[data-zeige]").forEach((el) => (el.hidden = !zeige[el.dataset.zeige]));
  form.querySelectorAll("[data-modus]").forEach((el) => (el.hidden = el.dataset.modus !== e.modus));
  form.querySelectorAll("[data-nicht]").forEach((el) => (el.hidden = el.dataset.nicht === e.jobart));
  $("brutto-label").textContent = kurz ? "Brutto pro Arbeitsmonat in Euro" : "Brutto pro Monat in Euro";
  $("jobart-hinweis").textContent = JOBINFO(W)[e.jobart];
  $("famalt-hinweis").textContent = `Ab ${W.famVersAlter.wert} kannst du nicht mehr über deine Eltern familienversichert sein. Wir rechnen deshalb mit eigener Versicherung.`;
  $("mindestlohn-hinweis").textContent = `Mindestlohn ${W.jahr}: ${eur(W.mindestlohn.wert)} pro Stunde.` +
    (e.modus === "stunde" && e.stundenlohn > 0 && e.stundenlohn < W.mindestlohn.wert ? " Dein Stundenlohn liegt darunter." : "");
}

const li = (a, b, cls = "") => `<li class="${cls}"><span>${a}</span><span>${b}</span></li>`;
const punkt = (p) => `<li><span class="pill ampel-${p.status}">${{ gruen: "passt", gelb: "knapp", rot: "überschritten" }[p.status]}</span><div><strong>${p.titel}</strong><p>${p.text} <a href="${p.quelle}" rel="noopener">Quelle</a></p></div></li>`;

function zeigen() {
  const W = JAHRE[$("jahr").value];
  if ($("kasse").options.length !== W.krankenkassen.wert.length + 1) kassenAuswahl(W);
  const e = lesen(W);
  // leeres Feld heißt: Standard-Studienkostenpauschale des Jahres
  $("studienkosten").placeholder = String(W.studienkostenpauschale.wert);
  if ($("studienkosten").value === "") e.studienkosten = W.studienkostenpauschale.wert;
  sichtbarkeit(e, W);
  const r = berechne(e, W);
  const kurz = e.jobart === "kurzfristig";

  $("gesamt").textContent = eur(r.gesamt);
  $("gesamt-text").textContent = (kurz ? "Im Schnitt übers Jahr: " : "") + "Nebenjob netto" +
    (r.bafoeg ? " plus BAföG" : "") + (r.stipendium.betrag ? " plus Stipendium" : "") +
    (r.kv.beitrag ? " minus deine Krankenversicherung" : "") + ".";

  const sv = r.sv;
  $("posten").innerHTML =
    li(kurz ? "Brutto pro Arbeitsmonat" : "Brutto pro Monat", eur(r.brutto.monat)) +
    (r.art !== e.jobart ? li("Wird behandelt als", NAMEN[r.art]) : "") +
    li("Rentenversicherung", "− " + eur(sv.rv)) +
    (sv.kv ? li("Krankenversicherung", "− " + eur(sv.kv)) : "") +
    (sv.pv ? li("Pflegeversicherung", "− " + eur(sv.pv)) : "") +
    (sv.av ? li("Arbeitslosenversicherung", "− " + eur(sv.av)) : "") +
    li("Lohnsteuer, geschätzt", "− " + eur(r.steuer.monat)) +
    li(kurz ? "Netto pro Arbeitsmonat" : "Netto pro Monat", eur(r.netto.monat), "summe") +
    li("Netto pro Jahr", eur(r.netto.jahr), "summe");
  $("steuer-hinweis").textContent = r.art === "minijob"
    ? "Beim Minijob zahlt in der Regel dein Arbeitgeber die Pauschsteuer. Für dich bleibt es steuerfrei."
    : "Die Steuer ist eine Jahresnäherung. Was dein Arbeitgeber monatlich als Lohnsteuer einbehält, bekommst du über die Steuererklärung zurück, wenn dein Jahreseinkommen unter dem Grundfreibetrag bleibt.";

  $("ampeln").innerHTML = r.ampeln.map(punkt).join("") || "<li><p>Für deine Auswahl gibt es keine Grenze zu prüfen.</p></li>";

  // eigene Krankenversicherung mit Kassenvergleich
  const kv = r.kv;
  $("kv-panel").hidden = !kv.selbst;
  if (kv.selbst) {
    const d = kv.detail;
    $("kv-posten").innerHTML = li("Krankenversicherung", "− " + eur(d.kv)) + li("Pflegeversicherung", "− " + eur(d.pv)) + li("Pro Monat", "− " + eur(d.summe), "summe");
    $("kv-text").textContent = (d.studentisch
      ? `Studentischer Beitrag ${kv.kasse ? "der " + kv.kasse : "mit dem durchschnittlichen Zusatzbeitrag"}. Er gilt längstens bis ${W.kvdsBisAlter.wert}.`
      : `Ab ${W.kvdsBisAlter.wert} bist du freiwillig versichert. Gerechnet ist der Mindestbeitrag, mit weiteren Einnahmen wird es mehr.`) +
      (e.bafoeg ? " Mit BAföG bekommst du dafür meist einen Zuschlag, der schon in deinem Bescheid steckt." : "");
    $("kassen-tabelle").innerHTML = kv.vergleich.map((k) =>
      `<tr${k.name === kv.kasse ? ' class="deine"' : ""}><td>${k.name}${k.bereich !== "bundesweit" ? ` <span class="muted">(${k.bereich})</span>` : ""}</td><td>${prozent(k.zusatz)}</td><td>${eur(k.summe)}</td></tr>`).join("");
    $("kassen-stand").innerHTML = `Zusatzbeiträge laut <a href="${W.krankenkassen.quelle}" rel="noopener">GKV-Spitzenverband</a>, Stand ${datum(W.krankenkassen.geprueft)}.` +
      (W.krankenkassen.unsicher ? ` ${W.krankenkassen.hinweis}` : "");
  }

  $("bafoeg-panel").hidden = !r.bafoeg;
  if (r.bafoeg) {
    const b = r.bafoeg;
    $("bafoeg-posten").innerHTML = li("BAföG laut Bescheid", eur(b.betrag)) + li("Kürzung durch Nebenjob", "− " + eur(b.kuerzung)) + li("Es bleiben", eur(b.bleibt), "summe");
    $("bafoeg-text").textContent = b.ausgeschlossen
      ? "Neben einem Stipendium eines Begabtenförderungswerks gibt es kein BAföG."
      : b.kuerzung > 0 ? `Angerechnet wird alles über dem Freibetrag von ${eur(W.bafoegFreibetrag.wert)} nach Abzug von Werbungskosten und Sozialpauschale.`
      : `Du kannst noch ${eur(b.nochFrei)} brutto im Monat dazuverdienen, ohne dass gekürzt wird.`;
  }
  $("stip-panel").hidden = !r.stipendium.punkte.length;
  $("stip-punkte").innerHTML = r.stipendium.punkte.map(punkt).join("");

  const geprueft = Object.values(W).map((v) => v && v.geprueft).filter(Boolean).sort();
  $("stand").textContent = `Keine Finanz-, Steuer- oder Rechtsberatung und keine Garantie für die Richtigkeit. Werte geprüft am ${datum(geprueft.at(-1))}.` +
    (r.unsicher.length ? ` Einige Werte für ${W.jahr} sind noch vorläufig und werden aktualisiert, sobald sie amtlich feststehen.` : "");
  schritte();
}

// Onboarding: eine Frage nach der anderen, Schritte ohne sichtbare Fragen werden übersprungen
let onboarding = true;
let schritt = 0;
const alle = [...form.querySelectorAll("[data-schritt]")];
const sichtbare = () => alle.filter((s) => !s.hidden);

function schritte(fokus = false) {
  const liste = sichtbare();
  schritt = Math.min(schritt, liste.length - 1);
  $("rechner").classList.toggle("onboarding", onboarding);
  $("ergebnis").hidden = onboarding;
  alle.forEach((s) => s.classList.toggle("aus", onboarding && s !== liste[schritt]));
  $("fortschritt").hidden = !onboarding;
  $("fortschritt").textContent = `Frage ${schritt + 1} von ${liste.length}`;
  $("zurueck").hidden = !onboarding || schritt === 0;
  $("weiter").hidden = !onboarding;
  $("weiter").textContent = schritt === liste.length - 1 ? "Ergebnis zeigen" : "Weiter";
  $("einzeln").hidden = onboarding;
  if (fokus) (onboarding ? liste[schritt].querySelector(".frage") : $("gesamt")).focus();
}

form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  if (!onboarding) return;
  if (schritt < sichtbare().length - 1) schritt++;
  else { onboarding = false; $("ergebnis").scrollIntoView({ block: "start" }); }
  schritte(true);
});
$("zurueck").addEventListener("click", () => { schritt = Math.max(0, schritt - 1); schritte(true); });
$("einzeln").addEventListener("click", () => { onboarding = true; schritt = 0; schritte(true); form.scrollIntoView({ block: "start" }); });
form.addEventListener("input", zeigen);
form.addEventListener("change", zeigen);
zeigen();
