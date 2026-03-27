import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Bus,
    LogOut,
    Users,
    ShieldCheck,
    Navigation,
    Calendar,
    Tag,
    MapPin,
    Smartphone,
    Image as ImageIcon
} from 'lucide-react';

const Sidebar = ({ isOpen, isCollapsed, toggleCollapse }) => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { name: 'Manage Buses', icon: <Bus size={20} />, path: '/manage-buses' },
        { name: 'Destinations', icon: <MapPin size={20} />, path: '/destinations' },
        { name: 'Manage Routes', icon: <Navigation size={20} />, path: '/manage-routes' },
        { name: 'Bookings', icon: <Calendar size={20} />, path: '/bookings' },
        { name: 'Users', icon: <Users size={20} />, path: '/users' },
        { name: 'Promo Codes', icon: <Tag size={20} />, path: '/promo-codes' },
        { name: 'Banners', icon: <ImageIcon size={20} />, path: '/banners' },
    ];

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
        }
    };

    return (
        <aside className={`
            ${isCollapsed ? 'w-20' : 'w-72'} 
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            sidebar-gradient h-screen text-slate-300 flex flex-col fixed left-0 top-0 z-50 
            transition-all duration-300 border-r border-slate-800/50
        `}>
            <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                    <ShieldCheck className="text-white" size={24} />
                </div>
                {!isCollapsed && (
                    <div className="animate-in fade-in duration-300">
                        <h1 className="text-xl font-bold text-white tracking-tight">Bus<span className="text-blue-500">Yatra</span></h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Admin Panel</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
                {!isCollapsed && (
                    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 animate-in fade-in duration-300">Main Menu</p>
                )}
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center ${isCollapsed ? 'justify-center py-4' : 'px-4 py-3'} rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-blue-600/10 text-white'
                                : 'hover:bg-slate-800/50 hover:text-white'
                                }`}
                            title={isCollapsed ? item.name : ''}
                        >
                            <span className={`transition-colors ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-400'}`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && (
                                <span className="font-medium text-sm animate-in fade-in duration-300">{item.name}</span>
                            )}
                            {!isCollapsed && isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className={`p-4 mt-auto border-t border-slate-800/50 ${isCollapsed ? 'flex justify-center' : ''}`}>
                <button
                    onClick={handleLogout}
                    className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'} rounded-xl text-slate-400 hover:text-white hover:bg-red-500/10 transition-all duration-200 w-full group`}
                >
                    <LogOut size={20} className={`${isCollapsed ? '' : 'mr-3'} group-hover:text-red-500`} />
                    {!isCollapsed && <span className="font-medium text-sm text-left animate-in fade-in duration-300">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
