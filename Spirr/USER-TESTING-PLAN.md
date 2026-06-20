# MyGarden — Getting first users & the feedback we need

> Companion to `MVP-next-phases.md`. That doc is *what to build*; this is *who to put it in front of and what to learn*. This is "non-code step 2" from the roadmap's **What to ship next**: get the calendar (SowNowCard + box picker + Sesongoversikt + harvest log) into real Norwegian gardeners' hands and validate the numbers before we lock them.

---

## The one-line strategy

**Recruit 5–15 engaged Norwegian hobby gardeners across a spread of climate zones, give them a no-signup app, and extract one thing above all else: do our location-accurate sowing/frost/harvest dates match reality?** Everything else (UX polish, feature requests, willingness to pay) is secondary signal we collect along the way.

Small and deep beats big and shallow. We are validating a hypothesis, not launching. Per the roadmap's own anti-pattern list: **no big-bang.**

---

## Read the season first (this is June — act accordingly)

The product's loudest moment is **late winter → spring (Feb–April)**: that's when "hva kan jeg så nå?" is a daily question and forkultivering kicks off. **We are past that for 2026.** Two implications:

1. **Don't expect the sowing card to be the hook right now.** In June the live hooks are: **harvest logging** (Phase F just shipped), the **Sesongoversikt** "what's coming" view, **"Høst snart"**, and **box/rotation planning for next year**. Lead acquisition with *those*.
2. **This round is a dress rehearsal for spring.** Use summer/autumn to (a) find and warm up testers, (b) get them to **backfill last season** (see flywheel below), (c) fix the rough edges, so that when the Feb–April wave hits, the app is sharp and we already have a tester list primed. Capture a **"varsle meg når såsesongen starter"** email for everyone who's interested but not active now.

So: **acquire now, validate hard in spring.** Both matter; don't wait for spring to start talking to people.

---

## Who — the ideal first tester (ICP)

Prioritise people who will actually *use it enough to generate signal*:

- **Has raised beds / pallekarmer / a defined kjøkkenhage** — our box model fits them; a lawn-and-shrubs gardener won't exercise the calendar.
- **Already tracks somehow** — spreadsheet, notebook, Gardenize, photos in their phone. Someone already doing the manual work feels the pain we remove.
- **Grows vegetables/herbs**, not just ornamentals — that's where frost-relative timing bites.
- **Spread across climate zones on purpose.** We need a coastal mild garden (Stavanger/Bergen), an inland/cold one (Østlandet inland, Trøndelag), and ideally one high-elevation or far-north (Sogndal-type, or Tromsø-area). Zone spread is how we stress-test the frost model and lapse-rate correction — the part nobody else gets right.
- **Also recruit 2–3 in the *same* zone** so we can compare their reactions to identical dates (one tester saying "too early" is noise; two in the same station agreeing is signal).
- **Reachable and chatty** — willing to answer a DM or a 15-min call. Early feedback is qualitative.

Start with **people you can actually reach**: friends, family, neighbours, a local hagelag. Warm contacts give honest, fast feedback and tolerate rough edges.

---

## Where to find them (ranked for Norway)

1. **Norwegian gardening Facebook groups** — by far the biggest pool. Examples to look for: *Dyrking av grønnsaker / kjøkkenhage*, *Selvberging Norge*, *Pallekarm*-focused groups, regional *Hagegruppa [fylke/by]*. **Read each group's rules first — most ban self-promo.** Don't drop a link cold. Participate, answer frost/timing questions (you have genuinely good data), then ask the *mods* if a small "looking for testers" post is OK.
2. **Allotment & shared-growing communities** — *parsellhager, kolonihager, andelslandbruk*. Concentrated, engaged, social, and they talk to each other. A few testers here spread by word of mouth.
3. **Det norske hageselskap (local chapters / lokallag)** — organised hobby gardeners; a local-chapter contact can introduce you.
4. **Instagram / TikTok** — hashtags like `#kjøkkenhage #pallekarm #dyrkselv #selvberging #norskhage`. Good for reach and for finding micro-influencers who might try it and post.
5. **Reddit** — r/norge (occasional), niche over reach.
6. **Hyper-local Facebook** — your kommune/bydel group, your borettslag. Easiest "yes" for warm testers.
7. **Your own network** — start here today. 3 friends with pallekarmer = your first cohort this week.

