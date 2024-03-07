import './home.css';
import React, { useEffect, useState } from 'react';
import './home.css';
import fakeimg from '../../assets/bcn.png';
import FilterTag from '../../components/Filter/filterTag';

const Home = ({selectedFilters}) => {
    const links = [
        fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
    ]
    const [images, setImages] = useState(links);

    // Function to handle adding images
    const handleAddImage = () => {
        setImages(links);
    };
    
    console.log('selectedFilters in home', selectedFilters);

    const [displayedFilters, setDisplayedFilters] = useState([]);

    useEffect(() => {
        setDisplayedFilters(previousState => {
            const updatedFilters = [...previousState];
            selectedFilters.forEach(filter => {
                if (!updatedFilters.some(f => f.category === filter.category && f.value === filter.value)) {
                    updatedFilters.push({ ...filter, status: 1 });
                }
            });
            return updatedFilters;
        });
    }, [selectedFilters]);

    const removeFilters = (index) => {
        setDisplayedFilters(previousState => {
            return previousState.filter((_, i) => i !== index);
        });
    };

    const handleAndIconClick = (index) => {
        setDisplayedFilters(previousState => {
            const updatedFilters = [...previousState];
            updatedFilters[index].status = 1;
            return updatedFilters;
        });
    };

    const handleOrIconClick = (index) => {
        setDisplayedFilters(previousState => {
            const updatedFilters = [...previousState];
            updatedFilters[index].status = 2;
            return updatedFilters;
        });
    };

    const handleClearAll = () => {
        setDisplayedFilters([]);
    };

    return (
        <div className='home-main-container'>
            <div className='left-filter-container'>
                <div className='filter-container'>
                    <button type="button" class="btn btn-link clear-filter-button" onClick={handleClearAll}>Clear</button>
                    <div className='filter-item-area'>
                    {displayedFilters.map((filter, index) => (
                        <div className='filter-tag-container' key={index}>
                            <label htmlFor={`${filter.category}-${filter.value}`}>{filter.category}</label>
                            <div className={`form-control tag-content ${filter.status === 1 ? 'green' : 'yellow'}`} id={`${filter.category}-${filter.value}`}>
                                <div className='tag-value'>{filter.value}</div>
                                <div className='icon-container'>
                                    <div className='and-icon' title='AND' onClick={() => handleAndIconClick(index)}></div>
                                    <div className='or-icon' title='OR' onClick={() => handleOrIconClick(index)}></div>
                                    <div className='remove-icon' title='REMOVE' onClick={() => removeFilters(index)}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
            <div className='right-content-container'>
                <div className='grid-container'>
                    {images.map((imageUrl, index) => (
                        <div key={index} className='grid-item'>
                            <img src={imageUrl} alt={`Image ${index + 1}`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    };
    export default Home;
