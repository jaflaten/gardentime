import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import api from "../services/api";
import {GrowZonesListView, GrowAreaViewInfo} from "./GrowZonesListView.tsx";
import AddGrowZoneModal from "./AddGrowZoneModal.tsx";

interface GardenPageInfo {
    id: string;
    name: string;
    userId: string;
    growAreas: GrowAreaViewInfo[];
}


export function GardenView() {
    const {gardenId} = useParams();
    const [garden, setGarden] = useState<GardenPageInfo>()
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchGarden = () => {
        api.get(`/gardens/${gardenId}`)
            .then(res => {
                console.log(res)
                setGarden(res.data)
                setLoading(false)
            })
            .catch(err => {
                console.error('Error fetching garden:', err)
                setError('Failed to load garden')
                setLoading(false)
            })
    };

    useEffect(() => {
            fetchGarden()
        }
        , [gardenId])


    if (loading) {
        return <div className="p-4">Loading garden...</div>
    }

    if (error) {
        return <div className="p-4 text-red-600">{error}</div>
    }

    if (!garden) {
        return <div className="p-4">Garden not found</div>
    }

    return (
        <>
            <div className="p-4 border border-black rounded-lg mb-4">
                <div className="mb-8 bg-gray-200 p-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{garden.name}</h1>
                        <p className="text-sm text-gray-600">Garden ID: {garden.id}</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                        Add Grow Area
                    </button>
                </div>
                <div className="mt-4">
                    <GrowZonesListView growZones={garden.growAreas}/>
                </div>

                {/*<CropRecordView gardenId={garden?.id}/>*/}

            </div>

            <AddGrowZoneModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                gardenId={gardenId!}
                onGrowZoneAdded={fetchGarden}
            />
        </>
    )
}