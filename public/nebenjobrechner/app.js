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
const start = JAHRE[aktuell] ? aktuell : jahre.at(-1);
$("jahr-wahl").innerHTML = jahre.map((j) => `<input type="radio" id="jahr-${j}" name="jahr" value="${j}"${j === start ? " checked" : ""}><label for="jahr-${j}">${j}</label>`).join("");
const jahr = () => new FormData(form).get("jahr");

// Regler: jedes Zahlenfeld mit data-slider bekommt einen Schieberegler, beide bleiben synchron.
// Das Zahlenfeld zeigt den Wert groß und erlaubt exakte Eingaben.
const regler = [...form.querySelectorAll("[data-slider]")].map((zahl) => {
  const [min, max, step] = zahl.dataset.slider.split(",");
  const label = form.querySelector(`label[for="${zahl.id}"]`);
  label.id = label.id || `${zahl.id}-label`;
  const kopf = document.createElement("div");
  kopf.className = "regler-kopf";
  const wert = document.createElement("span");
  wert.className = "regler-wert";
  label.before(kopf);
  kopf.append(label, wert);
  const einheit = document.createElement("span");
  einheit.className = "einheit";
  einheit.textContent = zahl.dataset.einheit.replace("Euro", "€").replace("Stunden", "Std.");
  einheit.setAttribute("aria-hidden", "true");
  wert.append(zahl, einheit);
  const spur = Object.assign(document.createElement("input"), { type: "range", min, max, step, className: "spur" });
  spur.setAttribute("aria-labelledby", label.id);
  const marken = document.createElement("div");
  marken.className = "marken";
  marken.setAttribute("aria-hidden", "true");
  kopf.after(spur, marken);
  spur.addEventListener("input", () => { zahl.value = spur.value; });
  return { zahl, spur, marken, min: +min, max: +max };
});

// Grenzen auf der Spur, farbig wie die Ampel. Alle Werte aus werte/<jahr>.js.
const FARBE = { gruen: "var(--meedup-fern)", gelb: "#f0c75e", rot: "#b3402e", neutral: "#7d8b99" };
function grenzen(id, e, W, r) {
  const w = (k) => W[k].wert;
  const ampel = (g) => [[g * w("ampelGelbAb"), "gruen"], [g, "gelb"], [Infinity, "rot"]];
  const G = w("minijobGrenze"), OG = w("uebergangsbereichBis"), std = w("werkstudentStunden");
  const zweit = e.kindergeld && !e.erstausbildung;
  const bafoeg = r.bafoeg && r.bafoeg.grenze ? [{ wert: r.bafoeg.grenze, text: "BAföG-Grenze" }] : [];
  if (id === "brutto" && e.jobart === "minijob") return { marken: [{ wert: G, text: "Minijob-Grenze" }, ...bafoeg], zonen: ampel(G) };
  if (id === "brutto" && e.jobart === "midijob") return { marken: [{ wert: G, text: "Minijob-Grenze" }, { wert: OG, text: "Ende Übergangsbereich" }, ...bafoeg], zonen: [[G, "neutral"], ...ampel(OG)] };
  if (id === "brutto") return { marken: [...(e.jobart === "werkstudent" ? [{ wert: G, text: "Minijob-Grenze" }, { wert: OG, text: "Ende Übergangsbereich" }] : []), ...bafoeg], zonen: [] };
  if (id === "stundenlohn") return { marken: [{ wert: w("mindestlohn"), text: "Mindestlohn" }], zonen: [[w("mindestlohn") - 0.001, "rot"], [Infinity, "neutral"]] };
  if (id === "stdVorlesung" && (e.jobart === "werkstudent" || zweit)) return { marken: [{ wert: std, text: `${std} Stunden` }], zonen: ampel(std) };
  if (id === "stdFerien" && (e.jobart === "werkstudent" || zweit)) return { marken: [{ wert: std, text: `${std} Stunden` }], zonen: [] };
  if (id === "alter") return { marken: [{ wert: w("famVersAlter"), text: "Familienversicherung endet" }, { wert: w("kvdsBisAlter"), text: "Studentische KV endet" }], zonen: [] };
  if (id === "monate") return { marken: [{ wert: w("kurzfristigMonate"), text: `höchstens ${w("kurzfristigMonate")}` }], zonen: [[w("kurzfristigMonate"), "gruen"], [Infinity, "rot"]] };
  if (id === "stipBetrag" && e.bafoeg) return { marken: [{ wert: w("bafoegStipendiumFrei"), text: "BAföG-frei bis hier" }], zonen: [] };
  return { marken: [], zonen: [] };
}

