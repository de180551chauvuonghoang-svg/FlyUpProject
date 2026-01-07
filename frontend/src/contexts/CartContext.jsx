import React, { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
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

    const addToCart = (course) => {
        if (!user) {
            toast.error('Please login to add to cart', {
                icon: '🔒',
                style: {
                    borderRadius: '10px',
                    background: '#1A1333',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
            });
            return;
        }

        if (cart.find((item) => item.id === course.id)) {
            toast.error('Course already in cart!', {
                icon: '🛒',
                style: {
                    borderRadius: '10px',
                    background: '#1A1333',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
            });
            return;
        }

        setCart((prevCart) => [...prevCart, course]);

        toast.success('Added to cart!', {
            icon: '🚀',
            style: {
                borderRadius: '10px',
                background: '#1A1333',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
            },
        });
    };

    const removeFromCart = (courseId) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== courseId));
        toast.success('Removed from cart', {
            style: {
                borderRadius: '10px',
                background: '#1A1333',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
            },
        });
    };

    const clearCart = () => {
        setCart([]);
        toast.success('Cart cleared', {
            style: {
                borderRadius: '10px',
                background: '#1A1333',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
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
        cartTotal
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartProvider;
