/**
 * Utility functions for formatting values
 */

/**
 * Format large numbers with K, M suffixes
 * @param {number} num - Number to format
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string}
 */
export const formatNumber = (num, decimals = 1) => {
    if (num === null || num === undefined) return '0';

    if (num >= 1000000) {
        return (num / 1000000).toFixed(decimals).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(decimals).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
};

/**
 * Format number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string}
 */
export const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return '$0';

    if (amount >= 1000) {
        return '$' + formatNumber(amount);
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Format percentage with sign
 * @param {number} value - Percentage value
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string}
 */
export const formatPercentage = (value, decimals = 1) => {
    if (value === null || value === undefined) return '0%';

    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Format rating with suffix
 * @param {number} rating - Rating value
 * @param {number} max - Maximum rating (default: 5)
 * @returns {string}
 */
export const formatRating = (rating, max = 5) => {
    if (rating === null || rating === undefined) return '0';
    return `${rating.toFixed(1)}/${max}`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
};
