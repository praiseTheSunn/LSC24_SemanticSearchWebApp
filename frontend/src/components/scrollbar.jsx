// Scrollbar.jsx

import React, { useEffect, useState, useRef } from 'react';
import './scrollbar.css';

const Scrollbar = ({dates, selectedDate, setSelectedDate}) => {
    const [thumbTop, setThumbTop] = useState(0);
    const [date, setDate] = useState(null);
    const [showPercentage, setShowPercentage] = useState(false);
    const [percentageTop, setPercentageTop] = useState(0);
    const [interval, setInterval] = useState(0);
    const thumbRef = useRef(null);
    useEffect(() => {
        thumbRef.current = document.getElementById('thumb');
    }, []);

    useEffect(() => {
        const numOfDates = dates.length;
        setInterval(Math.min(numOfDates, 10));

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
        const y = e.clientY - rect.top;
        const maxTop = e.currentTarget.clientHeight - thumbRef.current.clientHeight;
        const newTop = Math.min(Math.max(y - thumbRef.current.clientHeight / 2, 0), maxTop);
        const index = Math.ceil((newTop / maxTop) * (dates.length - 1));
        setSelectedDate(dates[index]);
    };

    const updateContentPosition = (newTop, maxTop) => {
        const index = Math.ceil((newTop / maxTop) * (dates.length - 1));
        setDate(dates[index]);
        setShowPercentage(true);
        setPercentageTop(newTop - 20);
    };

    return (
        <div className="scrollbar" id="scrollbar" onMouseMove={(e) => handleMouseMove(e)} onMouseLeave={() => handleMouseLeave()} onClick={(e) => handleScrollbarClick(e)}>
            <div ref={thumbRef} className="thumb" id="thumb" style={{ top: thumbTop + 'px' }}></div> {/* Thumb element */}
            {showPercentage && <div className="scroll-percentage" id="scrollPercentage" style={{ top: percentageTop + 'px' }}>{date}</div>} {/* Scroll percentage */}
            {dates.map((date, index) => (
                <div key={index} className="" style={{ top: `${percentageTop } px`, width: "100px" }}>{date}</div>  
            ))}
        </div>
    );
}

export default Scrollbar;
