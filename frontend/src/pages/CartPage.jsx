import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import useCart from '../hooks/useCart';
import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../services/courseService';
import { getImageUrl } from '../utils/imageUtils';
import { createCheckout, checkCoupon } from '../services/checkoutService';
import toast from 'react-hot-toast';
import { useState } from 'react';

const CartPage = () => {
    const { cart, removeFromCart, cartTotal, cartCount, addToCart, clearCart } = useCart();
    const navigate = useNavigate();
    const [couponCode, setCouponCode] = useState('');
    const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    const handleCheckout = async () => {
        try {
            if (cart.length === 0) return;
            
            toast.loading('Creating checkout session...');
            const res = await createCheckout({
                courseIds: cart.map(item => item.id),
                totalAmount: cartTotal,
                couponCode: appliedCoupon ? appliedCoupon.code : null
            });
            
            toast.dismiss();
            if (res.success) {
                navigate(`/checkout/${res.data.checkoutId}`);
            }
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || 'Checkout creation failed');
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsCheckingCoupon(true);
        try {
            const courseIds = cart.map(c => c.id);
            const res = await checkCoupon(couponCode, courseIds);
            if (res.success && res.data.isValid) {
                setAppliedCoupon(res.data); // data: { isValid, code, discountAmount, newTotal }
                toast.success(`Coupon applied! Saved ${res.data.discountAmount.toLocaleString('vi-VN')}₫`);
            }
        } catch (error) {
            toast.error(error.message);
            setAppliedCoupon(null);
        } finally {
            setIsCheckingCoupon(false);
        }
    };


    // Fetch recommendations
    const { data: recommendationsData } = useQuery({
        queryKey: ['recommendations'],
        queryFn: () => fetchCourses({ page: 1, limit: 8 }), // Fetch more to allow for filtering
        staleTime: 1000 * 60 * 5,
    });

    // Filter out courses already in cart and limit to 4
    const recommendations = (recommendationsData?.courses || [])
        .filter(course => !cart.some(cartItem => cartItem.id === course.id))
        .slice(0, 4);

    const formatVNPrice = (price) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return numPrice.toLocaleString('vi-VN');
    };
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display min-h-screen flex flex-col overflow-x-hidden antialiased">
            <style>
                {`
                /* Custom scrollbar for webkit */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: #0D071E; 
                }
                ::-webkit-scrollbar-thumb {
                    background: #2e2447; 
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #6e3cec; 
                }
                `}
            </style>
            
            <Header />

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 py-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 mb-8 text-sm">
                    <Link to="/" className="text-slate-400 hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-slate-600 text-[16px]">chevron_right</span>
                    <span className="text-white font-medium">Shopping Cart</span>
                </div>

                {/* Page Heading */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 drop-shadow-[0_0_15px_rgba(110,60,236,0.2)]">Your Shopping Cart</h1>
                        <p className="text-slate-400 text-base">You have <span className="text-fuchsia-400 font-semibold">{cartCount} courses</span> in your cart ready for checkout.</p>
                    </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Cart Items */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {cart.length === 0 ? (
                             <div className="text-center py-20 bg-[#1A1333] rounded-2xl border border-white/5">
                                 <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">shopping_cart_off</span>
                                 <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
                                 <p className="text-slate-400 mb-6">Looks like you haven't added any courses yet.</p>
                                 <Link to="/courses" className="px-6 py-3 bg-primary rounded-xl text-white font-bold hover:bg-primary/90 transition-colors">
                                     Browse Courses
                                 </Link>
                             </div>
                        ) : (
                            <>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h2 className="text-xl font-bold text-white">Cart Items <span className="text-slate-500 text-lg font-medium">({cartCount})</span></h2>
                                <button 
                                    onClick={clearCart}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                                    Remove All
                                </button>
                            </div>
                            {cart.map(item => (
                                <div key={item.id} className="group relative flex flex-col sm:flex-row gap-5 p-5 bg-[#1A1333] border border-white/5 rounded-2xl hover:border-primary/30 hover:bg-[#20173d] transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                                    {/* Thumbnail */}
                                    <div className="w-full sm:w-48 aspect-video sm:aspect-auto rounded-xl overflow-hidden shrink-0 relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                        <div className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url('${getImageUrl(item.image)}')` }}></div>
                                    </div>
                                    {/* Content */}
                                    <div className="flex flex-col flex-1 justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-lg md:text-xl font-bold text-white leading-tight group-hover:text-fuchsia-400 transition-colors cursor-pointer">{item.title}</h3>
                                                <p className="text-xl font-bold text-white hidden sm:block">{formatVNPrice(item.price)}₫</p>
                                            </div>
                                            <p className="text-slate-400 text-sm mb-2">By <span className="text-slate-300">{item.instructorName}</span> • {item.instructorRole}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                                                <div className="flex items-center gap-1 text-amber-400">
                                                    <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                                                    <span className="font-bold">{item.rating}</span>
                                                    <span className="text-slate-500">({item.reviews} ratings)</span>
                                                </div>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="hidden sm:inline">{item.duration}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-start gap-4 mt-2">
                                            <button 
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-slate-400 hover:text-red-400 text-sm font-medium flex items-center gap-1 transition-colors group/btn"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                <span className="group-hover/btn:underline decoration-red-400/50">Remove</span>
                                            </button>
                                            <div className="w-px h-4 bg-white/10 hidden sm:block"></div>
                                            <button className="text-slate-400 hover:text-primary text-sm font-medium flex items-center gap-1 transition-colors group/btn">
                                                <span className="material-symbols-outlined text-[18px]">favorite</span>
                                                <span className="group-hover/btn:underline decoration-primary/50">Move to Wishlist</span>
                                            </button>
                                            <p className="text-xl font-bold text-white sm:hidden ml-auto">{formatVNPrice(item.price)}₫</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </>
                        )}

                        {/* Continue Shopping */}
                        <div className="mt-4">
                            <Link to="/courses" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors group">
                                <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Order Summary (Sticky) */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-28 bg-[#1A1333] border border-white/5 rounded-2xl p-6 shadow-2xl shadow-black/40">
                            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex justify-between items-center text-slate-400 text-sm">
                                    <span>Subtotal</span>
                                    <span className="text-white font-medium">{formatVNPrice(cartTotal)}₫</span>
                                </div>
                                <div className="flex justify-between items-center text-green-400 text-sm">
                                    <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                                    <span className="font-medium">-{appliedCoupon ? appliedCoupon.discountAmount.toLocaleString('vi-VN') : '0'}₫</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400 text-sm">
                                    <span>Tax (Estimated)</span>
                                    <span className="text-white font-medium">0₫</span>
                                </div>
                            </div>
                            {/* Coupon Input */}
                            <div className="mb-6">
                                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Promo Code</label>
                                <div className="flex gap-2">
                                    <input 
                                        className="bg-[#0D071E] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary w-full placeholder-slate-600" 
                                        placeholder="Enter code" 
                                        type="text" 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        disabled={!!appliedCoupon}
                                    />
                                    {appliedCoupon ? (
                                        <button 
                                            onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                                            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-500 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                                        >
                                            Remove
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleApplyCoupon}
                                            disabled={isCheckingCoupon || !couponCode}
                                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isCheckingCoupon ? '...' : 'Apply'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full mb-6"></div>
                            <div className="flex justify-between items-end mb-8">
                                <span className="text-slate-300 font-medium">Total</span>
                                <div className="text-right">
                                    {appliedCoupon && <span className="text-xs text-slate-500 line-through block mb-1">{formatVNPrice(cartTotal)}₫</span>}
                                    <span className="text-3xl font-black text-white">{appliedCoupon ? formatVNPrice(appliedCoupon.newTotal) : formatVNPrice(cartTotal)}₫</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleCheckout}
                                className="w-full relative group overflow-hidden rounded-full p-[1px]"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 group-hover:from-violet-500 group-hover:to-fuchsia-500 transition-all duration-300"></span>
                                <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full py-4 px-6 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all duration-300 transform group-hover:scale-[1.01]">
                                    <span className="text-white font-bold tracking-wide">Checkout</span>
                                    <span className="material-symbols-outlined text-white group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                            </button>
                            <div className="mt-6 flex flex-col items-center gap-3">
                                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                                    <span className="material-symbols-outlined text-[16px]">lock</span>
                                    Secure SSL Encrypted Payment
                                </div>
                                <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                                    By completing your purchase you agree to these <a href="#" className="text-slate-500 underline hover:text-slate-400">Terms of Service</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations Section */}
                {recommendations.length > 0 && (
                    <div className="mt-20 border-t border-white/5 pt-12">
                        <div className="flex flex-col gap-2 mb-8">
                            <h2 className="text-2xl md:text-3xl font-black text-white">You Might Also Like</h2>
                            <p className="text-slate-400">Hand-picked courses to complement your learning.</p>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {recommendations.map(course => (
                                <div key={course.id} className="group flex flex-col bg-[#1A1333] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 hover:bg-[#20173d] transition-all hover:shadow-lg hover:shadow-primary/5">
                                    <div className="aspect-video relative overflow-hidden">
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url('${getImageUrl(course.image)}')` }}></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-amber-400 flex items-center gap-1 border border-white/10">
                                            <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                                            {course.rating}
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1 gap-3">
                                        <div className="block cursor-pointer">
                                            <h3 className="font-bold text-white group-hover:text-primary transition-colors line-clamp-2" title={course.title}>{course.title}</h3>
                                        </div>
                                        <p className="text-xs text-slate-400">By <span className="text-slate-300">{course.instructorName}</span></p>
                                        
                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                                            <span className="font-bold text-white">{formatVNPrice(course.price)}₫</span>
                                            <button 
                                                onClick={() => addToCart(course)}
                                                className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all group/add"
                                                title="Add to Cart"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

               
            </main>

            {/* Footer Simple */}
            <footer className="border-t border-white/5 bg-[#0D071E] mt-12 py-8">
                <div className="max-w-7xl mx-auto px-10 text-center">
                    <p className="text-slate-500 text-sm">© 2024 Cosmos Learn Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default CartPage;
