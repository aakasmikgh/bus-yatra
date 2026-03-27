import React, { useState, useEffect } from 'react';
import { Plus, Ticket, Search, Filter, Trash2, Tag, Clock, CheckCircle, XCircle, X, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../config';

const PromoCodes = () => {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const initialFormState = {
        code: '',
        title: '',
        description: '',
        discountType: 'Percentage',
        discountValue: '',
        expiryDate: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/coupons/admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setPromos(data.data || []);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/coupons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                setIsAddModalOpen(false);
                setFormData(initialFormState);
                fetchCoupons();
            } else {
                alert(data.message || data.error || 'Failed to create coupon');
            }
        } catch (err) {
            console.error('Coupon Creation Error:', err);
            alert('Error creating coupon: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/coupons/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                fetchCoupons();
            }
        } catch (err) {
            alert('Error toggling status');
        }
    };

    const filteredPromos = promos.filter(p =>
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Promo Codes</h1>
                    <p className="text-slate-500 mt-1">Create and manage discount coupons for your passengers.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl flex items-center shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Plus size={20} className="mr-2" />
                    Create New Coupon
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <Tag size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Coupons</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800">{promos.length}</h3>
                    <p className="text-sm text-slate-500 mt-1">Total defined codes</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                            <CheckCircle size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Now</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800">
                        {promos.filter(p => p.isActive && new Date(p.expiryDate) >= new Date()).length}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Live and valid</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                            <Clock size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expired</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800">
                        {promos.filter(p => new Date(p.expiryDate) < new Date()).length}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Past validity date</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by coupon code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Coupon Code</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Title</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Discount</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium font-sans">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-10">Loading...</td></tr>
                        ) : filteredPromos.map((promo) => (
                            <tr key={promo._id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            < Ticket size={18} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800 block">{promo.code}</span>
                                            <span className="text-[10px] text-slate-400 uppercase font-black">{promo.discountType}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="max-w-[200px]">
                                        <span className="font-bold text-slate-800 block truncate">{promo.title}</span>
                                        <span className="text-xs text-slate-500 line-clamp-1">{promo.description}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="font-bold text-slate-800">
                                        {promo.discountType === 'Percentage' ? `${promo.discountValue}%` : `Rs. ${promo.discountValue}`}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full mb-1 ${promo.isActive && new Date(promo.expiryDate) >= new Date()
                                            ? 'text-emerald-700 bg-emerald-50'
                                            : 'text-rose-700 bg-rose-50'
                                            }`}>
                                            {promo.isActive && new Date(promo.expiryDate) >= new Date() ? 'Active' : 'Expired'}
                                        </span>
                                        <button
                                            onClick={() => handleToggleStatus(promo._id)}
                                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${promo.isActive
                                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                }`}
                                        >
                                            {promo.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Coupon Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-50 px-8 py-6 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                                    <Ticket size={24} />
                                </div>
                                <h2 className="text-2xl font-extrabold text-slate-800">Create New Coupon</h2>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCoupon} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Coupon Code</label>
                                <div className="relative group">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="E.g. SUMMER25"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Coupon Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="E.g. New Year Special"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Description</label>
                                <textarea
                                    required
                                    placeholder="E.g. Get 20% off on all bookings this week"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Discount Type</label>
                                    <select
                                        required
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Percentage">Percentage (%)</option>
                                        <option value="Cash">Cash (Rs.)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder={formData.discountType === 'Percentage' ? 'e.g. 10' : 'e.g. 50'}
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Expiry Date</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input
                                        type="date"
                                        required
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full bg-blue-600 text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center disabled:opacity-70"
                            >
                                {actionLoading ? 'Creating...' : 'Create Coupon'}
                            </button>
                        </form>
                    </div >
                </div >
            )}
        </div >
    );
};

export default PromoCodes;
