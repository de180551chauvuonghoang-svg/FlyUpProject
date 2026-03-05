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
    const { data: enrollmentData } = useQuery({
        queryKey: ['userEnrollments', user?.id],
        queryFn: () => fetchUserEnrollments(user.id),
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const enrolledCourseIds = new Set(enrollmentData?.enrollments?.map(e => e.CourseId) || []);

    const addToCart = (course) => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để mua khóa học.', {
                icon: '🔒',
            });
            return;
        }

        // Check if already enrolled
        if (enrolledCourseIds.has(course.id || course.Id)) { // Handle both id cases just in case
             toast('Bạn đã sở hữu khóa học này!', {
                icon: 'ℹ️',
                style: {
                    background: '#ca8a04', // Yellow 600
                    color: '#fff',
                    border: '1px solid #eab308' // Yellow 500
                }
            });
            return;
        }

        if (cart.find((item) => item.id === course.id)) {
            toast('Khóa học này đã có trong giỏ hàng.', {
                icon: 'ℹ️',
                style: {
                    background: '#ca8a04', // Yellow 600
                    color: '#fff',
                    border: '1px solid #eab308' // Yellow 500
                }
            });
            return;
        }

        setCart((prevCart) => [...prevCart, course]);

        toast.success('Đã thêm vào giỏ hàng!', {
            icon: '🛍️'
        });
    };

    const removeFromCart = (courseId) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== courseId));
        toast.success('Đã xóa khỏi giỏ hàng');
    };

    const clearCart = () => {
        setCart([]);
        toast.success('Đã làm sạch giỏ hàng');
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
        cartTotal
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartProvider;
