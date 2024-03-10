import './home.css';
import React, { useState } from 'react';
import './home.css';
import LeftPanel from '../../components/leftPanel';
import RightPanel from '../../components/rightPanel';
import { SelectedImagesProvider } from '../../selectedImageContext';
import SinglePopup from '../../components/Popup/singlePopup';
import NeighborPopup from '../../components/Popup/neighborPopup';

const Home = ({selectedFilters}) => {
    
    console.log('selectedFilters in home', selectedFilters);

    const [displayedFilters, setDisplayedFilters] = useState([]);
    const [query, setQuery] = useState('');
    const [viewImage, setViewImage] = useState("a");
    const [viewNeighbors, setViewNeighbors] = useState(false);
    
    const closePopup = () => {
        console.log('closePopup');
        setViewImage("");
    }

    return (
        <div className='home-main-container'>
            {viewImage !== "" && <SinglePopup closePopup={closePopup} image={viewImage} />}
            {viewNeighbors && <NeighborPopup closePopup={() => setViewNeighbors(false)} image={viewImage} />}
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
