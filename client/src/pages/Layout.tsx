import {Outlet} from "react-router-dom";
import {NavBar} from "../components/nav/NavBar.tsx";

export default function Layout() {
  return (
      <>
      <NavBar/>

      <div className="p-4 sm:ml-64">
          <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
              <Outlet/> {/* This is where nested routes will render */}
          </div>
      </div>

</>
)
    ;
}