import {Link, useLocation} from "react-router-dom";

interface NavItemProps {
    to: string;
    name: string;
}

export function NavItem({ to, name }: NavItemProps) {
    const location = useLocation();
    const isNavItemActive = location.pathname === to;

    return (
        <li>
            <Link to={to} className={`flex items-center p-2 text-white hover:text-gray-200 rounded-lg group ${isNavItemActive ? 'underline' : ''}`}>
                <span className="ms-3">{name}</span>
            </Link>
        </li>
    );
}
