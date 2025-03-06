import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
        <nav className="flex items-center justify-between bg-gray-800 text-white p-4">
            <ul className="flex space-x-6">
                <li className="hover:bg-gray-400"><Link to="/">Overview</Link></li>
                <li className="hover:bg-gray-400"><Link to="/gardens">Gardens</Link></li>
            </ul>
        </nav>

        <main className="bg-black text-white p-4">
            <Outlet/> {/* This is where nested routes will render */}
        </main>
    </>
  );
}