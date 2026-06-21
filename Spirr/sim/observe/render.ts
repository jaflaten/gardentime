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

  lines.push("");
  lines.push("## Hva passer å gjøre nå?");
  lines.push(`Så inne: ${plantList(g.sowNow.indoor)}`);
  lines.push(`Så ute: ${plantList(g.sowNow.outdoor)}`);
  lines.push(`Plant ut (forkultiverte arter klare): ${plantList(g.sowNow.plantOut)}`);

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
    lines.push(`${s.handle} ${s.plantKey} (${s.ageLabel || "ny"}) — plant ut: ${r}`);
  }

  lines.push("");
  lines.push(`## Klar/snart til høsting (${g.harvestSoon.length})`);
  if (g.harvestSoon.length === 0) {
    lines.push("(ingenting nær høsting)");
  }
  for (const h of g.harvestSoon) {
    lines.push(`${h.handle} ${h.plantKey} — ${h.status}${h.wontRipen ? " (modner ikke ute her)" : ""}`);
  }

  if (g.wontRipen.length > 0) {
    lines.push("");
    lines.push(`## ⚠ Modner ikke ute her (for kaldt) — vurder drivhus/tunnel`);
    lines.push(plantList(g.wontRipen));
  }

  lines.push("");
  lines.push(
    `## Hagen i tall: ${g.stats.totalActive} aktive, ${g.stats.distinctSpecies} arter, ${g.stats.distinctFamilies} familier, ${g.stats.bedsInUse} kasser i bruk`,
  );

  return lines.join("\n");
}
