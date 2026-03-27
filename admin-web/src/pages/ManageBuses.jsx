import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Search, Filter, Bus as BusIcon, X,
    Wifi, Battery, Droplets, Wind, Tv, DoorOpen,
    Upload, AlertCircle, CheckCircle2, Loader2, ChevronDown
} from 'lucide-react';

import { API_BASE_URL } from '../config';

const ManageBuses = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingBus, setEditingBus] = useState(null);
    const [busToDelete, setBusToDelete] = useState(null);
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('latest');

    const busTypes = ["Sleeper", "Sofa-Seater", "Super Deluxe", "Non-AC", "AC"];

    const initialFormState = {
        name: '',
        number: '',
        type: 'Sleeper',
        seats: 40,
        amenities: [],
        status: 'Active',
        images: []
    };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    const fileInputRef = React.useRef(null);

    useEffect(() => {
        fetchBuses();
    }, []);

    const fetchBuses = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            console.log(`Fetching from: ${API_BASE_URL}/buses`);
            const response = await fetch(`${API_BASE_URL}/buses`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Fetched data:', data);

            if (data.success) {
                setBuses(data.data || []);
            } else {
                setError(data.error || 'Failed to fetch buses');
            }
        } catch (err) {
            console.error('Core fetch error details:', err);
            setError(`Connection Error: ${err.message}. Please check if backend is running at port 5000.`);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAmenity = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeSelectedFile = (index) => {
        URL.revokeObjectURL(previews[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSaveBus = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingBus
                ? `${API_BASE_URL}/buses/${editingBus._id}`
                : `${API_BASE_URL}/buses`;
            const method = editingBus ? 'PUT' : 'POST';

            const dataToSubmit = new FormData();
            dataToSubmit.append('name', formData.name);
            dataToSubmit.append('number', formData.number);
            dataToSubmit.append('type', formData.type);
            dataToSubmit.append('seats', formData.seats);
            dataToSubmit.append('status', formData.status);
            dataToSubmit.append('amenities', JSON.stringify(formData.amenities));

            // Append existing images URLs using a different name to avoid Multer conflict
            dataToSubmit.append('existingImages', JSON.stringify(formData.images));

            // Append new files using the name expected by Multer
            selectedFiles.forEach(file => {
                dataToSubmit.append('busImages', file);
            });

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Note: Browser sets Content-Type to multipart/form-data with boundary when using FormData
                },
                body: dataToSubmit
            });

            const data = await response.json();
            if (data.success) {
                if (editingBus) {
                    setBuses(buses.map(b => b._id === editingBus._id ? data.data : b));
                } else {
                    setBuses([data.data, ...buses]);
                }
                closeModal();
            } else {
                alert(data.error || 'Operation failed');
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Server error');
        } finally {
            setActionLoading(false);
        }
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setEditingBus(null);
        setFormData(initialFormState);
        setSelectedFiles([]);
        previews.forEach(p => URL.revokeObjectURL(p));
        setPreviews([]);
    };

    const openEditModal = (bus) => {
        setEditingBus(bus);
        setFormData(bus);
        setIsAddModalOpen(true);
    };

    const confirmDelete = (bus) => {
        setBusToDelete(bus);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/buses/${busToDelete._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setBuses(buses.filter(b => b._id !== busToDelete._id));
                setIsDeleteModalOpen(false);
                setBusToDelete(null);
            } else {
                alert(data.error || 'Failed to delete');
            }
        } catch (err) {
            alert('Server error');
        } finally {
            setActionLoading(false);
        }
    };

    const amenityIcons = {
        WiFi: <Wifi size={14} />,
        Charging: <Battery size={14} />,
        Water: <Droplets size={14} />,
        AC: <Wind size={14} />,
        TV: <Tv size={14} />,
        Restroom: <DoorOpen size={14} />
    };

    console.log('Rendering ManageBuses, buses count:', buses.length);

    const filteredBuses = buses
        .filter(b => {
            if (!b) return false;
            const name = b.name || '';
            const number = b.number || '';
            const query = searchTerm.toLowerCase();
            return name.toLowerCase().includes(query) || number.toLowerCase().includes(query);
        })
        .sort((a, b) => {
            if (sortBy === 'latest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
                        <BusIcon className="mr-3 text-blue-600" size={32} />
                        Bus Management
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your fleet, types, and amenities from a central hub.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 text-white font-bold px-6 py-4 rounded-2xl flex items-center shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Plus size={20} className="mr-2" />
                    Add New Bus
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by bus name or number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none placeholder-slate-400"
                    />
                </div>
                <div className="relative group">
                    <button className="bg-slate-50 border-none font-bold text-slate-600 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer flex items-center space-x-2 min-w-[180px]">
                        <Filter size={18} className="text-slate-400" />
                        <span className="flex-1 text-left">Sort: {sortBy === 'latest' ? 'Latest' : 'Oldest'}</span>
                        <ChevronDown size={14} className="text-slate-400 transition-transform group-hover:rotate-180" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 p-2">
                        <button onClick={() => setSortBy('latest')} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${sortBy === 'latest' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>Latest Added</button>
                        <button onClick={() => setSortBy('oldest')} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${sortBy === 'oldest' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>Oldest Added</button>
                    </div>
                </div>
            </div>

            {/* Bus Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="text-blue-600 animate-spin" size={40} />
                            <p className="text-slate-500 font-bold tracking-tight">Loading Fleet Data...</p>
                        </div>
                    ) : error ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4 text-center">
                            <AlertCircle className="text-rose-500" size={40} />
                            <p className="text-rose-600 font-bold tracking-tight">{error}</p>
                            <button onClick={fetchBuses} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">Retry</button>
                        </div>
                    ) : (
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Bus Name</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Bus Number</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Bus Type</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Seats</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredBuses.length > 0 ? filteredBuses.map((bus) => (
                                    <tr key={bus._id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-slate-800">{bus.name}</div>
                                            <div className="flex gap-1.5 mt-1.5">
                                                {bus.amenities?.slice(0, 3).map(a => (
                                                    <span key={a} className="p-1 bg-slate-100 text-slate-400 rounded-lg" title={a}>
                                                        {amenityIcons[a]}
                                                    </span>
                                                ))}
                                                {bus.amenities?.length > 3 && (
                                                    <span className="text-[10px] font-black text-slate-400 self-center">+{bus.amenities.length - 3}</span>
                                                )}
                                                {bus.images?.length > 0 && (
                                                    <span className="p-1 px-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black flex items-center">
                                                        <Upload size={10} className="mr-1" /> {bus.images.length}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-mono font-bold text-slate-600 text-sm">{bus.number}</td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black ${bus.type === 'AC' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {bus.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center font-black text-slate-700">{bus.seats}</td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${bus.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${bus.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <span>{bus.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => openEditModal(bus)}
                                                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(bus)}
                                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center font-bold text-slate-400 tracking-tight">
                                            No buses found in the fleet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeModal} />
                    <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                {editingBus ? 'Edit Bus Record' : 'Create New Bus'}
                            </h2>
                            <button onClick={closeModal} className="p-2 hover:bg-white hover:text-red-500 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveBus} className="p-8 overflow-y-auto max-h-[70vh] no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Bus Name</label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Greenline Express"
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Bus Number</label>
                                    <input
                                        type="text" required
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                        placeholder="BA 1 KHA 1234"
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Bus Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        {busTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Total Seats</label>
                                    <input
                                        type="number" required min="1"
                                        value={formData.seats}
                                        onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="mt-8">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 block mb-4">Amenities</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {Object.keys(amenityIcons).map(amenity => (
                                        <button
                                            key={amenity}
                                            type="button"
                                            onClick={() => handleToggleAmenity(amenity)}
                                            className={`flex items-center p-4 rounded-2xl border-2 transition-all ${formData.amenities.includes(amenity)
                                                ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-500/10'
                                                : 'border-slate-50 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:border-slate-200'
                                                }`}
                                        >
                                            <span className="mr-3">{amenityIcons[amenity]}</span>
                                            <span className="text-xs font-black">{amenity}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 block mb-4">Bus Images</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                    {/* Existing Images */}
                                    {formData.images?.map((img, idx) => (
                                        <div key={`existing-${idx}`} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-100">
                                            <img src={img} alt="Bus" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(idx)}
                                                className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Previews of new files */}
                                    {previews.map((preview, idx) => (
                                        <div key={`preview-${idx}`} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-blue-200">
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeSelectedFile(idx)}
                                                className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                            >
                                                <X size={14} />
                                            </button>
                                            <div className="absolute bottom-0 inset-x-0 bg-blue-600/80 text-[8px] text-white font-black text-center py-1 uppercase tracking-tighter">NEW</div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square flex flex-col items-center justify-center space-y-2 bg-slate-50 text-slate-400 rounded-2xl border-2 border-dashed border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all"
                                    >
                                        <Upload size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add Image</span>
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                />
                            </div>

                            <div className="mt-8">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 block mb-4">Bus Status</label>
                                <div className="flex bg-slate-50 p-1.5 rounded-2xl border-2 border-transparent max-w-sm">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'Active' })}
                                        className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-black transition-all ${formData.status === 'Active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        ACTIVE
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                                        className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-black transition-all ${formData.status === 'Inactive' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        INACTIVE
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full mt-10 bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                                {editingBus ? 'UPDATE BUS DETAILS' : 'CREATE NEW BUS RECORD'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2">Are you sure?</h2>
                        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                            Deleting <span className="text-slate-800 font-bold">{busToDelete?.name}</span> will affect all associated routes and active bookings.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="flex-1 py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mr-2" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageBuses;
