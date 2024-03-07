import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import Header from '../layout/header';
import Home from '../pages/Home/home';
import { useState } from 'react';

const Routers = () => {
    const [selectedFilters, setSelectedFilters] = useState([]);
    const removeFilter = (indexToRemove) => {
        setSelectedFilters((prevFilters) => prevFilters.filter((_, index) => index !== indexToRemove));
        console.log('selectedFilters in router: ', selectedFilters);
    };

    return (
        <Router>
            <Header setselectedFilters={setSelectedFilters} />
            <Routes>
                <Route path="/" element={<Home selectedFilters={selectedFilters} removeFilters={removeFilter}/>} />
            </Routes>
        </Router>
    );
};

export default Routers;