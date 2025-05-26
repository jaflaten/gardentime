import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";
import { CropRecordCard } from "./CropRecordCard.tsx";

export interface GrowZoneViewInfo {
    id: string;
    name: string;
    zoneSize: string;
    zoneType: string;
    cropRecord: CropRecordViewInfo[];
    gardenId: string;
    notes: string;
    nrOfRows: number;
}

export interface CropRecordViewInfo {
    id?: string;
    name?: string;
    description?: string;
    plantingDate: string;
    harvestDate?: string;
    plant: PlantInfoView;
    status?: CropStatusViewInfo;
    growZoneId: number;
    outcome?: string;
    notes?: string;
}

export interface PlantInfoView {
    id?: number;
    name: string;
    scientificName?: string;
    plantType?: PlantType;
    maturityTime?: number;
    growingSeason?: GrowingSeason;
    sunReq?: string;
    waterReq?: string;
    soilType?: string;
    spaceReq?: string;
}

export enum CropStatusViewInfo {
    PLANTED = "PLANTED",
    GROWING = "GROWING",
    HARVESTED = "HARVESTED",
    DISEASED = "DISEASED",
    FAILED = "FAILED",
    UNKNOWN = "UNKNOWN"
}

export enum GrowingSeason {
    WINTER = "WINTER",
    SPRING = "SPRING",
    SUMMER = "SUMMER",
    AUTUMN = "AUTUMN",
}

export enum PlantType {
    ROOT_VEGETABLE = "ROOT_VEGETABLE",
    LEAFY_GREEN = "LEAFY_GREEN",
    TUBER = "TUBER",
    FRUIT_VEGETABLE = "FRUIT_VEGETABLE",
    HERB = "HERB",
    LEGUME = "LEGUME",
    GRAIN = "GRAIN",
    FLOWERING_PLANT = "FLOWERING_PLANT",
    ALLIUM = "ALLIUM",
}

export function GrowZoneView() {
    const {growzoneId} = useParams();
    const [growZone, setGrowZone] = useState<GrowZoneViewInfo>()

    const baseUrl = 'http://localhost:8080'

    useEffect(() => {
            axios.get(`${baseUrl}/api/growzone/${growzoneId}`)
                .then(res => {
                    console.log(res)
                    setGrowZone(res.data)
                })
        }
        , [growzoneId])


    if (!growZone) {
        return <p>Loading...</p>
        // kast feil her
    }
//TODO finn ut kvifor vi gjer dobbelt kall når vi går mot lenker
    return (
        <>
            <h2 className="text-2xl mb-4">{growZone.name}</h2>
            <div className="mb-8 bg-gray-200 p-4">
                <p>ZoneType: {growZone.zoneType}</p>
                <p>Size: {growZone.zoneSize}</p>
            </div>

            <h3 className="text-xl mb-5">Plants</h3>
            <div className="grid grid-cols-1 gap-4">
                {growZone.cropRecord
                    .filter(crop => crop.status !== CropStatusViewInfo.HARVESTED)
                    .map(crop => (
                        <CropRecordCard key={crop.id} crop={crop} highlight="active" />
                    ))}
            </div>

            <h3 className="text-xl mt-10 mb-5">History</h3>
            <div className="grid grid-cols-1 gap-4">
                {growZone.cropRecord
                    .filter(crop => crop.status === CropStatusViewInfo.HARVESTED)
                    .map(crop => (
                        <CropRecordCard key={crop.id} crop={crop} highlight="history" />
                    ))}
            </div>

        </>
    );

};