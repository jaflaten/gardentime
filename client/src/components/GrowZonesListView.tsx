import {Link} from "react-router-dom";

export interface GrowZoneViewInfo {
    id: string;
    name: string;
    zoneSize: string;
    zoneType: string;
    cropRecord: string[];
    gardenId: string;
    notes: string;
    nrOfRows: number;
}


export function GrowZonesListView({growZones}: { growZones: GrowZoneViewInfo[] }) {
    return (
        <>
            <h2 className="text-xl mb-4">GrowZones</h2>
            <div className="grid grid-cols-1 gap-4">
                {growZones.map((item) => (
                    <Link to={`/growarea/${item.id}`}>
                        <div className="bg-amber-200 p-4 flex">
                            <p>{item.name}</p>
                            <div className="ml-auto flex space-x-4">
                                <span>edit</span>
                                <span>delete</span>
                            </div>
                        </div>
                    </Link>
                ))} //TODO vise resten av informasjonen
            </div>
        </>
    );
};