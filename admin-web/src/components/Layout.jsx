import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    return (
        <div className="flex bg-slate-50 min-h-screen relative overflow-hidden">
            <Sidebar
                isOpen={isSidebarOpen}
                isCollapsed={isCollapsed}
                toggleCollapse={toggleCollapse}
            />
            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
                <TopBar
                    onMenuClick={toggleSidebar}
                    isCollapsed={isCollapsed}
                    toggleCollapse={toggleCollapse}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
