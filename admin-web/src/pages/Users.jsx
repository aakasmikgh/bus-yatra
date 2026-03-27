import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, User as UserIcon, Mail, Shield, ChevronDown, MoreHorizontal, Loader2, AlertCircle, X, Check } from 'lucide-react';
import { API_BASE_URL } from '../config';

const UserEditModal = ({ user, onClose, onSave, loading }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.provider,
        role: user.type === 'Admin' ? 'admin' : 'user',
        phone: user.contact === '—' ? '' : user.contact
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(user.id, formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800">Edit User</h3>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Update credentials and roles</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-100 border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-slate-100 border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Phone Number</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-slate-100 border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-medium"
                            placeholder="+977..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full bg-slate-100 border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-medium appearance-none"
                        >
                            <option value="user">Regular User</option>
                            <option value="admin">System Admin</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Save Changes</span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UsersPage = () => {
    const [activeTab, setActiveTab] = useState('Regular');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('latest'); // latest, oldest
    const [editingUser, setEditingUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/auth/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                const transformedUsers = data.data.map(u => ({
                    id: u._id,
                    name: u.name,
                    username: `@${u.email.split('@')[0]}`,
                    contact: u.phone || '—',
                    provider: u.email,
                    providerType: 'EMAIL',
                    joined: u.createdAt,
                    type: u.role === 'admin' ? 'Admin' : 'Regular',
                    isApproved: u.isApproved
                }));
                setUsers(transformedUsers);
            } else {
                setError(data.error || 'Failed to fetch users');
            }
        } catch (err) {
            setError('Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setUsers(users.filter(u => u.id !== id));
            } else {
                alert(data.error || 'Failed to delete user');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveUser = async (id) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/auth/users/${id}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setUsers(users.map(u => u.id === id ? { ...u, isApproved: true } : u));
            } else {
                alert(data.error || 'Failed to approve user');
            }
        } catch (err) {
            alert('Server error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateUser = async (id, updatedData) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            const data = await response.json();
            if (data.success) {
                setUsers(users.map(u => u.id === id ? {
                    ...u,
                    name: data.data.name,
                    provider: data.data.email,
                    contact: data.data.phone || '—',
                    type: data.data.role === 'admin' ? 'Admin' : 'Regular'
                } : u));
                setEditingUser(null);
            } else {
                alert(data.error || 'Failed to update user');
            }
        } catch (err) {
            alert('Server error');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users
        .filter(user =>
            user.type === activeTab &&
            (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.username.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
            if (sortBy === 'latest') return new Date(b.joined) - new Date(a.joined);
            return new Date(a.joined) - new Date(b.joined);
        });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Users</h1>
                    <p className="text-slate-500 mt-1 font-medium">View and Manage admins, users and their permissions.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
                <button
                    onClick={() => setActiveTab('Admin')}
                    className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'Admin'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    <Shield size={18} />
                    <span>Admin Users</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] ${activeTab === 'Admin' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                        {users.filter(u => u.type === 'Admin').length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('Regular')}
                    className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'Regular'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    <UserIcon size={18} />
                    <span>Regular Users</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] ${activeTab === 'Regular' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                        {users.filter(u => u.type === 'Regular').length}
                    </span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none text-slate-700 font-medium placeholder:text-slate-400"
                    />
                </div>

                <div className="relative group">
                    <button className="flex items-center space-x-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={18} />
                        <span>Sort: {sortBy === 'latest' ? 'Latest Joined' : 'Oldest Joined'}</span>
                        <ChevronDown size={16} />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 p-2">
                        <button onClick={() => setSortBy('latest')} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${sortBy === 'latest' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>Latest Joined</button>
                        <button onClick={() => setSortBy('oldest')} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${sortBy === 'oldest' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>Oldest Joined</button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{activeTab} Users</h2>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Manage registered users</p>
                    </div>
                    {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provider</th>
                                {activeTab === 'Admin' && (
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                )}
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === 'Admin' ? "6" : "5"} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <Loader2 className="text-blue-600 animate-spin" size={40} />
                                            <p className="text-slate-500 font-bold">Loading users...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={activeTab === 'Admin' ? "6" : "5"} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <AlertCircle className="text-rose-500" size={40} />
                                            <p className="text-rose-600 font-bold">{error}</p>
                                            <button onClick={fetchUsers} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Retry</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-lg border border-slate-200/50 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    {user.name ? user.name[0] : '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5 font-medium">{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-slate-600">{user.contact}</td>
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{user.provider}</p>
                                                <p className="text-[9px] text-blue-600 mt-1 font-black tracking-widest uppercase">{user.providerType}</p>
                                            </div>
                                        </td>
                                        {activeTab === 'Admin' && (
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${user.isApproved
                                                    ? 'bg-green-50 text-green-600'
                                                    : 'bg-yellow-50 text-yellow-600'
                                                    }`}>
                                                    {user.isApproved ? 'Active' : 'Pending'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-8 py-6 text-sm font-bold text-slate-500">
                                            {new Date(user.joined).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end space-x-2">
                                                {activeTab === 'Admin' && (
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {!user.isApproved && activeTab === 'Admin' && (
                                                    <button
                                                        onClick={() => handleApproveUser(user.id)}
                                                        className="p-2.5 bg-green-50 text-green-600 border border-green-100 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                                        title="Approve User"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={activeTab === 'Admin' ? "6" : "5"} className="px-8 py-20 text-center text-slate-400 font-bold">
                                        No {activeTab.toLowerCase()} users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {
                editingUser && (
                    <UserEditModal
                        user={editingUser}
                        onClose={() => setEditingUser(null)}
                        onSave={handleUpdateUser}
                        loading={actionLoading}
                    />
                )
            }
        </div >
    );
};

export default UsersPage;
