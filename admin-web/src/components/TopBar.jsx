import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, User, ChevronDown, Check, X, Clock, UserPlus, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const TopBar = ({ onMenuClick, isCollapsed, toggleCollapse }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('adminUser') || '{"name": "Admin", "role": "admin"}');

    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(data.data);
                setUnreadCount(data.data.filter(n => !n.isRead).length);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const clearAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to clear all notifications?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${API_BASE_URL}/notifications/clear`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <header className="h-20 bg-white border-b border-slate-200/60 sticky top-0 z-40 px-6 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center flex-1 max-w-xl">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={onMenuClick}
                    className="mr-2 p-2.5 text-slate-500 lg:hidden hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <Menu size={24} />
                </button>

                {/* Desktop Collapse Toggle */}
                <button
                    onClick={toggleCollapse}
                    className="hidden lg:flex mr-4 p-2.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm group"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <Menu size={20} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-90' : ''}`} />
                </button>

                <div className="relative w-full group hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search for something..."
                        className="w-full bg-slate-100/50 border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none text-slate-600"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-3">
                {/* Notifications Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-2.5 rounded-xl transition-all relative group ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <>
                            {/* Backdrop to close */}
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />

                            {/* Dropdown Panel */}
                            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="font-black text-slate-800 tracking-tight">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[320px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                                <Bell size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400">No notifications yet</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {notifications.map((notification) => (
                                                <div
                                                    key={notification._id}
                                                    className={`p-5 flex items-start space-x-4 transition-colors group ${!notification.isRead ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${notification.type === 'UserCreated' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        {notification.type === 'UserCreated' ? <UserPlus size={18} /> : <Ticket size={18} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-xs font-black text-slate-800 tracking-tight truncate pr-2">{notification.title}</p>
                                                            <div className="flex items-center space-x-2 shrink-0">
                                                                {!notification.isRead && (
                                                                    <button
                                                                        onClick={() => markAsRead(notification._id)}
                                                                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-all"
                                                                        title="Mark as read"
                                                                    >
                                                                        <Check size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-600 leading-snug">{notification.message}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center uppercase tracking-wider">
                                                            <Clock size={10} className="mr-1" />
                                                            {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notification.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                                        <button
                                            onClick={clearAllNotifications}
                                            className="text-xs font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors"
                                        >
                                            Clear All Notifications
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

                <div className="relative group">
                    <button className="flex items-center space-x-3 p-1.5 hover:bg-slate-100 rounded-2xl transition-all group">
                        <div className="w-9 h-9 bg-blue-100 text-blue-600 font-bold rounded-xl flex items-center justify-center text-sm shadow-sm shrink-0 uppercase">
                            {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'AD'}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-xs font-bold text-slate-700 leading-none tracking-tight">{user.name || 'Admin User'}</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold uppercase tracking-wider">{user.role || 'Admin'}</p>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 transition-transform group-hover:rotate-180" />
                    </button>

                    {/* Logout Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold"
                        >
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;

