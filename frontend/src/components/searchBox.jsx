import './searchBox.css'
import React, { useEffect, useRef, useState } from 'react';
import { useSelectedImages } from '../contexts/selectedImageContext';
import { MessagePopup } from '.';

const SearchBox = ({displayedFilters, setDisplayedFilters, setQuery}) => {
    const [textareaValue, setTextareaValue] = useState('');
    const [textareaHeight, setTextareaHeight] = useState('60px');
    const {displayedImages, setDisplayedImages} = useSelectedImages();
    const [isFocus, setIsFocus] = useState(false);
    const messagePopup = useRef(null);

    useEffect(() => {
        
        messagePopup.current = document.querySelector('.messagePopup');
        console.log('messagePopup', messagePopup);
        messagePopup.current.classList.add('hidden');
    }, []);

    const handleTextareaChange = (event) => {
        setTextareaValue(event.target.value);
        // Automatically adjust height based on content if it exceeds the current height
        if (event.target.scrollHeight > event.target.clientHeight) {
            setTextareaHeight(event.target.scrollHeight + 'px');
        }
    };

    const handleTextareaBlur = () => {
        // Reset height when textarea loses focus
        setTextareaHeight('60px');
        messagePopup.current.classList.add('hidden');
        setIsFocus(false);
    };

    const handleTextareaFocus = (event) => {
        //check if the text area has content
        if (event.target.value) {
            setTextareaHeight(event.target.scrollHeight + 'px');
        }
        messagePopup.current.classList.remove('hidden');
        console.log('messagePopup', messagePopup);
        setIsFocus(true);
    }

    const handleEnter = (event) => {
        if (event.key === 'Enter') {
            setDisplayedImages(false);
            event.preventDefault(); // Prevent default behavior
            console.log('Enter key pressed');
            const input = event.target.value.trim();
            if (input.startsWith('-sl ')) {
                const value = input.substring(3);
                const filter = { category: 'semantic location', value, status: 1 };
                setDisplayedFilters(previousState => [...previousState, filter]);
            } else if (input.startsWith('-t ')) {
                const value = input.substring(3);
                const filter = { category: 'time', value, status: 1 };
                setDisplayedFilters(previousState => [...previousState, filter]);
            } else if (input.startsWith('-lc ')) {
                const value = input.substring(3);
                const filter = { category: 'location category', value, status: 1 };
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
            setDisplayedImages(true);
        }
    };

    

    return(
        // <div className='left-filter-container'>
            <div className='text-query-container'>
                <textarea
                    style={{ height: textareaHeight }}
                    value={textareaValue}
                    onChange={handleTextareaChange}
                    onBlur={handleTextareaBlur}
                    onFocus={(e) => handleTextareaFocus(e)}
                    placeholder="Search here then Enter..."
                    className='search-textarea'
                    rows={2}
                    onKeyDown={handleEnter}
                    // onMouseEnter={() => messagePopup.current.classList.remove('hidden')}
                    onMouseLeave={() => isFocus ? {} : messagePopup.current.classList.add('hidden')}
                />
                <div>
                <MessagePopup displayedFilters={displayedFilters} setDisplayedFilters={setDisplayedFilters} setDisplayedImages={setDisplayedImages}/>
                </div>
                
            </div>
        // {/* </div> */}
    );
};

export default SearchBox;