import React from 'react';

const FilterTag = ({index, filter, onIconClick}) => {
    // console.log('filter', filter);
    const filterValue = Array.isArray(filter.value) ? filter.value.join(', ') : filter.value;
    return (
        <div className='filter-tag-container h-fit w-full block' key={index}>
            <label className='gray text-sm' htmlFor={`${filter.category}-${filterValue}`}>{filter.category}</label>
            <div className={`form-control tag-content flex flex-row w-full pr-[3px] `} id={`${filter.category}-${filter.value}`}
                style={{
                    backgroundColor: `${filter.status === 1 ? 'rgb(170, 247, 155)' : 'rgb(253, 174, 174)'}`,
                }}
            >
                <div className='tag-value w-full text-wrap break-all'>{filterValue}</div>
                <div className='icon-container flex flex-row h-[28px] w-[15px] items-center ml-[3px]'>
                    <div className={`${filter.status === 1 ? 'enable-icon' : 'disable-icon'} w-[10px] h-[10px] cursor-pointer`} 
                    title={`${filter.status === 1 ? 'Disable' : 'Enable'}`} 
                    style={{ 
                        borderRadius: '3px',
                        backgroundColor: `${filter.status === 1 ? 'rgb(29, 162, 3)' : 'rgb(211, 0, 0)'}`
                    }}
                    onClick={() => onIconClick(index)}></div>
                </div>
            </div>
        </div>
    )
};

export default FilterTag;