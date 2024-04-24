// scroll-bar-sim.jsx
import './scroll-bar-sim.css';
import React from "react";

const Scrollbarsim = ({ children }) => {
    return (
        // <div style={{ overflowY: 'scroll', height: '600px'}}>
        //     {children}
        // </div>
        <div className="scrollbarsim-container">
            <div className="scrollbarsim">
                {children}
            </div>
        </div>
    );
}

export default Scrollbarsim;