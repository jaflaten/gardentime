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


export function GrowZonesView ({growZones}: {growZones: GrowZoneViewInfo[]}) {
    return (
        <ul>
            {growZones.map((item) => (
                <p>{item.name}</p>
            ))} //TODO vise resten av informasjonen
        </ul>
    );
};