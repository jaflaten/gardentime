import {Link} from "react-router-dom";

export interface GrowAreaViewInfo {
    id: string;
    name: string;
    zoneSize: string;
    zoneType: string;
    cropRecord: string[];
    gardenId: string;
    notes: string;
    nrOfRows: number;
}


export function GrowZonesListView({growZones}: { growZones: GrowAreaViewInfo[] }) {
    return (
        <>
            <h2 className="text-xl mb-4">Grow Areas</h2>
            {growZones.length === 0 ? <EmptyGrowZonesMessage /> : (
                <div className="grid grid-cols-1 gap-4">
                    {growZones.map((item) => (
                        <Link to={`/growarea/${item.id}`} key={item.id}>
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
            )}
        </>
    );
};

function EmptyGrowZonesMessage() {
    return (
        <div className="text-gray-600">
            <p>No grow areas added yet.</p>
            {<button className="mt-2 bg-green-500 text-white px-4 py-2 rounded">Add Grow Area</button> }
        </div>
    );
}
