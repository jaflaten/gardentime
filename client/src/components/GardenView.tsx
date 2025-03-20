import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";
import {GrowZonesListView, GrowZoneViewInfo} from "./GrowZonesListView.tsx";

interface GardenPageInfo {
    id: string;
    name: string;
    userId: string;
    growZones: GrowZoneViewInfo[];
}


export function GardenView() {
    const {gardenId} = useParams();
    const [garden, setGarden] = useState<GardenPageInfo>()
    const baseUrl = 'http://localhost:8080'

    useEffect(() => {
            axios.get(`${baseUrl}/api/garden/${gardenId}`)
                .then(res => {
                    console.log(res)
                    setGarden(res.data)
                })
        }
        , [gardenId])


    if (!garden) {
        return <p>Loading...</p>
        // kast feil her
    }
    return (
        <>
            <div className="p-4 border border-black rounded-lg mb-4">
                <div className="mb-8 bg-gray-200 p-4">
                    <h1>{garden.name}</h1>
                    <p>gardenId: {garden.id}</p>
                    <p>userId: {garden.userId}</p>
                </div>
                <div className="mt-4">
                    <GrowZonesListView growZones={garden.growZones}/>
                </div>

                {/*<CropRecordView gardenId={garden?.id}/>*/}

            </div>
        </>
    )
}