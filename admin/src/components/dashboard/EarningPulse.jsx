import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EarningPulse Component
 * Revenue chart with period tabs
 */
function EarningPulse({ data, isLoading, onPeriodChange }) {
    const [activePeriod, setActivePeriod] = useState('quarterly');
    const canvasRef = useRef(null);

    const periods = [
        { key: 'quarterly', label: 'Quarterly' },
        { key: 'yearly', label: 'Yearly' },
        { key: 'max', label: 'Max' },
    ];

    const handlePeriodChange = (period) => {
        setActivePeriod(period);
        onPeriodChange?.(period);
    };

    // Draw chart when data changes
    useEffect(() => {
        if (!data || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Set canvas size
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 20, bottom: 40, left: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get data points
        const values = data.data || [];
        const labels = data.labels || [];
        const maxValue = Math.max(...values) * 1.1;

        if (values.length === 0) return;

        // Calculate points
        const points = values.map((value, i) => ({
            x: padding.left + (i / (values.length - 1)) * chartWidth,
            y: padding.top + chartHeight - (value / maxValue) * chartHeight,
        }));

        // Create gradient for area fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
        gradient.addColorStop(0.5, 'rgba(217, 70, 239, 0.2)');
        gradient.addColorStop(1, 'rgba(217, 70, 239, 0)');

        // Draw area fill
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding.bottom);
        points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
        lineGradient.addColorStop(0, '#8b5cf6');
        lineGradient.addColorStop(1, '#d946ef');

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        // Smooth curve using bezier
        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.quadraticCurveTo(
            points[points.length - 1].x,
            points[points.length - 1].y,
            points[points.length - 1].x,
            points[points.length - 1].y
        );

        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw points
        points.forEach((point, i) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#0a0a1a';
            ctx.fill();
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw labels
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';

        labels.forEach((label, i) => {
            const x = padding.left + (i / (labels.length - 1)) * chartWidth;
            ctx.fillText(label, x, height - 10);
        });

    }, [data]);

    return (
        <motion.div
            className="earning-pulse"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <div className="earning-header">
                <div>
                    <h3 className="earning-title">Earning Pulse</h3>
                    <p className="earning-subtitle">Real-time revenue transmission across all quadrants</p>
                </div>

                <div className="period-tabs">
                    {periods.map(period => (
                        <button
                            key={period.key}
                            className={`period-tab ${activePeriod === period.key ? 'active' : ''}`}
                            onClick={() => handlePeriodChange(period.key)}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="chart-container">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            className="chart-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="loading-pulse"></div>
                        </motion.div>
                    ) : (
                        <motion.canvas
                            ref={canvasRef}
                            className="chart-canvas"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default EarningPulse;
