import React, { useEffect, useRef, useState } from 'react';
import { useSelectedImages } from '../contexts/selectedImageContext';
import { MessagePopup, ObjectPositionPopup } from '.';
import { ObjectPosIcon } from '../assets';
import imageService from '../services/imageService';
import Dropdown from './dropDown'; 
import { usePopUp } from '../contexts/popUpContext';

const SearchBox = ({displayedFilters, setDisplayedFilters, setQuery, setResult, setModel, setMode, handleFilterChange, setCacheResult, setSearchTerms}) => {
    const [textareaValue, setTextareaValue] = useState('');
    const [textareaHeight, setTextareaHeight] = useState('60px');
    const { setDisplayedImages} = useSelectedImages();
    const [isFocus, setIsFocus] = useState(false);
    const messagePopup = useRef(null);
    const objPosPopup = useRef(null);
    const [showMessagePopup, setShowMessagePopup] = useState(false);
    const [showObjectPosPopup, setShowObjectPosPopup] = useState(false);
    const { setLoadingPopUp } = usePopUp();

    useEffect(() => {
        messagePopup.current = document.querySelector('.messagePopup');
        objPosPopup.current = document.querySelector('.objectPosPopup');
        const handleClickOutside = (event) => {
            if (messagePopup.current && !messagePopup.current.contains(event.target)) {
                setShowMessagePopup(false);
                // console.log('messagePopup', messagePopup);
            }
            if (objPosPopup.current && !objPosPopup.current.contains(event.target)) {
                setShowObjectPosPopup(false);
                // console.log('objPosPopup', objPosPopup);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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
        
    };

    const handleTextareaFocus = (event) => {
        //check if the text area has content
        if (event.target.value) {
            setTextareaHeight(event.target.scrollHeight + 'px');
        }
        setShowMessagePopup(true);
        // console.log('messagePopup', messagePopup);
        setIsFocus(true);
    }

    const handleEnter = (event) => {
        if (event.key === 'Enter') {
            // setDisplayedImages(false);
            event.preventDefault(); // Prevent default behavior
            console.log('Enter key pressed');
            const input = event.target.value.trim();
            if (input.startsWith('-lo ')) {
                const value = input.substring(4);
                const filter = { category: 'location', value, status: 1 };
                setDisplayedFilters(previousState => [...previousState, filter]);
                handleFilterChange('location', value);
            } else if (input.startsWith('-t ')) {
                const value = input.substring(3);
                const filter = { category: 'time', value, status: 1 };
                setDisplayedFilters(previousState => [...previousState, filter]);
                handleFilterChange('time', value);
            } else if (input.startsWith('-d ')) {
                const value = input.substring(3);
                const filter = { category: 'date', value, status: 1 };
                setDisplayedFilters(previousState => [...previousState, filter]);
                handleFilterChange('date', value);
            } else if (input.startsWith('-ocr ')) {
                const value = input.substring(5);
                const filter = { category: 'ocr', value, status: 1 };
                setDisplayedFilters(previousState => [...previousState, filter]);
                handleFilterChange('ocr', value);
            } else if (input.startsWith('-obj ')) {
                const value = input.substring(5);
                const filter = { category: 'object_tags', value, status: 1 };
                setDisplayedFilters(previousState => [...previousState, filter]);
                handleFilterChange('object_tags', value);
            } else if (input === '-c') {
                // Handle special case
            }      
            else{
                const value = input;
                const filter = { category: 'query', value, status: 1 };
                // console.log('input', input);
                setQuery(value);
                setDisplayedFilters(previousState => [...previousState, filter]);
                setLoadingPopUp(true);
            }
            setTextareaValue('');
            setDisplayedImages(true);
            setShowMessagePopup(true);
        }
        
    };

    
    const openObjPosPopup = () => {
        setShowObjectPosPopup(true);
    }

    

    return(
        // <div className='left-filter-container'>
            <div className='text-query-container flex-row' style={{
                width: "auto",
                height: "50px",
                paddingBottom: "5px",
                display: "flex",
                position: "relative",
                marginTop: "10px",
                marginLeft: "10px",
                marginBottom: "10px",
            }}
            
            >
                
                <textarea
                    style={{ 
                        height: textareaHeight,
                        width: "286px",
                        display: "block",
                        position: "relative",
                        boxShadow: "2px 3px #c8c5c5 ",
                        border: "solid 1.9px #636262",
                        borderRadius: "10px",
                        overflow: "hidden",
                        zIndex: "10",
                        paddingLeft: "7px",
                        paddingTop: "5px",

                    }}
                    value={textareaValue}
                    onChange={handleTextareaChange}
                   
                    placeholder="Search here then Enter..."
                    className='search-textarea'
                    rows={2}
                    onKeyDown={handleEnter}
                    // onMouseEnter={() => messagePopup.current.classList.remove('hidden')}
                    onBlur={handleTextareaBlur}
                    onFocus={(e) => handleTextareaFocus(e)}
                    onMouseLeave={() => isFocus ? {} : setShowMessagePopup(false)}
                    
                />
                <div className='absolute left-0'>
                   <MessagePopup setSearchTerms={setSearchTerms} displayedFilters={displayedFilters} showPopup={showMessagePopup} setDisplayedFilters={setDisplayedFilters} setDisplayedImages={setDisplayedImages}/>
                </div>
                <div className='relative flex-row flex flex-nowrap'>
                    <img src={ObjectPosIcon} alt = 'object_pos_icon' className='ml-3 mt-2 size-9 cursor-pointer relative' onClick={() => openObjPosPopup()}/>
                    <ObjectPositionPopup setCacheResult={setCacheResult} showPopup={showObjectPosPopup} setResult={setResult}/>
                </div>
                <div className='ml-3 mt-2'>
                    <Dropdown
                    // className='ml-300'
                    label="Model"
                    displayItems={['CLIP', 'BLIP2', 'BEiT-3', 'STFM']}
                    valueItems={['clip', 'blip2', 'beit3', 'stfm']}
                    setData={setModel}
                    />
                </div>
                <div className='ml-3 mt-2'>
                    <Dropdown
                    // className='ml-10'
                    label="Mode"
                    displayItems={['Semantic', 'Semantic-Full text', 'Semantic-Autoparse']}
                    valueItems={['smt', 'smt-mm-dtin', 'smt-3m-dtin']}
                    setData={setMode}
                    />
                </div>
            </div>
        // {/* </div> */}
    );
};

export default SearchBox;