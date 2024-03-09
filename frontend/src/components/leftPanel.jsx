import FilterTag from './Filter/filterTag';
import './leftPanel.css'
import React, { useState } from 'react';

const LeftPanel = ({displayedFilters, setDisplayedFilters, setQuery}) => {
    const [textareaValue, setTextareaValue] = useState('');
    const [textareaHeight, setTextareaHeight] = useState('90px');

    const handleTextareaChange = (event) => {
        setTextareaValue(event.target.value);
        // Automatically adjust height based on content if it exceeds the current height
        if (event.target.scrollHeight > event.target.clientHeight) {
            setTextareaHeight(event.target.scrollHeight + 'px');
        }
    };

    const handleTextareaBlur = () => {
        // Reset height when textarea loses focus
        setTextareaHeight('90px');
    };

    const handleTextareaFocus = (event) => {
        //check if the text area has content
        if (event.target.value) {
            setTextareaHeight(event.target.scrollHeight + 'px');
        }
    }

    const handleClearAll = () => {
        setDisplayedFilters([]);
    };

    const handleEnter = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default behavior
            console.log('Enter key pressed');
            const input = event.target.value.trim();
            if (input.startsWith('-l ')) {
                const value = input.substring(3);
                const filter = { category: 'location', value, status: 1 };
                console.log('filter', filter);
                setDisplayedFilters(previousState => [...previousState, filter]);
            } else if (input.startsWith('-t ')) {
                const value = input.substring(3);
                const filter = { category: 'time', value, status: 1 };
                setDisplayedFilters(previousState => [...previousState, filter]);
            } else if (input.startsWith('-ocr ')) {
                const value = input.substring(5);
                const filter = { category: 'ocr', value, status: 1 };
                setDisplayedFilters(previousState => [...previousState, filter]);
            } else if (input.startsWith('-obj ')) {
                const value = input.substring(5);
                const filter = { category: 'objects', value, status: 1 };
                setDisplayedFilters(previousState => [...previousState, filter]);
            } else if (input === '-c') {
                // Handle special case
            }else{
                const value = input;
                const filter = { category: 'query', value, status: 1 };
                setQuery(value);
                setDisplayedFilters(previousState => [...previousState, filter]);
            }
            setTextareaValue('');
            
        }
    };

    const onIconClick = (index) => {
        // Create a new array with updated filters
        const updatedFilters = displayedFilters.map((filter, i) => {
            if (i === index) {
                // Toggle the status of the clicked filter
                return { ...filter, status: filter.status === 1 ? 0 : 1 };
            }
            return filter;
        });
        // Set the state with the updated filters
        setDisplayedFilters(updatedFilters);
    }

    return(
        <div className='left-filter-container'>
            <div className='text-query-container'>
                <textarea
                    style={{ height: textareaHeight }}
                    value={textareaValue}
                    onChange={handleTextareaChange}
                    onBlur={handleTextareaBlur}
                    onFocus={handleTextareaFocus}
                    placeholder="Search here then Enter..."
                    className='search-textarea'
                    rows={2}
                    onKeyDown={handleEnter}
                    />
            </div>
            
            <div className='filter-container'>
                <button type="button" class="btn btn-link clear-filter-button" onClick={handleClearAll}>Clear</button>
                <div className='filter-item-area'>
                    {displayedFilters.map((filter, index) => (
                        <FilterTag
                            key={index}
                            filter={filter}
                            index={index}
                            onIconClick={onIconClick}
                        />
                    ))}
                    
                    <div className='filter-instruction'>
                        -l ... : location <br/>
                        -t ... : time<br/>
                        -ocr ... : OCR text<br/>
                        -obj ... : Object Detection<br/>
                        -c : Turn on caption search<br/>
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default LeftPanel;