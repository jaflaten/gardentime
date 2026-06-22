// Gardener personas. Each walks a different path through the life stages and surfaces different
// friction. `goal` is injected into the system prompt; `temperature` tunes how exploratory it is.

export interface Persona {
  key: string;
  name: string;
  goal: string;
  temperature: number;
  /**
   * Engagement model: a contiguous "away" window (a holiday). The harness samples ripeness every week
   * regardless, but only calls the gardener on weeks whose date is OUTSIDE `[awayFrom, awayTo]`. Absent =
   * attends every visit (the default for every persona except visit-skip). A multi-week absence over peak
   * harvest strands crops that ripen while the gardener is away, which is what lets the harvest-rate metric
   * finally drop below 100% (FINDINGS critique fix a / B8). ISO dates (`YYYY-MM-DD`).
   */
  attendance?: { awayFrom: string; awayTo: string };
}

export const PERSONAS: Record<string, Persona> = {
  "eager-beginner": {
    key: "eager-beginner",
    name: "Ivrig nybegynner",
    goal:
      "Du er fersk men entusiastisk. Du vil komme i gang fort: forkultiver varmekjære vekster inne, " +
      "så litt ute, og plant ut frøplantene når appen sier de er klare. Du følger som regel appens forslag.",
    temperature: 0.5,
  },
  "methodical-veteran": {
    key: "methodical-veteran",
    name: "Metodisk veteran",
    goal:
      "Du er en erfaren hagebruker som er nøye med vekstskifte (rotasjon). Du unngår å plante samme " +
      "familie i samme kasse to år på rad, planlegger forkultivering presist, og høster i tide. Du leser " +
      "advarslene nøye.",
    temperature: 0.3,
  },
  forgetful: {
    key: "forgetful",
    name: "Glemsom gartner",
    goal:
      "Du er travel og glemsom. Du sår iblant, men glemmer ofte å plante ut frøplanter i tide eller å " +
      "høste før det er for sent. Du hopper lett over appens forslag.",
    temperature: 0.8,
  },
  "maximise-harvest": {
    key: "maximise-harvest",
    name: "Maks avling",
    goal:
      "Du vil ha størst mulig avling. Du fyller hver kasse, sår i etapper (suksesjon), forkultiverer alt " +
      "som tjener på det, og høster aktivt for å gi plass til mer.",
    temperature: 0.5,
  },
  // Diligent WHEN PRESENT (harvests what's ripe), but away for a long summer holiday over peak harvest —
  // capability decoupled from engagement (B8). The skip is mechanical (the `attendance` away-window + the
  // visit loop), not a prompt disposition; the goal text only sets tone for the weeks the gardener is home.
  "visit-skip": {
    key: "visit-skip",
    name: "Travel byboer",
    goal:
      "Du har god vilje og høster det som er modent når du er hjemme — men du er en travel byboer som " +
      "reiser bort på en lang sommerferie midt i høstesesongen, og rekker ikke å se til hagen mens du er borte.",
    temperature: 0.5,
    // Away mid-July → late August (the Norwegian fellesferie + peak harvest). A ~5-week block outlasts any
    // crop's 2–3 week ripe window, so crops ripening in that span are stranded → harvest-rate < 100%.
    attendance: { awayFrom: "2026-07-13", awayTo: "2026-08-20" },
  },
};

export function getPersona(key: string): Persona {
  const p = PERSONAS[key];
  if (!p) {
    throw new Error(`unknown persona "${key}" (have: ${Object.keys(PERSONAS).join(", ")})`);
  }
  return p;
}
