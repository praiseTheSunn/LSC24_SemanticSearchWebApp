import './filterTag.css'

// 1 GREEN AND
// 2 YELLOW OR 
// 3 REMOVE 

import React, { useState } from 'react';

const FilterTag = ({ category, value, state, removeFilters }) => {
    const tagId = `${category}-${value}`; // Generate a distinct id for each tag
    const [backgroundColor, setBackgroundColor] = useState('green');

    const handleAndIconClick = () => {
        setBackgroundColor('green');
        state = 1;
    };

    const handleOrIconClick = () => {
        setBackgroundColor('yellow');
        state = 2;
    };
};

export default FilterTag;