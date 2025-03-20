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
        <ul className="list-disc ml-12" >
        {gardens.map((garden) => (
            <li className="p-4 hover:bg-gray-200" >
                <Link to={`/garden/${garden.id}`}>{garden.name}</Link>
            </li>
        ))}
        </ul>
    </>
  );
}