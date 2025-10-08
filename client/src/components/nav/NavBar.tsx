import {NavItem} from "./NavItem.tsx";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";


export function NavBar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>

            <button data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar"
                    aria-controls="default-sidebar" type="button"
                    className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100">
                <span className="sr-only">Open sidebar</span>
                <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"
                     xmlns="http://www.w3.org/2000/svg">
                    <path clip-rule="evenodd" fill-rule="evenodd"
                          d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                </svg>
            </button>

            <aside id="default-sidebar"
                   className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0"
                   aria-label="Sidebar">
                <div className="h-full px-3 py-4 overflow-y-auto bg-gray-800 flex flex-col">
                    <div className="flex-1">
                        <ul className="space-y-2 font-medium">
                            <NavItem to="/" name="Dashboard"/>
                            <NavItem to="/gardens" name="Gardens"/>
                        </ul>
                    </div>

                    {/* User section at bottom */}
                    <div className="border-t border-gray-700 pt-4 mt-4">
                        {user && (
                            <div className="px-3 py-2 text-sm text-gray-300 mb-2">
                                <div className="font-medium">{user.username}</div>
                                <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full p-2 text-gray-300 rounded-lg hover:bg-gray-700 group"
                        >
                            <svg className="w-5 h-5 text-gray-400 transition duration-75 group-hover:text-gray-300"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                            </svg>
                            <span className="ms-3">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

        </>

    )

}