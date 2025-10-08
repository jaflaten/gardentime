import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import api from "../services/api";


interface GardenInfo {
    id: string;
    name: string;
}
export default function Gardens() {

    const [gardens, setGardens] = useState<GardenInfo[]>([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        api.get('/gardens')
            .then(res => {
                console.log(res)
                setGardens(res.data)
                setLoading(false)
            })
            .catch(err => {
                console.error('Error fetching gardens:', err)
                setError('Failed to load gardens')
                setLoading(false)
            })
    }, [])

    if (loading) {
        return <div className="p-4">Loading gardens...</div>
    }

    if (error) {
        return <div className="p-4 text-red-600">{error}</div>
    }

    if (gardens.length === 0) {
        return <div className="p-4">No gardens found. Create your first garden!</div>
    }

    return (
        <>
            <h2 className="text-2xl font-bold mb-4">My Gardens</h2>
            <ul className="list-disc ml-12" >
            {gardens.map((garden) => (
                <li key={garden.id} className="p-4 hover:bg-gray-200" >
                    <Link to={`/garden/${garden.id}`}>{garden.name}</Link>
                </li>
            ))}
            </ul>
        </>
    );
}