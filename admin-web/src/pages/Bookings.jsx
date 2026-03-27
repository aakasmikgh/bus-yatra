import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Download, Ticket, User, Bus, Phone, Mail, MapPin, Trash2, X, Clock, Calendar, Briefcase, Navigation, Smartphone } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/bookings`);
            const data = await response.json();
            if (data.success) {
                setBookings(data.data || []);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                fetchBookings();
            } else {
                alert(data.error || 'Failed to delete');
            }
        } catch (err) {
            alert('Error deleting booking');
        }
    };

    const openViewModal = (booking) => {
        setSelectedBooking(booking);
        setIsViewModalOpen(true);
    };

    const filteredBookings = bookings.filter(b =>
        (b._id && b._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.contactName && b.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleExportCSV = () => {
        const headers = ['Booking ID', 'Passenger', 'Phone', 'Email', 'Bus', 'Route', 'Date', 'Time', 'Boarding Point', 'Seats', 'Amount', 'Payment Method', 'Status'];

        const csvData = bookings.map(booking => [
            booking._id,
            booking.contactName,
            booking.contactPhone,
            booking.contactEmail || booking.user?.email || 'N/A',
            booking.bus?.name || 'N/A',
            `${booking.route?.origin?.name || '?'} - ${booking.route?.destination?.name || '?'}`,
            booking.bookingDate,
            booking.route?.departureTime || 'N/A',
            booking.boardingPoint,
            (booking.seats || []).join('; '),
            booking.totalPrice,
            booking.paymentMethod,
            'Confirmed'
        ]);

        const escapeCsv = (text) => {
            if (text === null || text === undefined) return '';
            const stringText = String(text);
            if (stringText.includes(',') || stringText.includes('"') || stringText.includes('\n')) {
                return `"${stringText.replace(/"/g, '""')}"`;
            }
            return stringText;
        };

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(escapeCsv).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manage Bookings</h1>
                    <p className="text-slate-500 mt-1">Real-time passenger reservations and travel data.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleExportCSV}
                        className="bg-white text-slate-700 font-bold px-6 py-3 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <Download size={20} className="mr-2 inline" />
                        Export CSV
                    </button>
                    <button
                        onClick={fetchBookings}
                        className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Refresh Data
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Booking ID, Passenger Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Booking ID</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Passenger</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Bus / Route</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Seats</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium font-sans">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-10 text-slate-500 font-bold">Fetching real-time data...</td></tr>
                        ) : filteredBookings.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-10 text-slate-500 font-bold">No bookings found</td></tr>
                        ) : filteredBookings.map((booking) => (
                            <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                            < Ticket size={18} />
                                        </div>
                                        <span className="font-bold text-slate-800">{booking._id?.slice(-6).toUpperCase()}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-sm">
                                    <div className="flex items-center space-x-2 font-bold text-slate-800 mb-1">
                                        <User size={14} className="text-slate-400" />
                                        <span>{booking.contactName}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-slate-400">
                                        <Phone size={12} />
                                        <span>{booking.contactPhone}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-slate-800 font-bold">{booking.bus?.name || 'Unknown Bus'}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {booking.route
                                            ? `${booking.route.origin?.name || 'Unknown'} → ${booking.route.destination?.name || 'Unknown'}`
                                            : 'No Route Info'}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-wrap gap-1">
                                        {(booking.seats || []).map(seat => (
                                            <span key={seat} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-extrabold uppercase">{seat}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-slate-800 font-bold">Rs. {booking.totalPrice}</td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => openViewModal(booking)}
                                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(booking._id)}
                                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                                        <p className="text-slate-800 font-bold">{selectedBooking.contactName}</p>
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
                                            {selectedBooking.user?.email || 'Guest@user.com'}
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
                                                {selectedBooking.bookingDate}
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
                                                <p className="text-[10px] text-slate-500 font-bold">{selectedBooking.route?.boardingPoints?.[0]?.time || 'TBA'}</p>
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
                                                        ? `${selectedBooking.route.origin?.name || 'Unknown'} to ${selectedBooking.route.destination?.name || 'Unknown'}`
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

export default Bookings;
