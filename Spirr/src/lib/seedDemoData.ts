import { nanoid } from "nanoid";
import type { Box, Planting } from "../types";
import { saveBoxes, savePlantings } from "./storage";

export function seedDemoData() {
  const boxes: Box[] = [
    {
      id: nanoid(),
      name: "Kasse A",
      description: "Nærmest terrassen",
      createdAt: new Date().toISOString(),
      layout: { x: 2, y: 2, w: 4, h: 3 },
      zoneType: "BOX",
    },
    {
      id: nanoid(),
      name: "Kasse B",
      description: "Sørvendt",
      createdAt: new Date().toISOString(),
      layout: { x: 8, y: 2, w: 4, h: 3 },
      zoneType: "BOX",
    },
    {
      id: nanoid(),
      name: "Stor bedd",
      description: "Hovedbeddet ved gjerdet",
      createdAt: new Date().toISOString(),
      layout: { x: 4, y: 6, w: 8, h: 4 },
      zoneType: "BOX",
    },
    {
      id: nanoid(),
      name: "Pottekrukker",
      description: "Krukker ved inngangen",
      createdAt: new Date().toISOString(),
      layout: { x: 14, y: 4, w: 4, h: 3 },
      zoneType: "BUCKET",
    },
  ];

  const plantings: Planting[] = [
    { id: nanoid(), boxId: boxes[0].id, plantKey: "tomat_cherry", plantedDate: "2025-05-12", status: "active", notes: "God vekst", year: 2025 },
    { id: nanoid(), boxId: boxes[0].id, plantKey: "basilikum", plantedDate: "2025-05-18", status: "active", year: 2025 },
    { id: nanoid(), boxId: boxes[1].id, plantKey: "gulrot", plantedDate: "2025-04-30", status: "active", year: 2025 },
    { id: nanoid(), boxId: boxes[1].id, plantKey: "løk", plantedDate: "2025-05-02", status: "active", year: 2025 },
    { id: nanoid(), boxId: boxes[2].id, plantKey: "salat", plantedDate: "2025-05-05", status: "active", year: 2025 },
    { id: nanoid(), boxId: boxes[2].id, plantKey: "agurk", plantedDate: "2025-05-10", status: "active", year: 2025 },
    { id: nanoid(), boxId: boxes[3].id, plantKey: "persille", plantedDate: "2025-05-11", status: "active", year: 2025 },
    {
      id: nanoid(),
      boxId: boxes[0].id,
      plantKey: "salat",
      plantedDate: "2024-04-15",
      harvestDate: "2024-06-10",
      status: "harvested",
      year: 2024,
    },
    {
      id: nanoid(),
      boxId: boxes[0].id,
      plantKey: "basilikum",
      plantedDate: "2024-05-01",
      harvestDate: "2024-09-03",
      status: "removed",
      year: 2024,
    },
    {
      id: nanoid(),
      boxId: boxes[1].id,
      plantKey: "tomat_stor",
      plantedDate: "2024-05-10",
      harvestDate: "2024-09-20",
      status: "harvested",
      year: 2024,
    },
    {
      id: nanoid(),
      boxId: boxes[2].id,
      plantKey: "spinat",
      plantedDate: "2024-04-05",
      harvestDate: "2024-05-18",
      status: "harvested",
      year: 2024,
    },
    {
      id: nanoid(),
      boxId: boxes[3].id,
      plantKey: "paprika",
      plantedDate: "2024-05-12",
      harvestDate: "2024-08-30",
      status: "failed",
      notes: "Angrepet av bladlus",
      year: 2024,
    },
  ];

  saveBoxes(boxes);
  savePlantings(plantings);
}
