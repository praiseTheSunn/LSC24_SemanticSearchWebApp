import './home.css';
import React, { useState } from 'react';
import './home.css';
import LeftPanel from '../../components/leftPanel';
import RightPanel from '../../components/rightPanel';
import { SelectedImagesProvider } from '../../selectedImageContext';


const Home = ({selectedFilters}) => {
    
    console.log('selectedFilters in home', selectedFilters);

    const [displayedFilters, setDisplayedFilters] = useState([]);
    const [query, setQuery] = useState('');

    return (
        <div className='home-main-container'>
            
            <LeftPanel 
                displayedFilters={displayedFilters} 
                setDisplayedFilters={setDisplayedFilters} 
                setQuery={setQuery}
            />
            <SelectedImagesProvider>
                <RightPanel 
                    query={query}
                    filters={displayedFilters}
                />
            </SelectedImagesProvider>
            
        </div>
    );
    };
    export default Home;
