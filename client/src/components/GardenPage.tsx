import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";

export function GardenPage() {
    const { gardenId } = useParams();
    const [garden, setgarden] = useState({id: 123})

    useEffect(() => {
        // TODO: get garden from backend getGardenById(gardenId)
    }, [gardenId ])



    return (
        <>
            <div className="p-4 border border-black rounded-lg mb-4">
                <p>GardenId: {gardenId}</p>
                
                {/*<GrowZoneView gardenId={garden?.id}*/}

                {/*<CropRecordView gardenId={garden?.id}/>*/}

            </div>
        </>
    )
}