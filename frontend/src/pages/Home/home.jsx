import './home.css';
import React, { useState } from 'react';
import './home.css';
import LeftPanel from '../../components/leftPanel';
import RightPanel from '../../components/rightPanel';
import { usePopUp } from '../../contexts/popUpContext';
import LoadingPopup from '../../components/Popup/loadingPopup';


const Home = ({selectedFilters}) => {
    
    console.log('selectedFilters in home', selectedFilters);

    const [displayedFilters, setDisplayedFilters] = useState([]);
    const [query, setQuery] = useState('');
    const {loadingPopUp} = usePopUp();

    return (
        <div className='home-main-container'>
            {loadingPopUp && <LoadingPopup />}
            <LeftPanel 
                displayedFilters={displayedFilters} 
                setDisplayedFilters={setDisplayedFilters} 
                setQuery={setQuery}
            />
            
            <RightPanel 
                query={query}
                filters={displayedFilters}
            />
            
        </div>
    );
    };
    export default Home;
