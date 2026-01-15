const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const createCheckout = async (data) => {
    const res = await fetch(`${API_URL}/checkout/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create checkout');
    }
    return res.json();
};

export const getCheckoutStatus = async (checkoutId) => {
    const res = await fetch(`${API_URL}/checkout/${checkoutId}/status`, {
        headers: getHeaders()
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to get status');
    }
    return res.json();
};

export const simulatePayment = async (checkoutId) => {
    const res = await fetch(`${API_URL}/checkout/webhook/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutId })
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Simulation failed');
    }
    return res.json();
};

export const applyCoupon = async (checkoutId, code) => {
    const res = await fetch(`${API_URL}/checkout/${checkoutId}/apply-coupon`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code })
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to apply coupon');
    }
    return res.json();
};

export const getPublicCoupons = async () => {
    const res = await fetch(`${API_URL}/checkout/coupons`, {
        headers: getHeaders()
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to fetch coupons');
    }
    return res.json();
};

export const checkCoupon = async (code, courseIds) => {
    const res = await fetch(`${API_URL}/checkout/check-coupon`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code, courseIds })
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Invalid coupon');
    }
    return res.json();
};
