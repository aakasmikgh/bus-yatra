import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ManageBuses from './pages/ManageBuses';
import ManageDestinations from './pages/ManageDestinations';
import ManageRoutes from './pages/ManageRoutes';
import Bookings from './pages/Bookings';
import PromoCodes from './pages/PromoCodes';
import Users from './pages/Users';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ManageBanners from './pages/ManageBanners';
import './index.css';

import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('adminToken');
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    if (!token || user.role !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />


                {/* Dashboard Routes with Layout */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="manage-buses" element={<ManageBuses />} />
                        <Route path="destinations" element={<ManageDestinations />} />
                        <Route path="manage-routes" element={<ManageRoutes />} />
                        <Route path="bookings" element={<Bookings />} />
                        <Route path="promo-codes" element={<PromoCodes />} />
                        <Route path="banners" element={<ManageBanners />} />

                        <Route path="users" element={<Users />} />
                        <Route path="*" element={<div className="p-8">Page Not Found</div>} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
