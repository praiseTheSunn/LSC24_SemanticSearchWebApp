import './header.css'
import { useState } from 'react';

const Header = ({selectedFilters,setselectedFilters}) => {
    const [textareaValue, setTextareaValue] = useState('');
    const [textareaHeight, setTextareaHeight] = useState('100%');

    const handleTextareaChange = (event) => {
        setTextareaValue(event.target.value);
        // Automatically adjust height based on content if it exceeds the current height
        if (event.target.scrollHeight > event.target.clientHeight) {
            setTextareaHeight(event.target.scrollHeight + 'px');
        }
    };

    const handleTextareaBlur = () => {
        // Reset height when textarea loses focus
        setTextareaHeight('70%');
    };

    const handleTextareaFocus = (event) => {
        setTextareaHeight(event.target.scrollHeight + 'px');
    }

    const [filters, setFilters] = useState({
        caption: '',
        country: '',
        city: '',
        location: '',
        date: '',
        local_time: '',
        movement: '',
        ocr: '',
        tags: '',
    });

    const handleInputChange = (event, category) => {
        const { value } = event.target;
        setFilters({ ...filters, [category]: value });
    };

    const handleClearFilter = () => {
        // Clear input fields
        setFilters({
            caption: '',
            country: '',
            city: '',
            location: '',
            date: '',
            local_time: '',
            movement: '',
            ocr: '',
            tags: '',
        });
    };

    const handleAddFilter = () => {
        const newFilters = Object.entries(filters)
            .filter(([_, value]) => value !== '')
            .map(([category, value]) => ({ category, value }));
        setselectedFilters(newFilters);
        // Clear input fields
        handleClearFilter();
        // console.log('newFilters', newFilters);
    };
    
    return (
        <div className="header">
            <div className='search-area'>
                <textarea
                    style={{ height: textareaHeight }}
                    value={textareaValue}
                    onChange={handleTextareaChange}
                    onBlur={handleTextareaBlur}
                    onFocus={handleTextareaFocus}
                    placeholder="Search something..."
                    className='search-textarea'
                    rows={2}
                    />
            </div>
            <div className='filter-area'>
                
                {Object.entries(filters).map(([category, value]) => (
                <input
                    key={category}
                    type="text"
                    placeholder={category}
                    value={value}
                    style={{ width: (category === 'date' || category === 'local_time' || category === 'movement' || category === 'tags') ? '100px' : '200px' }}
                    onChange={(event) => handleInputChange(event, category)}
                />
                ))}
                <button onClick={handleAddFilter} type="button" className="btn btn-primary">Add</button>
                <button onClick={handleClearFilter} type="button" className="btn btn-danger">Clear</button>
            </div>
        </div>
    );
};

export default Header;