Avoid for now: paid ads (premature — we don't know the message converts yet), press/launch posts (nothing to launch yet), NLR/professional channels (wrong audience for a hobby tool).

---

## The offer — how to pitch it

Lead with the **wedge**, not the feature list. What no competitor combines: **Norwegian station-accurate frost dates × frost-relative plant rules × your boxes' family history × your actual layout.**

Lower friction is our superpower: **no account, no install needed, data stays on your device.** That's a real, honest selling point in Norway (personvern) and removes the #1 reason people bounce.

Draft outreach copy (adapt, keep it personal, never spam):

> *"Hei! Jeg har laget en gratis hagekalender som bruker ekte frostdata fra Meteorologisk institutt for akkurat ditt postnummer — så «hva kan jeg så nå» faktisk stemmer med klimaet der du bor, ikke et generelt råd. Ingen innlogging, dataene blir på din enhet. Jeg er en hobbyutvikler som dyrker selv og leter etter noen få som vil teste og si hva som funker / ikke funker. Har du pallekarmer eller kjøkkenhage og lyst til å prøve?"*

Be upfront: it's early, it's an MVP, **you want them to tell you where it's wrong.** "Help me make this right for Norwegian gardens" invites better feedback than "check out my app."

---

## What feedback we want (the actual goal)

Tie every question to an **open decision in `MVP-next-phases.md`**. We are not fishing for compliments — we're closing specific gaps. In priority order:

### Tier 1 — validate the numbers (the whole reason for this round)
1. **Sowing dates.** *"When the app said «så X nå» — was it right, too early, or too late for your garden?"* The roadmap is explicit that all `sowRules` values are **literature estimates, never validated against a real garden.** This is the #1 thing to correct. **Crucially, ask which plants they actually grow** and cross-check *those* against NLR/Hageselskapet — that's the cheap, targeted calibration the roadmap calls for.
2. **Frost dates.** *"We estimate your last spring frost ≈ [dato] and first autumn frost ≈ [dato]. Does that match your experience?"* Validates the station match + lapse-rate/elevation correction — strongest signal from testers who are **far from their station or at unusual elevation** (the Sogndal-type case).
3. **Harvest timing (Sesongoversikt).** *"Did the harvest windows on the timeline look believable for what you grow?"* The bars are literature estimates too; this is the in-season hook right now.

### Tier 2 — validate the intelligence
4. **Box ranking.** *"When a box was marked Anbefalt / OK / Frarådes, did you agree? Did any why-line feel wrong?"*
5. **Rotation & companion warnings.** *"Useful, or noise? Did any warning seem incorrect?"* (Watch for false positives — those erode trust fast.)
6. **Multi-year willingness (this feeds the next build — see flywheel).** *"Would you enter what you grew in each box last year, if it unlocked rotation history and «i fjor»-hints?"* A yes validates the **retrospective-backfill** plan; their entries *are* the multi-year ground truth we'd otherwise wait a season for.

### Tier 3 — positioning & retention
7. **Does it replace their current tool?** *"Would this replace your spreadsheet / Gardenize / notebook? Why / why not?"* The clearest product-market-fit signal.
8. **Wedge resonance.** *"What made you keep it open — the location-accurate dates, the logging, the layout, something else?"* Confirms (or redirects) our positioning bet.
9. **Onboarding.** *"Did you get to a garden with your boxes and plants? Where did you get stuck or confused?"* Watch for drop-off before first value.
10. **Most-wanted next thing.** *"If I could add one thing, what would it be?"* — open-ended; cluster the answers.

### Tier 4 — business signal (light touch, don't lead with it)
11. **Cross-device / sharing demand.** *"Do you wish you could open this on your phone and laptop, or share it with someone?"* A real "yes, I'd pay for that" is the trigger to start **Phase H** — build the paywall around demonstrated demand, not assumption.

---

## How to capture it

- **Conversations beat surveys early.** Aim for **3–5 actual 15-min chats** (call or DM thread). One real conversation surfaces more than fifty form rows.
- **One short structured form** (Google Form / Nettskjema — Nettskjema is Norwegian/UiO-run and privacy-friendly) for the testers you can't get on a call. Keep it to the Tier 1 questions + "most-wanted next thing." Long forms don't get finished.
- **A lightweight in-app feedback link** is worth ~½ day: a "Send tilbakemelding" link (mailto: or form URL) in Settings/About. Low effort, catches feedback in the moment.
- **A tester "diary" ask** (optional, gold if you get it): *"When the app tells you to do something, jot down whether you agreed."* This is the cleanest sow-date validation data.
- **Honest limitation:** localStorage-first means **no usage telemetry** today — we can't see drop-off, we have to ask. That's a fair trade for the no-account selling point. If we later want privacy-respecting opt-in analytics, that's a deliberate Phase-H-era decision, not now.

---

## The flywheel: turn testers into the multi-year data we'd otherwise wait for

The multi-year intelligence feature (Increment I) is *partly* gated on a logged season — but **retrospective backfill breaks that gate** (see the reworked Increment I in `MVP-next-phases.md`). This testing round is where we prime it:

- Every tester who **enters last year's crops** gives us instant multi-year rotation history *and* real sow/harvest ground truth — without waiting for 2027.
- Every tester who **logs this summer's harvests** (Phase F) seeds the 2026 season now.
- So "get users + feedback" and "make the calendar smarter" are the **same activity**: the feedback *is* the calibration data. Make backfill easy and ask for it explicitly.

---

## What success looks like for this round

Not MAU, not downloads. This round wins if:

- ✅ We get **corrected sow/frost dates for ≥10 plants** that real testers actually grow (turns literature guesses into validated values).
- ✅ At least **2 testers in different zones** confirm the frost dates feel right (validates the model travels).
- ✅ At least **1 tester backfills a past season** (proves the flywheel + multi-year path).
- ✅ At least **1 unprompted "this is better than what I used"** (early PMF signal).
- ✅ A ranked list of **the top 3 friction points** and **top 3 requested features.**
- ✅ A warmed-up **tester list + "varsle meg til våren" emails** ready for the Feb–April wave.

---

## First 14 days — concrete

1. **Today:** message 3 warm contacts with pallekarmer/kjøkkenhage. Get the app in their hands this week.
2. **Day 1–3:** add the in-app "Send tilbakemelding" link (½ day) and stand up the Nettskjema/Google Form (Tier-1 questions).
3. **Day 2–5:** join 3–5 relevant FB/allotment groups. Read rules. **Contribute** (answer frost/timing questions) before asking anything.
4. **Day 5–10:** DM the mods of 1–2 groups for permission to post a short "søker testere" note. Post where allowed.
5. **Day 7–14:** run the first 3–5 feedback conversations. Log corrected dates straight into a "to-calibrate" list. Capture spring-reminder emails.
6. **Continuous:** every corrected sow/frost date → a targeted NLR/Hageselskapet cross-check → update `plants.json`. That's the calibration loop turning.

---

## Risks / etiquette / personvern

- **No spam.** Most NO gardening groups ban promo and the mods are strict. Read rules, ask first, contribute first. One annoyed mod can blacklist you from the best channel.
- **Be a gardener, not a marketer.** These communities reward genuine participation. Your frost data is genuinely useful — give it away in answers and the tool sells itself.
- **Personvern is a feature.** "Dataene blir på din enhet, ingen innlogging" is true today and it's a real differentiator — say it. Don't add tracking that undermines it without a deliberate decision.
- **Set expectations.** It's an MVP. Saying so upfront earns patience and better bug reports.
- **Don't over-recruit.** 15 engaged testers you can talk to > 200 silent installs. Scale only after the message and the dates are validated.
