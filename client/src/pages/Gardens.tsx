import {Link} from "react-router-dom";

export default function Gardens() {


    // TODO: fetch gardens from backend
    const gardens = [
        {
            id: "1",
            name: "My first garden",
        },
        {
            id: "2",
            name: "My second garden",
        },
    ]


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