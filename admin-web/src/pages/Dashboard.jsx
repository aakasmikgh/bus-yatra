import React, { useState, useEffect } from 'react';
import {
    Users, Bus, Ticket, TrendingUp, ArrowUpRight, ArrowDownRight,
    MapPin, Calendar, CreditCard, ChevronRight, ExternalLink, Loader2,
    Eye, X, Mail, Briefcase, Navigation, Smartphone, User, Phone
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const StatCard = ({ title, value, icon, color, trend, percentage, isPrimary }) => {
    const isPositive = trend === 'up' || parseInt(percentage) > 0;
    const absPercentage = Math.abs(parseInt(percentage) || 0);

    return (
        <div className={`${isPrimary ? 'bg-emerald-600' : 'bg-[#1a1c23]'} p-6 rounded-[2rem] shadow-sm border ${isPrimary ? 'border-emerald-500' : 'border-slate-800/50'} relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]`}>
            {/* Background Glow */}
            {!isPrimary && <div className={`absolute top-0 right-0 w-24 h-24 ${color.replace('bg-', 'bg-opacity-10 bg-')} blur-[50px] rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700`} />}

            <div className="flex items-start justify-between relative z-10">
                <div className={`p-3 rounded-2xl ${isPrimary ? 'bg-white/20' : color} text-white shadow-lg`}>
                    {icon}
                </div>
                {percentage !== undefined && (
                    <span className={`flex items-center text-xs font-bold ${isPositive ? (isPrimary ? 'text-emerald-100' : 'text-emerald-400') : 'text-rose-400'}`}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {absPercentage}%
                    </span>
                )}
            </div>

            <div className="mt-6 relative z-10">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isPrimary ? 'text-emerald-50' : 'text-slate-500'} mb-1`}>{title}</p>
                <h3 className={`text-2xl font-black ${isPrimary ? 'text-white' : 'text-slate-100'} tracking-tight`}>{value}</h3>
            </div>
        </div>
    );
};

// Simple Bar Chart Component
const SimpleBarChart = ({ data, color, labels }) => {
    const max = Math.max(...data, 1);

    return (
        <div className="h-64 w-full flex items-end justify-between px-2 pb-2 gap-3 relative z-10">
            {data.map((amount, i) => {
                const height = (amount / max) * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center group/bar h-full justify-end">
                        <div className="relative w-full flex justify-center items-end h-[90%]">
                            <div
                                style={{ height: `${Math.max(height, 5)}%` }}
                                className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 relative ${height > 0 ? color : 'bg-slate-800'}`}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-white font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-700">
                                    {amount.toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-tighter w-full text-center">
                            {labels[i]}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        stats: { totalRevenue: 0, totalUsers: 0, activeBuses: 0, totalBookings: 0 },
        popularRoutes: [],
        topBuses: [],
        recentBookings: [],
        charts: { labels: [], revenue: [], sales: [] }
    });

    // Modal State
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/analytics`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to load dashboard data');
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const openViewModal = (booking) => {
        setSelectedBooking(booking);
        setIsViewModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500">
                <p className="font-bold text-xl mb-4">{error}</p>
                <button
                    onClick={fetchDashboardData}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                    Retry
                </button>
            </div>
        )
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency', currency: 'NPR', minimumFractionDigits: 0
        }).format(amount || 0).replace('NPR', 'Rs.');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-full">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
                    Bus<span className="text-blue-600">Yatra</span>&nbsp;Dashboard
                </h1>
                <p className="text-slate-500 mt-1 font-medium">Monitoring your transit network data in real-time.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(data.stats.totalRevenue)}
                    icon={<CreditCard size={24} />}
                    color="bg-emerald-500"
                    trend={data.stats.revenueGrowth >= 0 ? 'up' : 'down'}
                    percentage={data.stats.revenueGrowth}
                    isPrimary={true}
                />
                <StatCard
                    title="Total Users"
                    value={data.stats.totalUsers}
                    icon={<Users size={24} />}
                    color="bg-blue-600"
                    trend="up"
                    percentage="0"
                />
                <StatCard
                    title="Active Buses"
                    value={data.stats.activeBuses}
                    icon={<Bus size={24} />}
                    color="bg-indigo-600"
                    trend="up"
                    percentage="0"
                />
                <StatCard
                    title="Total Bookings"
                    value={data.stats.totalBookings}
                    icon={<Ticket size={24} />}
                    color="bg-purple-600"
                    trend={data.stats.bookingGrowth >= 0 ? 'up' : 'down'}
                    percentage={data.stats.bookingGrowth}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-[#1a1c23] p-8 rounded-[2.5rem] border border-slate-800/60 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h2 className="text-lg font-bold text-white">Revenue Over Time</h2>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Total {formatCurrency(data.stats.totalRevenue)}</p>
                        </div>
                        <div className="bg-blue-600/10 text-blue-400 p-2.5 rounded-xl border border-blue-500/20">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    {/* Bar Chart */}
                    <SimpleBarChart data={data.charts.revenue} color="bg-blue-600" labels={data.charts.labels} />
                </div>

                <div className="bg-[#1a1c23] p-8 rounded-[2.5rem] border border-slate-800/60 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h2 className="text-lg font-bold text-white">Tickets Sold over Time</h2>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Total Sales {data.stats.totalBookings}</p>
                        </div>
                        <div className="bg-indigo-600/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
                            <Calendar size={20} />
                        </div>
                    </div>
                    {/* Bar Chart */}
                    <SimpleBarChart data={data.charts.sales} color="bg-indigo-600" labels={data.charts.labels} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Popular Routes */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Most Popular Routes</h2>
                            <p className="text-xs text-slate-400 mt-1 font-bold">Top routes by booking volume</p>
                        </div>
                        <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <ExternalLink size={18} className="text-slate-400" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {data.popularRoutes && data.popularRoutes.length > 0 ? data.popularRoutes.map((route, i) => (
                            <div key={i} className="flex items-center p-4 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black mr-4 shrink-0">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{route.route}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                                        {route.bookings} Bookings • {route.revenue}
                                    </p>
                                </div>
                                <div className="ml-4 text-right">
                                    <p className="text-xs font-black text-blue-600">{route.occupancy}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Occupancy</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-400 text-sm">No booking data yet</div>
                        )}
                    </div>
                </div>

                {/* Top Performing Buses */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Top Performing Buses</h2>
                            <p className="text-xs text-slate-400 mt-1 font-bold">Based on revenue</p>
                        </div>
                        <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <ExternalLink size={18} className="text-slate-400" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {data.topBuses && data.topBuses.length > 0 ? data.topBuses.map((bus, i) => (
                            <div key={i} className="flex items-center p-4 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black mr-4 shrink-0">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{bus.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">{bus.number}</p>
                                </div>
                                <div className="ml-4 text-right">
                                    <p className="text-xs font-black text-slate-800">{bus.revenue}</p>
                                    <p className="text-[9px] text-indigo-500 font-bold uppercase">{bus.trips} Trips</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-400 text-sm">No bus data yet</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Bookings List */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Recent Bookings</h2>
                        <p className="text-xs text-slate-400 mt-1 font-bold">Latest 5 ticket reservations</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ID / Passenger</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Route / Detail</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Seat / Amount</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date / Time</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium">
                            {data.recentBookings && data.recentBookings.length > 0 ? data.recentBookings.slice(0, 5).map((booking) => (
                                <tr key={booking._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                                <Ticket size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-blue-600 uppercase tracking-tighter">#{booking._id?.slice(-6).toUpperCase()}</p>
                                                <p className="text-sm font-bold text-slate-800">{booking.contactName || booking.user?.name || 'Guest'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <div className="flex items-center text-slate-600 font-medium text-sm">
                                            <MapPin size={14} className="mr-1.5 text-slate-300" />
                                            {booking.route ? `${booking.route.origin?.name} → ${booking.route.destination?.name}` : 'Unknown'}
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <div className="flex items-center space-x-3">
                                            <span className="bg-slate-100 px-2 py-1 rounded-lg text-xs font-black text-slate-500 font-mono">Seat {(booking.seats || []).join(', ')}</span>
                                            <span className="text-sm font-black text-slate-800 font-mono tracking-tight">Rs. {booking.totalPrice}</span>
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">{new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </td>
                                    <td className="py-5 text-right">
                                        <button
                                            onClick={() => openViewModal(booking)}
                                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">No recent bookings found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Booking Details Modal */}
            {isViewModalOpen && selectedBooking && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-slate-50 px-8 py-6 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                                    <Ticket size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-800">Booking Details</h2>
                                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">ID: {selectedBooking._id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[70vh]">
                            {/* Passenger Info */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                                    <User size={16} className="mr-2 text-blue-500" />
                                    Passenger Information
                                </h3>
                                <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100/50">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                                        <p className="text-slate-800 font-bold">{selectedBooking.contactName || selectedBooking.user?.name || 'Guest'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contact Phone</label>
                                        <div className="flex items-center text-slate-800 font-bold">
                                            <Phone size={14} className="mr-2 text-slate-400" />
                                            {selectedBooking.contactPhone}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">User Email</label>
                                        <div className="flex items-center text-slate-600 text-sm font-medium">
                                            <Mail size={14} className="mr-2 text-slate-400" />
                                            {selectedBooking.contactEmail || selectedBooking.user?.email || 'Guest@user.com'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trip Info */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                                    <Navigation size={16} className="mr-2 text-blue-500" />
                                    Journey Details
                                </h3>
                                <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bus</label>
                                            <p className="text-slate-800 font-bold flex items-center">
                                                <Bus size={14} className="mr-2 text-slate-400" />
                                                {selectedBooking.bus?.name || 'Bus Info'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Travel Date</label>
                                            <p className="text-slate-800 font-bold flex items-center justify-end">
                                                <Calendar size={14} className="mr-2 text-slate-400" />
                                                {new Date(selectedBooking.bookingDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="py-3 border-y border-slate-200/50">
                                        <div className="flex items-start space-x-3 mb-4">
                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                <MapPin size={14} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Boarding Point</label>
                                                <p className="text-slate-800 font-bold text-sm">{selectedBooking.boardingPoint}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                                <Navigation size={14} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Route</label>
                                                <p className="text-slate-800 font-bold text-sm">
                                                    {selectedBooking.route
                                                        ? `${selectedBooking.route.origin?.name} to ${selectedBooking.route.destination?.name}`
                                                        : 'Route Not Found'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="col-span-1 md:col-span-2 space-y-6">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                                    <Briefcase size={16} className="mr-2 text-blue-500" />
                                    Payment & Seats
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Amount</label>
                                        <div className="text-2xl font-black text-slate-800">Rs. {selectedBooking.totalPrice}</div>
                                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">Paid</div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reserved Seats</label>
                                        <div className="flex flex-wrap gap-2">
                                            {(selectedBooking.seats || []).map(seat => (
                                                <span key={seat} className="px-3 py-1 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs font-black shadow-sm">{seat}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-500/20 text-white">
                                        <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest block mb-2">Payment Method</label>
                                        <div className="text-lg font-black uppercase flex items-center">
                                            <Smartphone size={18} className="mr-2" />
                                            {selectedBooking.paymentMethod || 'Stripe'}
                                        </div>
                                        <p className="text-[10px] font-bold text-blue-100 mt-2">Verified Transaction</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-8 py-3 bg-slate-800 text-white font-black text-sm rounded-2xl hover:bg-slate-900 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
