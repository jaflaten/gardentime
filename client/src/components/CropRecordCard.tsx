import React from "react";
import {CropRecordViewInfo} from "./GrowZoneView.tsx";

interface CropRecordCardProps {
    crop: CropRecordViewInfo;
    highlight?: "history" | "active";
}

export const CropRecordCard: React.FC<CropRecordCardProps> = ({ crop, highlight }) => {
    return (
        <div className={`p-4 border border-black rounded-lg ${highlight === "history" ? "bg-gray-100" : "bg-green-100"}`}>
            <p className="font-semibold">Plant: {crop.plant.name}</p>
            <p>Planting date: {crop.plantingDate}</p>
            {crop.harvestDate && <p>Harvest date: {crop.harvestDate}</p>}
            <p className="font-semibold">Status: {crop.status}</p>
            {crop.outcome && <p>Outcome: {crop.outcome}</p>}
            {crop.notes && <p>Notes: {crop.notes}</p>}
        </div>
    );
};
