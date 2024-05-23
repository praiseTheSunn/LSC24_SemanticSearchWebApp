import FilterTag from "../Filter/filterTag";

const messagePopup = ({displayedFilters, setDisplayedFilters, setDisplayedImages, showPopup}) => {

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
        <div className='filter-container messagePopup'
        style={{
            backgroundColor: 'rgb(206, 232, 255)',
            maxHeight: showPopup ? '350px' : '0px',
            width: showPopup ? '286px' : '0px',
            minHeight: showPopup ? '250px' : '0px',
            position: 'absolute',
            borderRadius: '20px',
            overflow: 'scroll',
            top: '70px',
            zIndex: '10000',
        }}
        >
            <div className="pt-[1px] w-full sticky top-0 ">
                <button type="button" className="btn btn-link clear-filter-button text-left " 
                onClick={() => handleClearAll()}
                >
                    Clear
                </button>
                
            </div>
            
            <div className="h-full">
                <div className='filter-item-area w-full p-[5px] flex flex-col items-center h-full'>
                    {displayedFilters.map((filter, index) => (
                        <FilterTag
                            key={index}
                            filter={filter}
                            index={index}
                            onIconClick={onIconClick}
                        />
                    ))}
                    
                    <div className='filter-instruction bg-white w-full h-auto mt-4' style={{ borderRadius: '7px', padding: '10px 20px'}}>
                        -lo ... : location<br/>
                        -t ... : time<br/>
                        -ocr ... : OCR text<br/>
                        -obj ... : Object Detection<br/>
                        -c : Turn on caption search<br/>
                    </div>
                </div>
            </div>
            
        </div>
    )
};
export default messagePopup;