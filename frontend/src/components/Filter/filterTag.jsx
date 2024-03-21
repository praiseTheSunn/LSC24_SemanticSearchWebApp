import './filterTag.css'
import React from 'react';

const FilterTag = ({index, filter, onIconClick}) => {
    // console.log('filter', filter);
    const filterValue = Array.isArray(filter.value) ? filter.value.join(', ') : filter.value;
    return (
        <div className='filter-tag-container' key={index}>
            <label htmlFor={`${filter.category}-${filterValue}`}>{filter.category}</label>
            <div className={`form-control tag-content ${filter.status === 1 ? 'green' : 'red'}`} id={`${filter.category}-${filter.value}`}>
                <div className='tag-value'>{filterValue}</div>
                <div className='icon-container'>
                    <div className={`${filter.status === 1 ? 'enable-icon' : 'disable-icon'}`} 
                    title={`${filter.status === 1 ? 'Disable' : 'Enable'}`} 
                    onClick={() => onIconClick(index)}></div>
                </div>
            </div>
        </div>
    )
};

export default FilterTag;