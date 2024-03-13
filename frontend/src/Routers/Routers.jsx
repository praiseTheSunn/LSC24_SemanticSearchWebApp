import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import Home from '../pages/Home/home';
const Routers = () => {

    return (
        <Router>
            {/* <Header setselectedFilters={setSelectedFilters} query = {query} /> */}
            <Routes>
                <Route path="/" element={<Home />} />
            </Routes>
        </Router>
    );
};

export default Routers;