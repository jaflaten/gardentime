import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";
import {GrowZonesView, GrowZoneViewInfo} from "./GrowZonesView.tsx";

interface GardenPageInfo {
    id: string;
    name: string;
    userId: string;
    growZones: GrowZoneViewInfo[];
}



export function GardenPage() {
    const { gardenId } = useParams();
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


    if(!garden) {
        return <p>Loading...</p>
        // kast feil her
    }
    return (
        <>
            <div className="p-4 border border-black rounded-lg mb-4">
                <h1>{garden.name}</h1>
                <p>gardenId: {garden.id}</p>
                <p>userId: {garden.userId}</p>
                
                <GrowZonesView growZones={garden.growZones}/>

                {/*<CropRecordView gardenId={garden?.id}/>*/}

            </div>
        </>
    )
}