// Stable short handles so the LLM never sees or emits opaque nanoids. Boxes are "A", "B", "C"…;
// plantings are "#1", "#2"… Assigned in creation order and mapped to the store's real ids.

export class HandleRegistry {
  private boxToId = new Map<string, string>();
  private idToBox = new Map<string, string>();
  private plantingToId = new Map<string, string>();
  private idToPlanting = new Map<string, string>();
  private boxSeq = 0;
  private plantingSeq = 0;

  /** Register a freshly-created box id, returning its new handle ("A", "B", …). */
  registerBox(id: string): string {
    const handle = String.fromCharCode(65 + this.boxSeq); // A, B, C…
    this.boxSeq += 1;
    this.boxToId.set(handle, id);
    this.idToBox.set(id, handle);
    return handle;
  }

  /** Register a freshly-created planting id, returning its new handle ("#1", "#2", …). */
  registerPlanting(id: string): string {
    this.plantingSeq += 1;
    const handle = `#${this.plantingSeq}`;
    this.plantingToId.set(handle, id);
    this.idToPlanting.set(id, handle);
    return handle;
  }

  boxId(handle: string): string | undefined {
    return this.boxToId.get(handle.trim().toUpperCase());
  }

  plantingId(handle: string): string | undefined {
    const h = handle.trim();
    return this.plantingToId.get(h.startsWith("#") ? h : `#${h}`);
  }

  boxHandle(id: string): string | undefined {
    return this.idToBox.get(id);
  }

  plantingHandle(id: string): string | undefined {
    return this.idToPlanting.get(id);
  }

  boxHandles(): string[] {
    return Array.from(this.boxToId.keys());
  }
}

/**
 * Assign handles to entities that already exist at scenario start (seeded gardens like demo-garden),
 * in stable array order, so the LLM can reference them and replay stays deterministic. Call once,
 * after bootstrap, before the run loop.
 */
export function seedHandlesFromState(
  handles: HandleRegistry,
  boxes: Array<{ id: string }>,
  plantings: Array<{ id: string }>,
): void {
  for (const box of boxes) {
    handles.registerBox(box.id);
  }
  for (const planting of plantings) {
    handles.registerPlanting(planting.id);
  }
}
