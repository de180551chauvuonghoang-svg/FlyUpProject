import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EarningPulse Component
 * Revenue chart with period tabs
 */
function EarningPulse({ data, isLoading, onPeriodChange }) {
    const [activePeriod, setActivePeriod] = useState('monthly');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState('');
    const canvasRef = useRef(null);
    const pointsRef = useRef([]);
    const [hoverInfo, setHoverInfo] = useState(null);

    const periods = [
        { key: 'monthly', label: 'Monthly' },
        { key: 'quarterly', label: 'Quarterly' },
        { key: 'yearly', label: 'Yearly' },
        { key: 'custom', label: 'Filter' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = [
        { value: '', label: 'All Months' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    const handlePeriodChange = (period) => {
        setActivePeriod(period);
        if (period === 'custom') {
            const payload = { year: selectedYear };
            if (selectedMonth) payload.month = selectedMonth;
            onPeriodChange?.(payload);
        } else {
            onPeriodChange?.(period);
        }
    };

    const handleYearChange = (e) => {
        const y = e.target.value;
        setSelectedYear(y);
        setActivePeriod('custom');
        const payload = { year: y };
        if (selectedMonth) payload.month = selectedMonth;
        onPeriodChange?.(payload);
    };

    const handleMonthChange = (e) => {
        const m = e.target.value;
        setSelectedMonth(m);
        setActivePeriod('custom');
        const payload = { year: selectedYear };
        if (m) payload.month = m;
        onPeriodChange?.(payload);
    };

    const handleMouseMove = (e) => {
        if (!canvasRef.current || pointsRef.current.length === 0) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // Find closest point by X coordinate
        let closest = pointsRef.current[0];
        let minDiff = Math.abs(x - closest.x);
        
        for (let i = 1; i < pointsRef.current.length; i++) {
            const diff = Math.abs(x - pointsRef.current[i].x);
            if (diff < minDiff) {
                minDiff = diff;
                closest = pointsRef.current[i];
            }
        }
        
        // Show tooltip if mouse is reasonably close on X axis (e.g. 40px)
        if (minDiff < 40) {
            setHoverInfo(closest);
        } else {
            setHoverInfo(null);
        }
    };

    const handleMouseLeave = () => {
        setHoverInfo(null);
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
        // Increase left padding to fit Y-axis labels
        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get data points
        const values = data.data || [];
        const labels = data.labels || [];
        // Prevent flatline at bottom if maxValue is 0
        const trueMax = Math.max(...values, 0);
        const maxValue = trueMax === 0 ? 100 : trueMax * 1.1;

        if (values.length === 0) return;

        // Draw Y-axis grid and labels
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'right';
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';

        const formatY = (val) => {
            if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' Tỷ';
            if (val >= 1000000) return Math.round(val / 1000000) + ' Tr';
            if (val >= 1000) return Math.round(val / 1000) + ' K';
            return Math.round(val).toString();
        };

        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const yVal = maxValue * (i / gridSteps);
            const yPos = padding.top + chartHeight - (i / gridSteps) * chartHeight;
            
            // Draw grid line
            ctx.beginPath();
            ctx.moveTo(padding.left, yPos);
            ctx.lineTo(width - padding.right, yPos);
            ctx.stroke();

            // Draw label
            ctx.fillText(formatY(yVal), padding.left - 10, yPos + 4);
        }

        // Calculate points
        const points = values.map((value, i) => ({
            x: padding.left + (i / (values.length - 1)) * chartWidth,
            y: padding.top + chartHeight - (value / maxValue) * chartHeight,
            value: value,
            label: labels[i]
        }));
        pointsRef.current = points;

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

                <div className="period-tabs" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex' }}>
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
                    {activePeriod === 'custom' && (
                        <div className="custom-filters" style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                            <select 
                                value={selectedYear} 
                                onChange={handleYearChange}
                                style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px 8px', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
                            >
                                {years.map(y => <option key={y} value={y} style={{ color: '#000' }}>{y}</option>)}
                            </select>
                            <select 
                                value={selectedMonth} 
                                onChange={handleMonthChange}
                                style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px 8px', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
                            >
                                {months.map(m => <option key={m.value} value={m.value} style={{ color: '#000' }}>{m.label}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="chart-container" style={{ position: 'relative' }}>
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
                        <>
                            <motion.canvas
                                ref={canvasRef}
                                className="chart-canvas"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                            />
                            {hoverInfo && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        position: 'absolute',
                                        left: hoverInfo.x,
                                        top: hoverInfo.y - 45,
                                        transform: 'translateX(-50%)',
                                        backgroundColor: '#1e1e2d',
                                        border: '1px solid #a855f7',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        color: '#fff',
                                        fontSize: '12px',
                                        pointerEvents: 'none',
                                        whiteSpace: 'nowrap',
                                        zIndex: 10,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    <div style={{ color: '#a8a8b3', marginBottom: '4px', fontSize: '11px', textAlign: 'center' }}>{hoverInfo.label}</div>
                                    <div style={{ fontWeight: 600, color: '#d946ef', textAlign: 'center' }}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(hoverInfo.value)}
                                    </div>
                                </motion.div>
                            )}
                        </>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default EarningPulse;
