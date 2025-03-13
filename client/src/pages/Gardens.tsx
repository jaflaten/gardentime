import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";


interface GardenInfo {
    id: string;
    name: string;
}
export default function Gardens() {

    const [gardens, setGardens] = useState<GardenInfo[]>([])

    const baseUrl = 'http://localhost:8080'
    useEffect(() => {
        axios.get(`${baseUrl}/api/garden/user/f1234abc-5678-90de-abcd-ef1234567890`)
            .then(res => {
                console.log(res)
                setGardens(res.data)
            })
    }
    , [])


  return (
    <>
        <div className="grid grid-cols-1 gap-4">
        {gardens.map((garden) => (
            <div className="hover:border-black">
                <Link to={`/garden/${garden.id}`}>{garden.name}</Link>
            </div>
        ))}
        </div>
    </>
  );
}