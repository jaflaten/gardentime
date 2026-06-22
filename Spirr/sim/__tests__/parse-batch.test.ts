// parseActionBatch — the visit loop asks "what do you do today?" and the gardener answers with a list
// (or nothing). Tolerant parsing keeps a malformed reply from crashing a visit, and distinguishes a
// VALID empty batch ("nothing to do") from junk so a quiet week doesn't trigger a wasted reprompt (S1).
import { describe, expect, it } from "vitest";
import { parseActionBatch } from "../gardener/ollama";

describe("parseActionBatch", () => {
  it("reads {actions:[...]}", () => {
    const b = parseActionBatch('{"actions":[{"action":"harvest","planting":"#1"},{"action":"sow_indoor","plant":"tomat"}]}');
    expect(b.parsed).toBe(true);
    expect(b.actions).toHaveLength(2);
  });

  it("reads a bare array", () => {
    const b = parseActionBatch('[{"action":"harvest","planting":"#1"}]');
    expect(b.parsed).toBe(true);
    expect(b.actions).toHaveLength(1);
  });

  it("wraps a single bare action object into a one-element batch", () => {
    const b = parseActionBatch('{"action":"advance_to_next_event"}');
    expect(b.parsed).toBe(true);
    expect(b.actions).toHaveLength(1);
  });

  it("treats a valid empty action list as parsed (a legitimate no-op visit — no reprompt)", () => {
    const b = parseActionBatch('{"actions":[]}');
    expect(b.parsed).toBe(true); // the key S1 distinction
    expect(b.actions).toEqual([]);
  });

  it("marks unparseable / non-action junk as NOT parsed (so the loop reprompts)", () => {
    expect(parseActionBatch("ikke json her").parsed).toBe(false);
    expect(parseActionBatch('{"foo":1}').parsed).toBe(false); // valid JSON, but not an action structure
    expect(parseActionBatch("").parsed).toBe(false);
    expect(parseActionBatch('{"foo":1}').actions).toEqual([]);
  });

  it("recovers an actions block wrapped in prose", () => {
    const b = parseActionBatch('Her er planen: {"actions":[{"action":"harvest","planting":"#2"}]} håper det er greit');
    expect(b.parsed).toBe(true);
    expect(b.actions).toHaveLength(1);
  });
});
