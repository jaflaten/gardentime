// The visit-skip mechanism (FINDINGS critique fix a): `shouldAttend` decides whether the gardener opens the
// app on a given weekly visit. It must be DETERMINISTIC (so the sub-100% harvest-rate is a stable structural
// result across Ollama noise, and the frozen fixture reproduces), opt-in (personas without `attendance`
// attend every week → existing runs unchanged), and skip a contiguous "away" block so crops ripening during
// the holiday are stranded (a probabilistic taper couldn't — single skips are caught on the next visit).
import { describe, expect, it } from "vitest";
import { shouldAttend } from "../gardener/attendance";
import { getPersona, type Persona } from "../gardener/persona";

const noAway: Persona = { key: "x", name: "x", goal: "", temperature: 0.5 };
const traveller = getPersona("visit-skip"); // attendance { awayFrom: "2026-07-13", awayTo: "2026-08-20" }

describe("shouldAttend", () => {
  it("attends every visit when the persona has no attendance window (existing personas unchanged)", () => {
    for (const iso of ["2026-02-01", "2026-06-15", "2026-08-01", "2026-10-05"]) {
      expect(shouldAttend(iso, noAway)).toBe(true);
    }
  });

  it("attends before and after the away window", () => {
    expect(shouldAttend("2026-06-15", traveller)).toBe(true); // before
    expect(shouldAttend("2026-07-12", traveller)).toBe(true); // day before departure
    expect(shouldAttend("2026-08-21", traveller)).toBe(true); // day after return
    expect(shouldAttend("2026-09-28", traveller)).toBe(true); // well after
  });

  it("skips every visit inside the away window (inclusive bounds)", () => {
    for (const iso of ["2026-07-13", "2026-07-20", "2026-08-03", "2026-08-17", "2026-08-20"]) {
      expect(shouldAttend(iso, traveller)).toBe(false);
    }
  });

  it("is deterministic — same date always gives the same answer", () => {
    for (const iso of ["2026-07-01", "2026-07-15", "2026-08-10", "2026-09-01"]) {
      expect(shouldAttend(iso, traveller)).toBe(shouldAttend(iso, traveller));
    }
  });

  it("the away block spans enough weekly visits to outlast a 2–3 week ripe window", () => {
    // Weekly visits Jun15 → Oct5; count how many fall inside the holiday.
    const visits: string[] = [];
    for (let d = new Date("2026-06-15T12:00:00"); d <= new Date("2026-10-05T12:00:00"); d = new Date(d.getTime() + 7 * 86_400_000)) {
      visits.push(d.toISOString().slice(0, 10));
    }
    const skipped = visits.filter((iso) => !shouldAttend(iso, traveller));
    expect(skipped.length).toBeGreaterThanOrEqual(4); // ≥4 consecutive weekly skips ⇒ any 2–3 wk window stranded
  });
});
