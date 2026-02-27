import React, { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { fetchUserEnrollments } from '../services/userService';
import { CartContext } from './cartContextDef';
import { AuthContext } from './authContextDef';

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const storedCart = localStorage.getItem('cart');
            return storedCart ? JSON.parse(storedCart) : [];
        } catch (error) {
            console.error('Failed to parse cart from localStorage:', error);
            return [];
        }
    });
    const { user } = useContext(AuthContext);

    // Persist cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // Fetch user enrollments to check for duplicates
    // eslint-disable-next-line no-unused-vars
    const { data: enrollmentData } = useQuery({
        queryKey: ['userEnrollments', user?.id],
        queryFn: () => fetchUserEnrollments(user.id),
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const enrolledCourseIds = new Set(enrollmentData?.enrollments?.map(e => e.CourseId) || []);

    const addToCart = (course) => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để thêm vào giỏ', {
                icon: '🔒',
                className: 'flyup-toast flyup-toast--error',
                style: {
                    borderRadius: '14px',
                    background: '#c0152a',
                    color: '#fff',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 8px 32px rgba(192,21,42,0.5), 0 2px 12px rgba(0,0,0,0.4)',
                    padding: '14px 18px',
                    fontSize: '14px',
                    fontWeight: '600',
                    minWidth: '280px',
                    maxWidth: '380px',
                },
            });
            return;
        }

        // Check if already enrolled
        if (enrolledCourseIds.has(course.id || course.Id)) { // Handle both id cases just in case
             toast.error('Khóa học đã đăng ký!', {
                icon: '🚫',
                className: 'flyup-toast flyup-toast--error',
                style: {
                    borderRadius: '14px',
                    background: '#c0152a',
                    color: '#fff',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 8px 32px rgba(192,21,42,0.5), 0 2px 12px rgba(0,0,0,0.4)',
                    padding: '14px 18px',
                    fontSize: '14px',
                    fontWeight: '600',
                    minWidth: '280px',
                    maxWidth: '380px',
                },
            });
            return;
        }

        if (cart.find((item) => item.id === course.id)) {
            toast.error('Khóa học đã có trong giỏ!', {
                icon: '🛒',
                className: 'flyup-toast flyup-toast--error',
                style: {
                    borderRadius: '14px',
                    background: '#c0152a',
                    color: '#fff',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 8px 32px rgba(192,21,42,0.5), 0 2px 12px rgba(0,0,0,0.4)',
                    padding: '14px 18px',
                    fontSize: '14px',
                    fontWeight: '600',
                    minWidth: '280px',
                    maxWidth: '380px',
                },
            });
            return;
        }

        setCart((prevCart) => [...prevCart, course]);

        toast.success('Đã thêm vào giỏ hàng!', {
            icon: '🚀',
            className: 'flyup-toast flyup-toast--success',
            style: {
                borderRadius: '14px',
                background: '#0f7a45',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.25)',
                boxShadow: '0 8px 32px rgba(15,122,69,0.5), 0 2px 12px rgba(0,0,0,0.4)',
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: '600',
                minWidth: '280px',
                maxWidth: '380px',
            },
        });
    };

    const removeFromCart = (courseId) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== courseId));
        toast.success('Đã xóa khỏi giỏ hàng', {
            icon: '🗑️',
            className: 'flyup-toast flyup-toast--success',
            style: {
                borderRadius: '14px',
                background: '#0f7a45',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.25)',
                boxShadow: '0 8px 32px rgba(15,122,69,0.5), 0 2px 12px rgba(0,0,0,0.4)',
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: '600',
                minWidth: '280px',
                maxWidth: '380px',
            },
        });
    };

    const clearCart = () => {
        setCart([]);
        toast.success('Đã xóa toàn bộ giỏ hàng', {
            icon: '✨',
            className: 'flyup-toast flyup-toast--success',
            style: {
                borderRadius: '14px',
                background: '#0f7a45',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.25)',
                boxShadow: '0 8px 32px rgba(15,122,69,0.5), 0 2px 12px rgba(0,0,0,0.4)',
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: '600',
                minWidth: '280px',
                maxWidth: '380px',
            },
        });
    };

    const cartCount = cart.length;

    const cartTotal = cart.reduce((total, item) => {
         // Assuming item.price is a number. If string, parse it.
         const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
         return total + (isNaN(price) ? 0 : price);
    }, 0);


    const value = {
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        enrolledCourseIds,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartProvider;
