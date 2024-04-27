import FilterTag from "../Filter/filterTag";
import './messagePopup.css';

const messagePopup = ({displayedFilters, setDisplayedFilters,setDisplayedImages}) => {

    const handleClearAll = () => {
        setDisplayedFilters([]);
        setDisplayedImages(false);
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

    return (
        <div className='filter-container messagePopup'>
            <button type="button" className="btn btn-link clear-filter-button" onClick={handleClearAll}>Clear</button>
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
                    -sl ... : semantic location <br/>
                    -lc ... : location category<br/>
                    -t ... : time<br/>
                    -ocr ... : OCR text<br/>
                    -obj ... : Object Detection<br/>
                    -c : Turn on caption search<br/>
                </div>
            </div>
            
        </div>
    )
};
export default messagePopup;