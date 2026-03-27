import React, { useState, useEffect } from 'react';
import {
    Plus, MapPin, Search, Filter, Trash2, Edit, Navigation, Clock, TrendingUp,
    X, AlertCircle, CheckCircle2, Loader2, ChevronDown, Calendar, Wallet, Bus as BusIcon
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const ManageRoutes = () => {
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);
    const [routeToDelete, setRouteToDelete] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New state for boarding points input
    const [bpInput, setBpInput] = useState('');

    const initialFormState = {
        bus: '',
        origin: '',
        destination: '',
        departureDate: '',
        departureTime: '',
        departureAmPm: 'AM',
        arrivalTime: '00:00',
        arrivalAmPm: 'AM',
        fare: '',
        distance: '',
        boardingPoints: [],
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'Active'
    };

    const [formData, setFormData] = useState(initialFormState);

    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        console.log('Fetching all route dependencies...');
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [routesRes, busesRes, destsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/routes/admin`, { headers }),
                fetch(`${API_BASE_URL}/buses`, { headers }),
                fetch(`${API_BASE_URL}/destinations/admin`, { headers })
            ]);

            const routesData = await routesRes.json();
            const busesData = await busesRes.json();
            const destsData = await destsRes.json();

            console.log('Routes Raw Data:', routesData);
            console.log('Buses Raw Data:', busesData);
            console.log('Destinations Raw Data:', destsData);

            if (routesData.success) {
                setRoutes(routesData.data);
            } else {
                console.warn('Failed to fetch routes:', routesData.error);
            }

            if (busesData.success) {
                // Showing all buses, but logging if they are active
                console.log(`Buses count: ${busesData.data.length}`);
                setBuses(busesData.data);
            } else {
                console.warn('Failed to fetch buses:', busesData.error);
            }

            if (destsData.success) {
                console.log(`Destinations count: ${destsData.data.length}`);
                setDestinations(destsData.data);
            } else {
                console.warn('Failed to fetch destinations:', destsData.error);
            }

        } catch (err) {
            setError('Failed to connect to server. Check logs.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.bus) return alert('Please select a bus');
        if (!formData.origin) return alert('Please select an origin city');
        if (!formData.destination) return alert('Please select a destination city');

        if (formData.origin === formData.destination) {
            alert('Origin and Destination cannot be the same');
            return;
        }

        setActionLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingRoute
                ? `${API_BASE_URL}/routes/${editingRoute._id}`
                : `${API_BASE_URL}/routes`;
            const method = editingRoute ? 'PUT' : 'POST';

            // Format data for backend
            const payload = {
                ...formData,
                departureTime: `${formData.departureTime} ${formData.departureAmPm}`,
                arrivalTime: `${formData.arrivalTime} ${formData.arrivalAmPm}`,
                fare: Number(formData.fare),
                distance: formData.distance ? Number(formData.distance) : undefined
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                if (editingRoute) {
                    setRoutes(routes.map(r => r._id === editingRoute._id ? data.data : r));
                } else {
                    setRoutes([...routes, data.data]);
                }
                closeModal();
            } else {
                alert(data.error || 'Failed to save route');
            }
        } catch (err) {
            alert('Server error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/routes/${routeToDelete._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setRoutes(routes.filter(r => r._id !== routeToDelete._id));
                setIsDeleteModalOpen(false);
            } else {
                alert(data.error || 'Failed to delete');
            }
        } catch (err) {
            alert('Server error');
        } finally {
            setActionLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRoute(null);
        setFormData(initialFormState);
        setBpInput('');
    };

    const openEditModal = (route) => {
        setEditingRoute(route);

        // Parse times robustly
        const depParts = (route.departureTime || '').split(' ');
        const arrParts = (route.arrivalTime || '').split(' ');

        setFormData({
            bus: route.bus?._id || '',
            origin: route.origin?._id || '',
            destination: route.destination?._id || '',
            departureTime: depParts[0] || '',
            departureAmPm: depParts[1] || 'AM',
            arrivalTime: arrParts[0] || '00:00',
            arrivalAmPm: arrParts[1] || 'AM',
            fare: route.fare?.toString() || '',
            distance: route.distance?.toString() || '',
            boardingPoints: route.boardingPoints || [],
            availableDays: route.availableDays || DAYS,
            status: route.status || 'Active'
        });
        setIsModalOpen(true);
    };

    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            availableDays: prev.availableDays.includes(day)
                ? prev.availableDays.filter(d => d !== day)
                : [...prev.availableDays, day]
        }));
    };

    const addBoardingPoint = () => {
        if (!bpInput.trim()) return;
        if (formData.boardingPoints.includes(bpInput.trim())) return setBpInput('');
        setFormData(prev => ({
            ...prev,
            boardingPoints: [...prev.boardingPoints, bpInput.trim()]
        }));
        setBpInput('');
    };

    const removeBoardingPoint = (point) => {
        setFormData(prev => ({
            ...prev,
            boardingPoints: prev.boardingPoints.filter(p => p !== point)
        }));
    };

    const filteredRoutes = routes.filter(r =>
        (r.origin?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.destination?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.bus?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
                        <Navigation className="mr-3 text-blue-600" size={32} />
                        Route Management
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Configure paths, schedules, and pricing for your fleet.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white font-black px-6 py-4 rounded-2xl flex items-center shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Plus size={20} className="mr-2" />
                    Define New Route
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-bold">
                {[
                    { label: 'Total Routes', value: routes.length, icon: <Navigation className="text-blue-600" />, color: 'bg-blue-50' },
                    { label: 'Total Buses', value: buses.length, icon: <BusIcon className="text-indigo-600" />, color: 'bg-indigo-50' },
                    { label: 'City Hubs', value: destinations.length, icon: <MapPin className="text-emerald-600" />, color: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
                        <div className={`p-4 rounded-2xl ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <h3 className="text-2xl text-slate-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="text-blue-600 animate-spin" size={40} />
                            <p className="text-slate-500 font-bold tracking-tight">Loading Routes...</p>
                        </div>
                    ) : error ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4 text-center">
                            <AlertCircle className="text-rose-500" size={40} />
                            <p className="text-rose-600 font-bold tracking-tight">{error}</p>
                            <button onClick={fetchAllData} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">Retry</button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Route / Bus</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timing & Fare</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Boarding Points</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Schedule</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRoutes.length > 0 ? filteredRoutes.map((route) => (
                                    <tr key={route._id} className="hover:bg-slate-50/30 transition-colors group font-bold">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 text-sm">{route.origin?.name} → {route.destination?.name}</span>
                                                <span className="text-[10px] text-blue-600 uppercase tracking-tighter flex items-center mt-1">
                                                    <BusIcon size={12} className="mr-1" />
                                                    {route.bus?.name || 'Unknown Bus'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col text-xs text-slate-600">
                                                <span className="text-slate-800 font-bold">NPR {route.fare}</span>
                                                <span className="mt-1 flex items-center text-[10px]"><Clock size={10} className="mr-1 opacity-50" /> {route.departureTime}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {route.boardingPoints?.length > 0 ? route.boardingPoints.map((p, idx) => (
                                                    <span key={idx} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] whitespace-nowrap">{p}</span>
                                                )) : <span className="text-slate-300 text-[9px] italic">No boarding points</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center flex-wrap gap-1 max-w-[150px] mx-auto">
                                                {DAYS.map(day => (
                                                    <div key={day} className={`w-6 h-6 rounded-md flex items-center justify-center text-[8px] border ${route.availableDays?.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                                                        {day[0]}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => openEditModal(route)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => { setRouteToDelete(route); setIsDeleteModalOpen(true); }} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center text-slate-400 tracking-tight">No routes found matching your search.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Define New Route Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeModal} />
                    <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 uppercase">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                {editingRoute ? 'Edit Route' : 'Define New Route'}
                            </h2>
                            <button onClick={closeModal} className="p-2 hover:bg-white hover:text-red-500 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Bus Selection */}
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Bus</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.bus}
                                            onChange={(e) => setFormData({ ...formData, bus: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Choose an active bus...</option>
                                            {buses.length > 0 ? buses.map(b => (
                                                <option key={b._id} value={b._id}>
                                                    {b.name} ({b.number}) - {b.type} {b.status !== 'Active' ? '(INACTIVE)' : ''}
                                                </option>
                                            )) : <option disabled>Loading buses...</option>}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                    {buses.length === 0 && <p className="text-[10px] text-rose-500 ml-1 font-bold italic">No buses found. Please add buses first.</p>}
                                </div>

                                {/* Origin & Destination */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Origin City</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.origin}
                                            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select departure city...</option>
                                            {destinations.map(d => (
                                                <option key={d._id} value={d._id}>{d.name} {d.status !== 'Active' ? '(INACTIVE)' : ''}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                    {destinations.length === 0 && <p className="text-[10px] text-rose-500 ml-1 font-bold italic">No destinations found.</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Arrival City</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.destination}
                                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select destination city...</option>
                                            {destinations.map(d => (
                                                <option key={d._id} value={d._id} disabled={d._id === formData.origin}>{d.name} {d.status !== 'Active' ? '(INACTIVE)' : ''}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                </div>

                                {/* Timing */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Departure Time</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text" required placeholder="07:30"
                                            value={formData.departureTime}
                                            onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                                            className="flex-1 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
                                        />
                                        <select
                                            value={formData.departureAmPm}
                                            onChange={(e) => setFormData({ ...formData, departureAmPm: e.target.value })}
                                            className="w-24 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 rounded-2xl px-2 text-xs font-black text-blue-600 uppercase cursor-pointer"
                                        >
                                            <option>AM</option>
                                            <option>PM</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Arrival Time</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text" required placeholder="05:00"
                                            value={formData.arrivalTime}
                                            onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                                            className="flex-1 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
                                        />
                                        <select
                                            value={formData.arrivalAmPm}
                                            onChange={(e) => setFormData({ ...formData, arrivalAmPm: e.target.value })}
                                            className="w-24 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 rounded-2xl px-2 text-xs font-black text-blue-600 uppercase cursor-pointer"
                                        >
                                            <option>AM</option>
                                            <option>PM</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Boarding Points Section */}
                                <div className="col-span-1 md:col-span-2 space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center">
                                        <MapPin size={12} className="mr-1 text-blue-500" /> Boarding Points
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="e.g. Kalanki Chowk"
                                            value={bpInput}
                                            onChange={(e) => setBpInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBoardingPoint())}
                                            className="flex-1 bg-white border-2 border-transparent focus:border-blue-500/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all shadow-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={addBoardingPoint}
                                            className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-all font-black text-xs uppercase"
                                        >
                                            ADD
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {formData.boardingPoints.length > 0 ? formData.boardingPoints.map((point, i) => (
                                            <div key={i} className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center space-x-2 shadow-sm animate-in zoom-in duration-200">
                                                <span className="text-sm font-bold text-slate-600">{point}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeBoardingPoint(point)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )) : <p className="text-[10px] text-slate-400 italic">No boarding points added yet.</p>}
                                    </div>
                                </div>

                                {/* Price & Distance */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fare (NPR)</label>
                                    <div className="relative">
                                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="number" required placeholder="1200"
                                            value={formData.fare}
                                            onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-slate-400">Distance (KM) - Optional</label>
                                    <input
                                        type="number" placeholder="200"
                                        value={formData.distance}
                                        onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
                                    />
                                </div>

                                {/* Available Days */}
                                <div className="col-span-1 md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Schedule (Available Days)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS.map(day => (
                                            <button
                                                key={day} type="button"
                                                onClick={() => toggleDay(day)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${formData.availableDays.includes(day) ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                {day.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full mt-12 bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center uppercase tracking-widest"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                                {editingRoute ? 'Update Route Info' : 'Publish New Route'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-white w-full max-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2 uppercase">Delete Route?</h2>
                        <p className="text-slate-500 text-xs font-bold mb-8 leading-relaxed uppercase tracking-tight">
                            This route will be permanently removed.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all">CANCEL</button>
                            <button onClick={handleDelete} disabled={actionLoading} className="flex-1 py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center">
                                {actionLoading ? <Loader2 className="animate-spin" /> : 'DELETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageRoutes;
