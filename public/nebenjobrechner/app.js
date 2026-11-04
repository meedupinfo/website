// UI: liest das Formular, rechnet mit rechner.js und zeigt das Ergebnis live. Speichert nichts.
import { berechne } from "./rechner.js";
import w2026 from "./werte/2026.js";
import w2027 from "./werte/2027.js";

const JAHRE = { 2026: w2026, 2027: w2027 };
const $ = (id) => document.getElementById(id);
const form = $("eingaben");
const eur = (x) => x.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const datum = (iso) => new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
const NAMEN = { minijob: "Minijob", midijob: "sozialversicherungspflichtiger Job", werkstudent: "Werkstudentenjob", kurzfristig: "kurzfristige Beschäftigung" };

// Jahr: aktuelles Jahr, sonst das neueste vorhandene
const jahre = Object.keys(JAHRE);
const aktuell = String(new Date().getFullYear());
$("jahr").innerHTML = jahre.map((j) => `<option ${j === (JAHRE[aktuell] ? aktuell : jahre.at(-1)) ? "selected" : ""}>${j}</option>`).join("");

function lesen() {
  const f = new FormData(form);
  const zahl = (k) => Math.max(0, parseFloat(String(f.get(k) || "0").replace(",", ".")) || 0);
  return {
    jobart: f.get("jobart"), modus: f.get("modus"),
    brutto: zahl("brutto"), stundenlohn: zahl("stundenlohn"),
    stdVorlesung: zahl("stdVorlesung"), stdFerien: zahl("stdFerien"),
    ferienWochen: Math.min(52, zahl("ferienWochen")), monate: Math.max(1, Math.min(12, Math.round(zahl("monate")) || 1)),
    alter: Math.round(zahl("alter")), rvBefreit: f.get("rvBefreit") === "on", kv: f.get("kv"), kinder: f.get("kinder") === "on",
    kindergeld: f.get("kindergeld") === "ja", erstausbildung: f.get("erstausbildung") === "ja",
    bafoeg: f.get("bafoeg") === "ja", bafoegBetrag: zahl("bafoegBetrag"),
    stipendium: f.get("stipendium"), grundstipendium: zahl("grundstipendium"), studienkosten: zahl("studienkosten"), stipBetrag: zahl("stipBetrag"),
  };
}

// Felder ein- und ausblenden, die für die Auswahl keine Rolle spielen
function sichtbarkeit(e, W) {
  const kurz = e.jobart === "kurzfristig";
  const zeige = {
    minijob: e.jobart === "minijob",
    kurzfristig: kurz,
    stunden: e.modus === "stunde" || e.jobart === "werkstudent" || (e.kindergeld && !e.erstausbildung && !kurz),
    kinderlos: e.jobart !== "kurzfristig" && e.jobart !== "minijob" && e.alter >= W.pvKinderlosZuschlagAb.wert,
    kindergeld: e.kindergeld, bafoeg: e.bafoeg, begabt: e.stipendium === "begabt", sonstig: e.stipendium === "sonstig",
  };
  form.querySelectorAll("[data-zeige]").forEach((el) => (el.hidden = !zeige[el.dataset.zeige]));
  form.querySelectorAll("[data-modus]").forEach((el) => (el.hidden = el.dataset.modus !== e.modus));
  form.querySelectorAll("[data-nicht]").forEach((el) => (el.hidden = el.dataset.nicht === e.jobart));
  $("brutto-label").textContent = kurz ? "Brutto pro Arbeitsmonat in Euro" : "Brutto pro Monat in Euro";
  $("mindestlohn-hinweis").textContent = `Mindestlohn ${W.jahr}: ${eur(W.mindestlohn.wert)} pro Stunde.` +
    (e.modus === "stunde" && e.stundenlohn > 0 && e.stundenlohn < W.mindestlohn.wert ? " Dein Stundenlohn liegt darunter." : "");
}

const li = (a, b, cls = "") => `<li class="${cls}"><span>${a}</span><span>${b}</span></li>`;
const punkt = (p) => `<li class="${p.status}"><span class="punkt" aria-hidden="true"></span><strong>${p.titel}: ${{ gruen: "passt", gelb: "knapp", rot: "überschritten" }[p.status]}</strong><p>${p.text} <a href="${p.quelle}" rel="noopener">Quelle</a></p></li>`;

function zeigen() {
  const e = lesen();
  const W = JAHRE[$("jahr").value];
  // leeres Feld heißt: Standard-Studienkostenpauschale des Jahres
  $("studienkosten").placeholder = String(W.studienkostenpauschale.wert);
  if ($("studienkosten").value === "") e.studienkosten = W.studienkostenpauschale.wert;
  sichtbarkeit(e, W);
  const r = berechne(e, W);
  const kurz = e.jobart === "kurzfristig";

  $("gesamt").textContent = eur(r.gesamt);
  $("gesamt-text").textContent = (kurz ? "Im Schnitt übers Jahr: " : "") + "Nebenjob netto" +
    (r.bafoeg ? " plus BAföG" : "") + (r.stipendium.betrag ? " plus Stipendium" : "") + ".";

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
  $("stand").textContent = `Keine Steuer- oder Rechtsberatung. Werte geprüft am ${datum(geprueft.at(-1))}.` +
    (r.unsicher.length ? ` Einige Werte für ${W.jahr} sind noch vorläufig und werden aktualisiert, sobald sie amtlich feststehen.` : "");
}

form.addEventListener("input", zeigen);
form.addEventListener("change", zeigen);
form.addEventListener("submit", (ev) => ev.preventDefault());
zeigen();
