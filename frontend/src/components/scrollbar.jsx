// Scrollbar.jsx

import React, { useEffect, useState, useRef } from 'react';
import './scrollbar.css';

const Scrollbar = ({dates, selectedDate, setSelectedDate}) => {
    dates = ['2019-01-12', '2019-02-13', '2019-01-15'];
    const [thumbTop, setThumbTop] = useState(0);
    const [percentage, setPercentage] = useState(0);
    const [showPercentage, setShowPercentage] = useState(false);
    const [percentageTop, setPercentageTop] = useState(0);
    const [interval, setInterval] = useState(0);
    const thumbRef = useRef(null);
    useEffect(() => {
        thumbRef.current = document.getElementById('thumb');
    }, []);

    useEffect(() => {
        //sort dates
        dates.sort((a, b) => new Date(a) - new Date(b));

        const numOfDates = dates.length;
        setInterval(100 / numOfDates);

    }, [dates])

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const maxTop = e.currentTarget.clientHeight - thumbRef.current.clientHeight;
        const newTop = Math.min(Math.max(y - thumbRef.current.clientHeight / 2, 0), maxTop);
        updateContentPosition(newTop, maxTop);
    };

    const handleMouseLeave = () => {
        setShowPercentage(false);
    };

    const handleScrollbarClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const thumbPosition = clickY - thumbRef.current.clientHeight / 2;
        const maxTop = e.currentTarget.clientHeight - thumbRef.current.clientHeight;
        const newTop = Math.min(Math.max(thumbPosition, 0), maxTop);
        setThumbTop(newTop);
        updateContentPosition(newTop, maxTop);
    };

    const updateContentPosition = (newTop, maxTop) => {
        setPercentage(Math.floor((newTop / maxTop) * 100));
        setShowPercentage(true);
        setPercentageTop(newTop - 40);
    };

    useEffect(() => {

    }, [percentageTop]);

    return (
        <div className="scrollbar" id="scrollbar" onMouseMove={(e) => handleMouseMove(e)} onMouseLeave={() => handleMouseLeave()} onClick={(e) => handleScrollbarClick(e)}>
            <div ref={thumbRef} className="thumb" id="thumb" style={{ top: thumbTop + 'px' }}></div> {/* Thumb element */}
            {showPercentage && <div className="scroll-percentage" id="scrollPercentage" style={{ top: percentageTop + 'px' }}>{percentage}</div>} {/* Scroll percentage */}
        </div>
    );
}

export default Scrollbar;
