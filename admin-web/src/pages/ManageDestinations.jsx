import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Search, MapPin, X,
    AlertCircle, CheckCircle2, Loader2, Filter, ChevronDown, ListPlus
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const ManageDestinations = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingDest, setEditingDest] = useState(null);
    const [destToDelete, setDestToDelete] = useState(null);
    const [sortBy, setSortBy] = useState('name');

    const initialFormState = {
        name: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/destinations/admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setDestinations(data.data);
            } else {
                setError(data.error || 'Failed to fetch destinations');
            }
        } catch (err) {
            setError('Could not connect to server. Please ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const token = localStorage.getItem('adminToken');

            if (editingDest) {
                // Single Update
                const response = await fetch(`${API_BASE_URL}/destinations/${editingDest._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name: formData.name.trim() })
                });
                const data = await response.json();
                if (data.success) {
                    setDestinations(destinations.map(d => d._id === editingDest._id ? data.data : d));
                    closeModal();
                } else {
                    alert(data.error || 'Update failed');
                }
            } else if (isBulkMode) {
                // Bulk Create
                const names = formData.name.split('\n')
                    .map(n => n.trim())
                    .filter(n => n.length > 0);

                if (names.length === 0) {
                    alert('Please enter at least one city name');
                    setActionLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/destinations/bulk`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ names })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('BULK REQUEST FAILED:', response.status, errorText);
                    alert(`Server Error (${response.status}): ${errorText.substring(0, 100)}...`);
                    setActionLoading(false);
                    return;
                }

                const data = await response.json();
                if (data.success || data.insertedCount > 0) {
                    alert(data.success ? 'All destinations added successfully!' : `Bulk partial success: Added ${data.insertedCount} destinations.`);
                    fetchDestinations();
                    closeModal();
                } else {
                    alert(data.error || 'Bulk addition failed');
                }
            } else {
                // Single Create
                const response = await fetch(`${API_BASE_URL}/destinations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name: formData.name.trim(), status: 'Active' })
                });
                const data = await response.json();
                if (data.success) {
                    setDestinations([...destinations, data.data]);
                    closeModal();
                } else {
                    alert(data.error || 'Creation failed');
                }
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
            const response = await fetch(`${API_BASE_URL}/destinations/${destToDelete._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setDestinations(destinations.filter(d => d._id !== destToDelete._id));
                setIsDeleteModalOpen(false);
                setDestToDelete(null);
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
        setEditingDest(null);
        setIsBulkMode(false);
        setFormData(initialFormState);
    };

    const openEditModal = (dest) => {
        setEditingDest(dest);
        setIsBulkMode(false);
        setFormData({ name: dest.name });
        setIsModalOpen(true);
    };

    const filteredDestinations = destinations
        .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
                        <MapPin className="mr-3 text-blue-600" size={32} />
                        Destinations
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage travel origins and arrival cities.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setIsBulkMode(true); setIsModalOpen(true); }}
                        className="bg-slate-800 text-white font-bold px-6 py-4 rounded-2xl flex items-center shadow-xl shadow-slate-500/10 hover:bg-slate-900 transition-all active:scale-95"
                    >
                        <ListPlus size={20} className="mr-2" />
                        Bulk Add
                    </button>
                    <button
                        onClick={() => { setIsBulkMode(false); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white font-bold px-6 py-4 rounded-2xl flex items-center shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Plus size={20} className="mr-2" />
                        Add New
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search destinations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none placeholder-slate-400"
                    />
                </div>
                <div className="relative group">
                    <button className="bg-slate-50 border-none font-bold text-slate-600 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer flex items-center space-x-2 min-w-[180px]">
                        <Filter size={18} className="text-slate-400" />
                        <span className="flex-1 text-left">Sort: {sortBy === 'name' ? 'Name' : 'Latest'}</span>
                        <ChevronDown size={14} className="text-slate-400 transition-transform group-hover:rotate-180" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 p-2">
                        <button onClick={() => setSortBy('name')} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${sortBy === 'name' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>Alphabetical</button>
                        <button onClick={() => setSortBy('latest')} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${sortBy === 'latest' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>Latest Added</button>
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="text-blue-600 animate-spin" size={40} />
                            <p className="text-slate-500 font-bold tracking-tight">Loading Destinations...</p>
                        </div>
                    ) : error ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4 text-center">
                            <AlertCircle className="text-rose-500" size={40} />
                            <p className="text-rose-600 font-bold tracking-tight">{error}</p>
                            <button onClick={fetchDestinations} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">Retry</button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-20">#</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">City Name</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Added Date</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredDestinations.length > 0 ? filteredDestinations.map((dest, idx) => (
                                    <tr key={dest._id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-slate-800 flex items-center">
                                                <MapPin className="mr-2 text-slate-300" size={16} />
                                                {dest.name}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-slate-500">
                                            {new Date(dest.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => openEditModal(dest)}
                                                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => { setDestToDelete(dest); setIsDeleteModalOpen(true); }}
                                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center font-bold text-slate-400 tracking-tight">
                                            No destinations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeModal} />
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                {editingDest ? 'Edit Destination' : isBulkMode ? 'Bulk Add Cities' : 'Add New City'}
                            </h2>
                            <button onClick={closeModal} className="p-2 hover:bg-white hover:text-red-500 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                                        {isBulkMode ? 'City Names (One per line)' : 'City Name'}
                                    </label>
                                    {isBulkMode ? (
                                        <textarea
                                            required
                                            rows={8}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Kathmandu&#10;Pokhara&#10;Lumbini&#10;..."
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all resize-none"
                                        />
                                    ) : (
                                        <input
                                            type="text" required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Kathmandu"
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
                                        />
                                    )}
                                    {isBulkMode && (
                                        <p className="text-[10px] text-slate-400 font-bold ml-1 uppercase tracking-tighter">Enter multiple cities separated by a new line. You can add up to 15-20 easily.</p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full mt-10 bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                                {editingDest ? 'UPDATE DESTINATION' : isBulkMode ? 'BULK CREATE' : 'CREATE DESTINATION'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2">Are you sure?</h2>
                        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                            Deleting <span className="text-slate-800 font-bold">{destToDelete?.name}</span> may affect existing routes.
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

export default ManageDestinations;
