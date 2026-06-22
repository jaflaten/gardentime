// ObservedGarden -> compact Norwegian text block for the model prompt. Terse on purpose: the model
// pays per token and a long dump buries the signal. Caps long lists.

import type { ObservedGarden, ObservedPlant } from "./snapshot";

const MAX_LIST = 12;

function plantList(plants: ObservedPlant[]): string {
  if (plants.length === 0) {
    return "(ingen)";
  }
  const shown = plants.slice(0, MAX_LIST).map((p) => `${p.key}`);
  const extra = plants.length > MAX_LIST ? ` …+${plants.length - MAX_LIST}` : "";
  return shown.join(", ") + extra;
}

export function renderSnapshot(g: ObservedGarden): string {
  const lines: string[] = [];
  lines.push(`# Hagen i dag — ${g.date} (dag ${g.doy}, ${g.year})`);
  lines.push(`Sesong: ${g.phase}`);
  if (g.location) {
    lines.push(
      `Sted: ${g.location.postnummer} ${g.location.station} | siste vårfrost dag ${g.location.lastFrostDoy} | første høstfrost dag ${g.location.firstFrostDoy}`,
    );
  } else {
    lines.push(`Sted: IKKE SATT — du må sette lokasjon (set_location) før noe annet gir mening.`);
  }

  // ⚡ Action-priority block FIRST — the gardener's job is to harvest what it plants. Ripe crops and
  // ready seedlings are the high-value, time-sensitive moves; surface them up top as imperatives with the
  // EXACT handle to use (the handle-confusion failure mode: model picks the wrong #N). Sowing is demoted
  // below so the gardener clears the bed/tray before adding more (the over-sow → stranded-seedling leak).
  const ripe = g.harvestSoon.filter((h) => h.status === "ready");
  const readyOut = g.seedlings.filter((s) => s.readiness === "ready" || s.readiness === "overdue");
  if (g.location) {
    lines.push("");
    lines.push("## ⚡ Gjør først (tidssensitivt — høst/plant ut før du sår mer)");
    if (ripe.length > 0) {
      lines.push(`🌾 HØST NÅ (moden — bruk harvest med nøyaktig denne handelen): ${ripe.map((h) => `${h.handle} ${h.plantKey}`).join(", ")}`);
    }
    if (readyOut.length > 0) {
      lines.push(
        `🌱 PLANT UT NÅ (frøplante klar — bruk plant_out med denne handelen): ${readyOut
          .map((s) => `${s.handle} ${s.plantKey}${s.readiness === "overdue" ? " (på overtid!)" : ""}${s.frostRisk ? " ⚠frostrisiko" : ""}`)
          .join(", ")}`,
      );
    }
    if (ripe.length === 0 && readyOut.length === 0) {
      lines.push("(ingenting haster akkurat nå — la tiden gå eller så/plant noe nytt)");
    }
  }

  lines.push("");
  lines.push("## Hva passer å så nå? (arter — bruk key i sow_indoor/sow_outdoor)");
  lines.push(`Så inne: ${plantList(g.sowNow.indoor)}`);
  lines.push(`Så ute: ${plantList(g.sowNow.outdoor)}`);
  // NB: this is a sowing-window hint about SPECIES, not a plant_out target. plant_out acts on a seedling
  // HANDLE (#N) from the "🌱 PLANT UT NÅ" block above — never on a species key. (Avoids the model
  // emitting plant_out for a species and burning visits on invalid actions.)
  lines.push(`Arter i utplantingsvindu (kun relevant hvis du forkultiverer dem): ${plantList(g.sowNow.plantOut)}`);

  lines.push("");
  lines.push(`## Kasser (${g.boxes.length})`);
  if (g.boxes.length === 0) {
    lines.push("(ingen kasser ennå — bruk add_box)");
  }
  for (const b of g.boxes) {
    const meta = [b.bedType, b.sun, b.depthCm ? `${b.depthCm}cm` : null].filter(Boolean).join(", ");
    const occ =
      b.plantings.length === 0
        ? "tom"
        : b.plantings.map((p) => `${p.handle} ${p.plantKey} (${p.ageLabel || "ny"})`).join("; ");
    lines.push(`Kasse ${b.handle} «${b.name}» [${meta || "—"}]: ${occ}`);
    if (b.rotationCautions.length > 0) {
      lines.push(`  ⚠ vekstskifte: ${b.rotationCautions.join("; ")}`);
    }
  }

  lines.push("");
  lines.push(`## Frøbrett (forkultivering) (${g.seedlings.length})`);
  if (g.seedlings.length === 0) {
    lines.push("(ingen frøplanter inne)");
  }
  for (const s of g.seedlings) {
    const r = s.readiness ? `${s.readiness}${s.weeks ? ` (~${s.weeks} uker)` : ""}` : "ingen utplantingsvindu";
    const frost = s.frostRisk ? " ⚠ frostømfintlig — risiko ved utplanting før siste vårfrost" : "";
    lines.push(`${s.handle} ${s.plantKey} (${s.ageLabel || "ny"}) — plant ut: ${r}${frost}`);
  }

  lines.push("");
  lines.push(`## Klar/snart til høsting (${g.harvestSoon.length})`);
  if (g.harvestSoon.length === 0) {
    lines.push("(ingenting nær høsting)");
  }
  for (const h of g.harvestSoon) {
    const status = h.status === "ready" ? "MODEN — høst nå" : "snart moden";
    lines.push(`${h.handle} ${h.plantKey} — ${status}${h.wontRipen ? " (modner ikke ute her)" : ""}`);
  }

  if (g.wontRipen.length > 0) {
    lines.push("");
    lines.push(`## ⚠ Modner ikke ute her (for kaldt) — vurder drivhus/tunnel`);
    lines.push(plantList(g.wontRipen));
  }

  if (g.customPlants.length > 0) {
    lines.push("");
    lines.push(`## Egendefinerte planter (dine egne — bruk key i plant-feltet)`);
    lines.push(plantList(g.customPlants));
  }

  lines.push("");
  lines.push(
    `## Hagen i tall: ${g.stats.totalActive} aktive, ${g.stats.distinctSpecies} arter, ${g.stats.distinctFamilies} familier, ${g.stats.bedsInUse} kasser i bruk`,
  );

  return lines.join("\n");
}
