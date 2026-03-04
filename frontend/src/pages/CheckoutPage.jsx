import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getCheckoutStatus, /*simulatePayment,*/ applyCoupon, getPublicCoupons } from '../services/checkoutService';
import { PAYMENT_CONFIG } from '../config/paymentConfig';
import Header from '../components/Header';
import useCart from '../hooks/useCart';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
    const { checkoutId } = useParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const [checkout, setCheckout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [couponCode, setCouponCode] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);

    const processedRef = React.useRef(false);

    // Initial Fetch
    useEffect(() => {
        const initCheckout = async () => {
            try {
                const res = await getCheckoutStatus(checkoutId);
                setCheckout(res.data);
            } catch (error) {
                console.error('Failed to load checkout:', error);
            } finally {
                setLoading(false);
            }
        };
        initCheckout();
    }, [checkoutId]);

    // Fetch Coupons
    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const res = await getPublicCoupons();
                setAvailableCoupons(res.data);
            } catch (error) {
                console.error('Failed to load coupons:', error);
            }
        };
        fetchCoupons();
    }, []);

    // Polling Logic (Only runs if checkout exists and is NOT completed)
    useEffect(() => {
        if (!checkout || checkout.status === 'COMPLETED') return;

        const interval = setInterval(async () => {
             try {
                const res = await getCheckoutStatus(checkoutId);
                // Only update if status changed to avoid redundant renders
                if (res.data.status !== checkout.status) {
                    setCheckout(res.data);
                }
            } catch {
                // Silent error on polling
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [checkoutId, checkout?.status]);

    // Timer countdown (Restored)
    useEffect(() => {
        if (timeLeft > 0 && checkout?.status === 'PENDING') {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, checkout]);

    const queryClient = useQueryClient();

    // Handle Success Side Effects (Toast + Redirect + Clear Cart + Invalidate Cache)
    useEffect(() => {
        if (checkout?.status === 'COMPLETED' && !processedRef.current) {
            processedRef.current = true; // Mark as handled
            toast.success('Payment successful!');
            clearCart();
            
            // Invalidate enrollments cache so My Learning page fetches new data immediately
            queryClient.invalidateQueries({ queryKey: ['userEnrollments'] });
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            
            // Redirect after delay
            const timer = setTimeout(() => {
                navigate('/my-learning');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [checkout?.status, navigate, clearCart, queryClient]);

    // const handleSimulateSuccess = async () => {
    //     try {
    //         toast.loading('Simulating payment...');
    //         await simulatePayment(checkoutId);
    //         toast.dismiss();
    //         toast.success('Simulation sent! Wait for poll...');
    //     } catch (error) {
    //         console.error('Simulation failed:', error);
    //         toast.error('Simulation failed');
    //     }
    // };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsApplying(true);
        try {
            const res = await applyCoupon(checkoutId, couponCode);
            toast.success('Coupon applied successfully!');
            
            // Update local checkout state with new total
            setCheckout(prev => ({
                ...prev,
                totalAmount: res.data.totalAmount, // Update total amount
                discountAmount: res.data.discountAmount, // Add discount amount if your backend returns it in checkout object, or just rely on new total
                couponCode: res.data.couponCode
            }));
            
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsApplying(false);
        }
    };

    const [selectedBank, setSelectedBank] = useState(PAYMENT_CONFIG.BANKS[0]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const safeVal = (val) => {
        const num = Number(val);
        return Number.isFinite(num) ? num : 0;
    };

    if (loading) return <div className="min-h-screen bg-[#0D071E] flex items-center justify-center text-white">Loading checkout...</div>;
    if (!checkout) return <div className="min-h-screen bg-[#0D071E] flex items-center justify-center text-white">Checkout not found</div>;

    // VietQR URL generation
    const qrUrl = `https://img.vietqr.io/image/${selectedBank.id}-${selectedBank.accountNo}-${PAYMENT_CONFIG.TEMPLATE}.png?amount=${checkout.totalAmount}&addInfo=ORDER ${checkout.id}&accountName=${encodeURIComponent(selectedBank.accountName)}`;

    return (
        <div className="min-h-screen bg-[#0D071E] font-display text-white">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-12">
                {checkout.status === 'COMPLETED' ? (
                     <div className="text-center py-16 bg-[#1A1333] rounded-2xl border border-green-500/20 shadow-lg shadow-green-500/10 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
                        </div>
                        <h1 className="text-4xl font-black mb-4 text-white">Payment Successful!</h1>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">Thank you for your purchase. You have been seamlessly enrolled in your courses.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={() => navigate('/my-learning')}
                                className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(110,60,236,0.3)] hover:shadow-[0_0_30px_rgba(110,60,236,0.5)] transform hover:-translate-y-1"
                            >
                                Go to My Learning
                            </button>
                            <button 
                                onClick={() => navigate('/settings?tab=transactions')}
                                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all border border-white/10 hover:border-white/30"
                            >
                                View Transaction History
                            </button>
                        </div>
                        <p className="text-slate-500 text-sm mt-4 animate-pulse">Redirecting you automatically...</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        {/* Left: Payment Details */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-black mb-2">Scan to Pay</h1>
                                <p className="text-slate-400">Open your banking app and scan the QR code to complete your purchase securely.</p>
                            </div>
                            
                            <div className="bg-[#1A1333] p-6 rounded-2xl border border-white/10 space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-slate-400">Total Amount</span>
                                    {checkout.discountAmount ? (
                                        <div className="text-right">
                                            <div className="text-sm text-slate-500 line-through">
                                                {(safeVal(checkout.totalAmount) + safeVal(checkout.discountAmount)).toLocaleString('vi-VN')}₫
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                {safeVal(checkout.totalAmount).toLocaleString('vi-VN')}₫
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-2xl font-bold text-white">{safeVal(checkout.totalAmount).toLocaleString('vi-VN')}₫</span>
                                    )}
                                </div>
                                {checkout.discountAmount && (
                                    <div className="flex justify-between items-center py-2 border-b border-white/5 text-green-400">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">local_offer</span>
                                            Discount ({checkout.couponCode})
                                        </span>
                                        <span className="font-bold">-{safeVal(checkout.discountAmount).toLocaleString('vi-VN')}₫</span>
                                    </div>
                                )}
                                
                                {/* Coupon Input */}
                                {!checkout.discountAmount && (
                                    <div className="py-2 border-b border-white/5 space-y-3">
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Enter coupon code" 
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-primary/50"
                                            />
                                            <button 
                                                onClick={handleApplyCoupon}
                                                disabled={isApplying || !couponCode?.trim()}
                                                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg px-4 py-2 text-sm font-bold transition-all disabled:opacity-50"
                                            >
                                                {isApplying ? 'Applying...' : 'Apply'}
                                            </button>
                                        </div>

                                        {/* Available Coupons List */}
                                        {availableCoupons.length > 0 && (
                                            <div className="space-y-2 mt-2">
                                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Available Coupons</p>
                                                <div className="grid gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                                                    {availableCoupons.map(coupon => (
                                                        <div key={coupon.Id} className="bg-white/5 border border-white/5 rounded-lg p-3 flex justify-between items-center group hover:border-primary/30 transition-all">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono font-bold text-primary">{coupon.Code}</span>
                                                                    <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                                                        {coupon.DiscountType === 'PERCENTAGE' ? `-${coupon.DiscountValue}%` : `-${coupon.DiscountValue.toLocaleString()}₫`}
                                                                    </span>
                                                                </div>
                                                                {coupon.Title && <p className="text-sm font-bold text-white mt-0.5">{coupon.Title}</p>}
                                                                {coupon.Description && <p className="text-xs text-slate-400">{coupon.Description}</p>}
                                                                {coupon.ExpiryDate && (
                                                                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                                                        <span className="material-symbols-outlined text-[10px]">event</span>
                                                                        Expires: {new Date(coupon.ExpiryDate).toLocaleDateString('vi-VN')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <button 
                                                                onClick={() => setCouponCode(coupon.Code)}
                                                                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                Use
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-slate-400">Order ID</span>
                                    <span className="font-mono text-sm bg-white/5 px-2 py-1 rounded text-slate-300">{checkout.id.slice(0, 8)}...</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-slate-400">Bank</span>
                                    <span className="font-bold text-white">{selectedBank.shortName}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-slate-400">Account No.</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-white">{selectedBank.accountNo}</span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedBank.accountNo);
                                                toast.success('Copied account number');
                                            }}
                                            className="text-slate-500 hover:text-white transition-colors"
                                            title="Copy"
                                        >
                                            <span className="material-symbols-outlined text-sm">content_copy</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-slate-400">Account Name</span>
                                    <span className="font-bold text-white text-right text-sm">{selectedBank.accountName}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-slate-400">Time Remaining</span>
                                    <span className={`font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                                        {formatTime(timeLeft)}
                                    </span>
                                </div>
                            </div>

                             {/* Dev Tool: Simulation Button */}
                            <div className="mt-8 p-4 border border-dashed border-amber-500/30 rounded-xl bg-amber-500/5">
                                <div className="flex items-center gap-2 mb-2 text-amber-500 text-sm font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-sm">construction</span>
                                    Developer Mode
                                </div>
                                <p className="text-xs text-slate-400 mb-3 block">Since we are in development mode without a real bank webhook, use this button to simulate a successful payment callback.</p>
                                {/* <button 
                                    onClick={handleSimulateSuccess}
                                    className="w-full bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-600/50 font-bold py-2 rounded-lg transition-colors text-sm"
                                >
                                    Simulate Payment Success
                                </button> */}
                            </div>
                        </div>

                        {/* Right: QR Code */}
                        <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center justify-center relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] opacity-30 blur-lg group-hover:opacity-50 transition-opacity"></div>
                            <div className="relative bg-white p-4 rounded-xl w-full">
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {PAYMENT_CONFIG.BANKS.map((bank) => (
                                        <button
                                            key={bank.id}
                                            onClick={() => setSelectedBank(bank)}
                                            className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${
                                                selectedBank.id === bank.id
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            {bank.shortName}
                                        </button>
                                    ))}
                                </div>
                                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center mb-4 relative">
                                    {/* Logo Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                                         <span className="material-symbols-outlined text-9xl text-slate-900">qr_code_scanner</span>
                                    </div>
                                    <img 
                                        src={qrUrl} 
                                        alt="VietQR Payment Code" 
                                        className="w-full h-full object-contain relative z-10 mix-blend-multiply"
                                    />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">VietQR Supported</p>
                                    <div className="flex justify-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
                                        {/* Bank logos placeholders could go here */}
                                        <span className="font-bold text-slate-800">MB Bank</span>
                                        <span className="text-slate-300">|</span>
                                        <span className="font-bold text-slate-800">Napas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CheckoutPage;
