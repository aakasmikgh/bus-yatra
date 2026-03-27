import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

const PaymentPortal = () => {
    const location = useLocation();
    const [countdown, setCountdown] = useState(3);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Parse query params
    const queryParams = new URLSearchParams(location.search);
    const data = Object.fromEntries(queryParams.entries());

    // eSewa Sandbox URL
    const esewaUrl = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

    useEffect(() => {
        if (data.signature && data.total_amount) {
            // Start countdown
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleRedirect();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [data.signature]);

    const handleRedirect = () => {
        setIsRedirecting(true);
        console.log('--- Submitting eSewa Form ---');
        const form = document.getElementById('esewa-post-form');
        if (form) {
            form.submit();
        }
    };

    if (!data.signature) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-slate-100">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-lg shadow-rose-500/10">
                        <ShieldCheck size={44} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Session Expired</h1>
                    <p className="text-slate-500 font-medium leading-relaxed mb-8">
                        The secure payment session could not be established. Please return to your mobile app and try again.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-lg w-full text-center border border-slate-100 relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-[2.5rem] shadow-2xl mb-10 ring-8 ring-blue-50 transition-transform hover:scale-105 duration-500">
                    <ShieldCheck className="text-white" size={48} />
                </div>

                <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">
                    Secure <span className="text-blue-600 uppercase">Yatra</span>
                </h1>
                <p className="text-slate-500 font-bold mb-12 uppercase tracking-widest text-xs opacity-60">Payment Gateway Portal</p>

                <div className="bg-slate-50 p-8 rounded-3xl mb-12 border border-slate-100 group transition-all hover:bg-white hover:shadow-xl duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Amount to Pay</span>
                        <span className="text-blue-600 font-black text-2xl">NPR {data.total_amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Transaction ID</span>
                        <span className="text-slate-800 font-black text-xs">{data.transaction_uuid?.split('-')[0]}...</span>
                    </div>
                </div>

                <div className="flex flex-col items-center space-y-6">
                    {isRedirecting ? (
                        <div className="flex items-center space-x-3 text-blue-600 bg-blue-50 px-8 py-4 rounded-2xl animate-pulse">
                            <Loader2 className="animate-spin" size={20} />
                            <span className="font-black uppercase tracking-widest text-xs">Connecting to eSewa...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="text-3xl font-black text-blue-600 mb-2">{countdown}</div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Redirecting automatically</p>
                        </div>
                    )}
                </div>

                {/* Hidden form for eSewa POST */}
                <form id="esewa-post-form" action={esewaUrl} method="POST" className="hidden">
                    {Object.entries(data).map(([key, value]) => (
                        <input key={key} type="hidden" name={key} value={value} />
                    ))}
                </form>

                <div className="mt-14 pt-8 border-t border-slate-50">
                    <button
                        onClick={handleRedirect}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all transform active:scale-95 flex items-center justify-center space-x-2 group"
                    >
                        <span>PAY WITH ESEWA</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="mt-6 text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">
                        Nepal's Most Trusted Digital Wallet
                    </p>
                </div>
            </div>

            <p className="mt-10 text-slate-400 text-xs font-bold tracking-tight">
                Protected by 256-bit SSL Encryption
            </p>
        </div>
    );
};

export default PaymentPortal;
