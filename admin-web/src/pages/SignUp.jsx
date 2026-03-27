import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../config';

const SignUp = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const navigate = useNavigate();

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    role: 'admin'
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to login after successful signup
                navigate('/login');
            } else {
                setError(data.error || 'Signup failed');
            }
        } catch (err) {
            setError('Could not connect to server. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
            {/* Left Side: Branding (40%) */}
            <div className="hidden md:flex md:w-[40%] bg-blue-600 relative items-center justify-center p-12 overflow-hidden">
                {/* Background Patterns */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-white blur-[100px] rounded-full" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-white blur-[100px] rounded-full" />
                </div>

                <div className="relative z-10 text-center animate-in fade-in slide-in-from-left duration-700">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-lg rounded-[2.5rem] shadow-2xl mb-8 ring-1 ring-white/30">
                        <ShieldCheck className="text-white" size={48} />
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase">
                        Bus<span className="text-blue-100 uppercase">Yatra</span>
                    </h2>
                    <p className="text-blue-100 text-lg font-medium opacity-80 max-w-xs mx-auto leading-relaxed">
                        Create your administrator account and start optimizing your fleet operations.
                    </p>
                </div>

                {/* Floating Decorative Elements */}
                <div className="absolute top-20 left-20 w-16 h-16 border-4 border-white/10 rounded-xl rotate-45 animate-pulse" />
                <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/5 rounded-full blur-xl" />
            </div>

            {/* Right Side: Form (60%) */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full" />

                <div className="w-full max-w-md animate-in fade-in zoom-in duration-500 py-12">
                    {/* Mobile Logo */}
                    <div className="md:hidden text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl mb-4">
                            <ShieldCheck className="text-white" size={32} />
                        </div>
                    </div>

                    <div className="mb-10 text-left">
                        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-3">Create <span className="text-blue-600">Account</span></h1>
                        <p className="text-slate-500 font-medium">Join our community of transit admins.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl animate-in fade-in slide-in-from-top duration-300">
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSignUp} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="block w-full pl-11 pr-12 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="px-1">
                            <label className="flex items-start space-x-3 cursor-pointer group">
                                <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-offset-0 focus:ring-1 focus:ring-blue-500/50" />
                                <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors leading-snug font-medium">
                                    I agree to the <a href="#" className="text-blue-600 font-bold hover:underline transition-all">Terms of Service</a> and <a href="#" className="text-blue-600 font-bold hover:underline transition-all">Privacy Policy</a>
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center space-x-2 group mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <span>{loading ? 'Creating Account...' : 'Create Admin Account'}</span>
                            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-10 text-center pt-8 border-t border-slate-100">
                        <p className="text-slate-500 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 font-bold hover:text-blue-500 underline decoration-blue-500/30 underline-offset-8 transition-all">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
