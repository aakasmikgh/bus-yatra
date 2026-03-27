import React, { useState, useEffect } from 'react';
import {
    Upload,
    Trash2,
    Home,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Plus,
    Image as ImageIcon,
    LayoutGrid,
    MousePointer2,
    Settings2,
    X,
    Type
} from 'lucide-react';

const ManageBanners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newBannerName, setNewBannerName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const API_URL = 'https://bus-yatra-backend.vercel.app/api/banners';
    const token = localStorage.getItem('adminToken');

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setBanners(data.data);
            } else {
                setError(data.error || 'Failed to fetch banners');
            }
        } catch (err) {
            setError('Failed to fetch banners');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile || !newBannerName) {
            setError('Please provide both name and image');
            return;
        }

        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('name', newBannerName);

        try {
            setUploading(true);
            setError(null);
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                setSuccess('Banner uploaded successfully!');
                fetchBanners();
                setShowUploadModal(false);
                resetUploadModal();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (err) {
            setError('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const resetUploadModal = () => {
        setNewBannerName('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setError(null);
    };

    const toggleHomeStatus = async (id) => {
        try {
            setError(null);
            const response = await fetch(`${API_URL}/${id}/toggle-home`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                fetchBanners();
            } else {
                setError(data.error || 'Failed to update status');
                setTimeout(() => setError(null), 3000);
            }
        } catch (err) {
            setError('Failed to update status');
            setTimeout(() => setError(null), 3000);
        }
    };

    const deleteBanner = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;

        try {
            setError(null);
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setBanners(banners.filter(b => b._id !== id));
                setSuccess('Banner deleted successfully');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.error || 'Failed to delete banner');
            }
        } catch (err) {
            setError('Failed to delete banner');
        }
    };

    const activeBanners = banners.filter(b => b.showOnHome);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex items-center justify-between pb-4">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black text-blue-600 tracking-tight uppercase px-4">Banner Management</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1 px-4">Configure your mobile app promotion banners</p>
                    </div>

                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 font-bold uppercase text-xs tracking-widest"
                    >
                        <Plus size={18} />
                        <span>Add New Image</span>
                    </button>
                </div>

                {/* Thumbnail Selection Section (Home Slots) */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                            <MousePointer2 className="text-blue-600" size={24} />
                            <h2 className="text-xl font-bold text-blue-600 uppercase tracking-wider">Home Screen Preview</h2>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                            <div className={`w-2 h-2 rounded-full ${activeBanners.length === 2 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                {activeBanners.length} / 2 Slots Active
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[0, 1].map((index) => {
                            const banner = activeBanners[index];
                            return (
                                <div
                                    key={index}
                                    className={`relative aspect-[21/9] rounded-[2rem] overflow-hidden border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center group ${banner ? 'border-blue-500/50 bg-white shadow-2xl' : 'border-slate-300 bg-slate-100/40 hover:border-slate-400'
                                        }`}
                                >
                                    {banner ? (
                                        <>
                                            <img
                                                src={banner.imageUrl}
                                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                                                alt={banner.name}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                                            <div className="relative z-10 flex flex-col items-center text-center px-6">
                                                <div className="bg-blue-600/90 backdrop-blur-md p-2 rounded-xl mb-3 border border-blue-400/30">
                                                    <Home size={16} className="text-white fill-current" />
                                                </div>
                                                <p className="text-white font-black uppercase text-xs tracking-[0.2em] mb-1">Active Slot {index + 1}</p>
                                                <h3 className="text-white text-lg font-bold mb-4">{banner.name}</h3>
                                                <button
                                                    onClick={() => toggleHomeStatus(banner._id)}
                                                    className="bg-white hover:bg-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
                                                >
                                                    Remove from Home
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center space-y-4 px-6">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                                <ImageIcon size={32} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Empty Slot {index + 1}</p>
                                                <p className="text-slate-600 text-[10px] font-medium mt-2 max-w-[200px]">Select an image from the library below to feature it on the app</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Banner Library Section */}
                <div className="space-y-4 mt-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <h2 className="text-xl font-bold text-blue-600 uppercase tracking-wider">Banner Images Library</h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                            <Loader2 className="animate-spin text-blue-600" size={48} />
                            <p className="text-slate-500 text-xs uppercase font-black tracking-widest">Syncing with server...</p>
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3.5rem] border border-slate-200 border-dashed space-y-6 shadow-sm">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                <ImageIcon className="text-slate-400" size={40} />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">Library is empty</p>
                                <p className="text-slate-600 text-xs font-medium mt-3">Upload your first promo banner to get started</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {banners.map((banner) => (
                                <div
                                    key={banner._id}
                                    className={`group relative rounded-[2rem] overflow-hidden border transition-all duration-500 bg-white ${banner.showOnHome
                                        ? 'border-blue-500 shadow-xl shadow-blue-500/10 scale-[0.98]'
                                        : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="aspect-[4/3] overflow-hidden relative">
                                        <img
                                            src={banner.imageUrl}
                                            className={`w-full h-full object-cover transition-all duration-1000 ${banner.showOnHome ? 'opacity-40 grayscale-[0.3]' : 'group-hover:scale-110'}`}
                                            alt={banner.name}
                                        />

                                        {banner.showOnHome && (
                                            <div className="absolute top-4 right-4 bg-blue-600 text-white p-2 rounded-xl shadow-2xl border border-blue-400/30">
                                                <Home size={14} className="fill-current" />
                                            </div>
                                        )}

                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-6">
                                            <div className="flex gap-3 mb-6">
                                                <button
                                                    onClick={() => toggleHomeStatus(banner._id)}
                                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90 ${banner.showOnHome
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-white text-slate-900 hover:bg-blue-600 hover:text-white'
                                                        }`}
                                                    title={banner.showOnHome ? "Deactivate" : "Activate"}
                                                >
                                                    <Home size={24} className={banner.showOnHome ? "fill-current" : ""} />
                                                </button>
                                                <button
                                                    onClick={() => deleteBanner(banner._id)}
                                                    className="w-14 h-14 bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-2xl active:scale-90"
                                                    title="Permanently Delete"
                                                >
                                                    <Trash2 size={24} />
                                                </button>
                                            </div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mt-2 px-2 truncate w-full">ID: {banner._id.slice(-8)}</p>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-white border-t border-slate-100">
                                        <h3 className="text-slate-800 font-bold truncate">{banner.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Uploaded {new Date(banner.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upload Modal - Standardized UI matching ManageBuses/Routes */}
                {showUploadModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !uploading && setShowUploadModal(false)} />

                        <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            {/* Modal Header - Standardized */}
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">ADD NEW BANNER</h2>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="p-2 hover:bg-white hover:text-red-500 rounded-xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpload} className="p-8 space-y-8">
                                <div className="space-y-6">
                                    {/* Name Input */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">BANNER NAME</label>
                                        <input
                                            type="text" required
                                            value={newBannerName}
                                            onChange={(e) => setNewBannerName(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="e.g. Holi Special Offer 2024"
                                        />
                                    </div>

                                    {/* Image Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ASSET IMAGE</label>
                                        {previewUrl ? (
                                            <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-slate-100 group">
                                                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">
                                                        Change File
                                                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center aspect-video rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-slate-50 hover:border-blue-500/50 hover:bg-white transition-all cursor-pointer group">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all mb-4 shadow-sm">
                                                    <Upload size={28} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Click to browse asset</p>
                                                    <p className="text-slate-600 text-[10px]">JPG, PNG or WEBP (Max 5MB)</p>
                                                </div>
                                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Form Footer */}
                                <div className="flex items-center justify-end pt-4">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowUploadModal(false)}
                                            className="px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-slate-800 transition-colors"
                                            disabled={uploading}
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] tracking-widest px-12 py-4 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center space-x-3 disabled:opacity-50 transition-all hover:translate-y-[-2px] active:translate-y-[1px]"
                                            disabled={uploading || !selectedFile || !newBannerName}
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={18} />
                                                    <span>UPLOADING</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>UPLOAD</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Status Toasts */}
                <div className="fixed bottom-10 right-10 z-[150] space-y-4 w-80">
                    {error && (
                        <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-500">
                            <div className="flex items-center space-x-3">
                                <div className="bg-red-500 p-2 rounded-xl text-white">
                                    <AlertCircle size={18} />
                                </div>
                                <div>
                                    <p className="text-white text-xs font-black uppercase tracking-widest">Process Failed</p>
                                    <p className="text-red-400 text-[10px] font-medium mt-0.5">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {success && (
                        <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-500">
                            <div className="flex items-center space-x-3">
                                <div className="bg-emerald-500 p-2 rounded-xl text-white">
                                    <CheckCircle2 size={18} />
                                </div>
                                <div>
                                    <p className="text-white text-xs font-black uppercase tracking-widest">Success Sync</p>
                                    <p className="text-emerald-400 text-[10px] font-medium mt-0.5">{success}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageBanners;