function regler_zeigen(e, W, r) {
  for (const g of regler) {
    const v = parseFloat(g.zahl.value) || 0;
    g.spur.value = v;
    g.spur.setAttribute("aria-valuetext", `${v.toLocaleString("de-DE")} ${g.zahl.dataset.einheit}`);
    const pos = (x) => Math.max(0, Math.min(100, ((x - g.min) / (g.max - g.min)) * 100));
    const { marken, zonen } = grenzen(g.zahl.id, e, W, r);
    let von = 0;
    const teile = zonen.map(([bis, farbe]) => { const b = pos(bis); const t = `${FARBE[farbe]} ${von}% ${b}%`; von = b; return t; });
    g.spur.style.setProperty("--spur", teile.length ? `linear-gradient(to right, ${teile.join(", ")})` : FARBE.neutral);
    // nahe beieinanderliegende Marken zusammenfassen, damit nichts überlappt
    const liste = [];
    for (const m of marken.filter((m) => m.wert >= g.min && m.wert <= g.max).sort((x, y) => x.wert - y.wert)) {
      const letzte = liste.at(-1);
      if (letzte && pos(m.wert) - pos(letzte.wert) < 12) letzte.text += ` und ${m.text}`;
      else liste.push({ ...m });
    }
    // jede Marke in eine eigene Zeile, Beschriftung zeigt zur freien Seite
    g.marken.style.setProperty("--n", liste.length);
    g.marken.hidden = !liste.length;
    g.marken.innerHTML = liste.map((m, i) => `<span class="${pos(m.wert) > 50 ? "rechts" : ""}" style="left:${pos(m.wert)}%;--i:${i}">${m.text}</span>`).join("");
  }
}

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
    alter, rvBefreit: f.get("rvBefreit") === "ja", kinder: f.get("kinder") === "ja", kasse: f.get("kasse") || "",
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
  for (const [art, text] of Object.entries(JOBINFO(W))) $(`info-${art}`).textContent = text;
  $("info-deutschland").textContent = `${eur(W.deutschlandstipendium.wert)} im Monat, unabhängig vom Einkommen`;
  $("kinder-hinweis").textContent = `Ohne Kinder zahlst du ab ${W.pvKinderlosZuschlagAb.wert} einen kleinen Zuschlag zur Pflegeversicherung.`;
  $("famalt-hinweis").textContent = `Ab ${W.famVersAlter.wert} kannst du nicht mehr über deine Eltern familienversichert sein. Wir rechnen deshalb mit eigener Versicherung.`;
  $("mindestlohn-hinweis").textContent = `Mindestlohn ${W.jahr}: ${eur(W.mindestlohn.wert)} pro Stunde.` +
    (e.modus === "stunde" && e.stundenlohn > 0 && e.stundenlohn < W.mindestlohn.wert ? " Dein Stundenlohn liegt darunter." : "");
}

const li = (a, b, cls = "") => `<li class="${cls}"><span>${a}</span><span>${b}</span></li>`;
const punkt = (p) => `<li><span class="pill ampel-${p.status}">${{ gruen: "passt", gelb: "knapp", rot: "überschritten" }[p.status]}</span><div><strong>${p.titel}</strong><p>${p.text} <a href="${p.quelle}" rel="noopener">Quelle</a></p></div></li>`;

function zeigen() {
  const W = JAHRE[jahr()];
  if ($("kasse").options.length !== W.krankenkassen.wert.length + 1) kassenAuswahl(W);
  const e = lesen(W);
  // leeres Feld heißt: Standard-Studienkostenpauschale des Jahres
  $("studienkosten").placeholder = String(W.studienkostenpauschale.wert);
  if ($("studienkosten").value === "") e.studienkosten = W.studienkostenpauschale.wert;
  sichtbarkeit(e, W);
  const r = berechne(e, W);
  regler_zeigen(e, W, r);
  const kurz = e.jobart === "kurzfristig";

  $("gesamt").textContent = eur(r.gesamt);
  // Rechenkette: jede Zeile mit Grund und Sprung zur ausführlichen Erklärung
  const vz = (x) => (x < 0 ? "− " : x > 0 ? "+ " : "") + eur(Math.abs(x));
  $("quittung").innerHTML = r.zeilen.map((z, i) => z.summe
    ? `<li class="zwischen"><span>= ${z.text}</span><span class="betrag">${eur(z.betrag)}</span></li>`
    : `<li><a href="#${z.ziel}">${z.text}</a><span class="betrag${z.betrag === 0 ? " null" : ""}">${i === 0 ? eur(z.betrag) : vz(z.betrag)}</span><small>${z.grund}</small></li>`).join("") +
    `<li class="ende"><span>= Das bleibt dir im Monat</span><span class="betrag">${eur(r.gesamt)}</span></li>`;
  const knapp = r.ampeln.filter((p) => p.status !== "gruen");
  $("warnungen").hidden = !knapp.length;
  $("warnungen").innerHTML = knapp.map((p) => `<li><span class="pill ampel-${p.status}">${p.status === "rot" ? "überschritten" : "knapp"}</span><a href="#grenzen">${p.titel}</a></li>`).join("");
  $("gesamt-text").textContent = (kurz ? "Im Schnitt übers Jahr. " : "") + "So setzt sich der Betrag zusammen. Jede Zeile führt zur ausführlichen Erklärung.";

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
  if (fokus) (onboarding ? liste[schritt].querySelector(".frage") : $("gesamt")).focus({ preventScroll: !onboarding });
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
