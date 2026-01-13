import React from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import { getImageUrl } from '../../utils/imageUtils';
import { toggleWishlist, getWishlist } from '../../services/wishlistService';

const CourseCard = ({ id, image, category, level, rating, reviews, duration, title, desc, instructorName, instructorRole, price, showWishlist = true }) => {
    const navigate = useNavigate();
    const { addToCart, cart } = useCart();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Check if course is already in cart
    const isInCart = cart.some(item => item.id === id);

    // Use query to check wishlist status from cache
    const { data: wishlistCourses } = useQuery({
        queryKey: ['wishlist'],
        queryFn: getWishlist,
        enabled: !!user && showWishlist,
        staleTime: 5 * 60 * 1000, // 5 minutes stale time to use cache
    });

    const isInWishlist = React.useMemo(() => {
        if (!wishlistCourses) return false;
        return wishlistCourses.some(course => course.Id === id);
    }, [wishlistCourses, id]);

    const handleCardClick = () => {
        navigate(`/courses/${id}`);
    };

    const handleWishlistToggle = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!user) {
            navigate('/login');
            return;
        }

        // Optimistic update
        const previousWishlist = queryClient.getQueryData(['wishlist']);
        
        // Optimistically update the cache
        queryClient.setQueryData(['wishlist'], (old) => {
            if (!old) return [];
            const isCurrentlyIn = old.some(c => c.Id === id);
            if (isCurrentlyIn) {
                return old.filter(c => c.Id !== id);
            } else {
                // Add a dummy object or just enough for the ID check to pass
                // Ideally we'd add the full course object if we had it handy in that format
                // For now, let's rely on invalidation for full data, but cache update for UI speed
                return [...old, { Id: id }]; 
            }
        });

        try {
            const result = await toggleWishlist(id);
            
            if (result.isInWishlist) {
                toast.success('Added to wishlist');
            } else {
                toast.success('Removed from wishlist');
            }

            // Invalidate to ensure we have the correct server state eventually
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        } catch (error) {
            console.error("Failed to toggle wishlist", error);
            toast.error('Failed to update wishlist');
            
            // Revert on error
            if (previousWishlist) {
                queryClient.setQueryData(['wishlist'], previousWishlist);
            }
        }
    };

    // Format price to Vietnamese format (20000 -> 20.000)
    const formatVNPrice = (price) => {
        if (price === null || price === undefined) return "0";
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        if (!Number.isFinite(numPrice)) return "0";
        return numPrice.toLocaleString('vi-VN');
    };

    return (
        <div 
            onClick={handleCardClick}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#1A1333] transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer hover:-translate-y-2"
        >
            <div className="relative aspect-video w-full overflow-hidden">
                <img 
                    alt={title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    src={getImageUrl(image)}
                    loading="lazy"
                />
                
                {/* Wishlist Button */}
                {showWishlist && (
                    <button
                        onClick={handleWishlistToggle}
                        className="absolute right-3 bottom-3 z-30 rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-110 group-hover/btn:bg-primary"
                        title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                         <span className={`material-symbols-outlined text-[20px] ${isInWishlist ? 'text-red-500 fill-current' : 'text-white'}`} style={isInWishlist ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            favorite
                        </span>
                    </button>
                )}

                {/* Level Badge - Top Left */}
                {level && (
                    <div className={`absolute left-3 top-3 rounded-lg px-2 py-1 text-xs font-bold text-white backdrop-blur-md border ${
                        level === 'Beginner' ? 'bg-green-600/80 border-green-400/30' :
                        level === 'Intermediate' ? 'bg-yellow-600/80 border-yellow-400/30' :
                        level === 'Advanced' ? 'bg-red-600/80 border-red-400/30' :
                        'bg-black/60 border-white/10'
                    }`}>
                        {level}
                    </div>
                )}
                {/* Category Badge - Top Right */}
                <div className="absolute right-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                    {category}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-5 relative z-10">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-yellow-400">
                        <span className="material-symbols-outlined text-[16px] fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-xs font-bold text-white ml-1">{rating}</span>
                        <span className="text-xs text-slate-500">({reviews})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        {duration}
                    </div>
                </div>

                <h3 className="mb-2 text-lg font-bold leading-tight text-white group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <p className="mb-4 text-xs text-slate-400 line-clamp-2">{desc}</p>

                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">

                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-300">{instructorName}</span>
                            <span className="text-[10px] text-slate-500">{instructorRole}</span>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-white transition-transform group-hover:scale-110">
                        {formatVNPrice(price)}₫
                    </span>

                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isInCart) return;
                        addToCart({ id, image, category, level, rating, reviews, duration, title, desc, instructorName, instructorRole, price });
                    }}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all cursor-pointer ${
                        isInCart 
                            ? 'bg-green-600/80 shadow-green-500/30 cursor-default hover:shadow-green-500/30 hover:brightness-100' 
                            : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-violet-500/30 hover:shadow-violet-500/50 hover:brightness-110'
                    }`}
                >
                    <span>{isInCart ? 'In Cart' : 'Add to Cart'}</span>
                    <span className="material-symbols-outlined text-[18px]">
                        {isInCart ? 'check_circle' : 'add_shopping_cart'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default CourseCard;
