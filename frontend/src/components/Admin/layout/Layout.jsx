import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../../assets/styles/admin.css';

/**
 * Layout Component
 * Main layout wrapper with Sidebar and content area
 */
function Layout() {
    return (
        <div className="admin-wrapper">
            <div className="admin-layout">
                <Sidebar />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Layout;
