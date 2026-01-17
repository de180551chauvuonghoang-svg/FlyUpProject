import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Layout Component
 * Main layout wrapper with Sidebar and content area
 */
function Layout() {
    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
