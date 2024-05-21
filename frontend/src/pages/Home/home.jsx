import React, { useEffect, useState } from 'react';
import { usePopUp } from '../../contexts/popUpContext';
import LoadingPopup from '../../components/Popup/loadingPopup';
import { ObjectPositionPopup, SearchBox } from '../../components';
import { TrapoziedBgGray2, TrapoziedBgGray3, TrapoziedBgGrayLeft, SimilarityIcon, SimilarityIconActive, TimelineIcon, TimelineIconActive, LocationIcon, LocationIconActive, ObjectPosIcon } from '../../assets';
import TimelineTab from '../../containers/timeline/timelineTab';
import ImageGrid from '../../containers/similarity/image-grid';
import MapTab from '../../containers/location/mapTab';
import { SimialrityAdvancedGrid } from '../../containers';
import imageService from '../../services/imageService';

const LevelList = [
    { level: "Similarity", bg: TrapoziedBgGrayLeft },
    { level: "Timeline", bg: TrapoziedBgGray2 },
    { level: "Location", bg: TrapoziedBgGray3 },
];

const Mode = [
    { mode: "Similarity", bg: SimilarityIcon, bgat: SimilarityIconActive },
    { mode: "Timeline", bg: TimelineIcon, bgat: TimelineIconActive },
    { mode: "Location", bg: LocationIcon, bgat: LocationIconActive },
];

// create a list of image data (10 images needed)



const Home = ({selectedFilters}) => {
    
    console.log('selectedFilters in home', selectedFilters);

    const [displayedFilters, setDisplayedFilters] = useState([]);
    useEffect(() => {
        console.log('displayedFilters HOME', displayedFilters);
    }, [displayedFilters]);
    const [query, setQuery] = useState('');
    const [model, setModel] = useState('clip');
    const [mode, setMode] = useState('smt-3m-dtin');
    const { loadingPopUp } = usePopUp();
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const handleTabClick = (index) => {
        setSelectedTabIndex(index);
    };

    const [selectedModeIndex, setSelectedModeIndex] = useState(0);
    const [result, setResult] = useState([]);

    const ImageGridMemo = React.memo(ImageGrid);

    window.document.addEventListener('keydown', function(event) {
        if (event.ctrlKey) {
            switch (event.key) {
                case 's':
                case 'S':
                    setSelectedTabIndex(0);
                    event.preventDefault(); // Prevent default action (if needed)
                    break;
                case 'd':
                case 'D':
                    setSelectedTabIndex(1);
                    event.preventDefault(); // Prevent default action (if needed)
                    break;
                case 'f':
                case 'F':
                    setSelectedTabIndex(2);
                    event.preventDefault(); // Prevent default action (if needed)
                    break;
            }
        }
    });

    useEffect(() => {
        if (query !== '') {
            console.log('query', query);
            imageService.getImages(query, model, mode).then((response) => {
                console.log('response.data',query, model, mode, response.data.response[0]);
                setResult(response.data.response);
                
            })
            .catch((error) => {
                console.log('error', error);
            });
        }
    }, [query]);


    return (
        <div className='home-main-container flex flex-col h-[100%] w-[100%] min-h-[200px] min-w-[1500px] overflow-hidden ' style={{ backgroundColor: "#F5F5F5"}}>
            {loadingPopUp && <LoadingPopup />}
            <SearchBox
                displayedFilters={displayedFilters}
                setDisplayedFilters={setDisplayedFilters}
                setQuery={setQuery}
                setResult= {setResult}
                setModel={setModel}
                setMode={setMode}
            />

            <div
                className="flex w-full justify-start relative"
                style={{ marginBottom: "-1.5px", marginTop: "15px", marginLeft: "15px" }}
            >
                {LevelList.map((item, index) => (
                <button
                    key={index}
                    className={`font-base font-bold py-1.5 grid-tab text-gray border-white ${index === selectedTabIndex ? "active" : ""}`}
                    style={{
                    width: "197px",
                    backgroundImage: `url(${item.bg})`,
                    zIndex: 999 - index * 10,
                    border: "none",
                    backgroundColor: "transparent",
                    marginLeft:`${index !== 0 && "-20px"}`,
                    position: "relative",
                    height: "30px"
                    }}
                    onClick={() => handleTabClick(index)}
                >
                    {item.level}
                </button>
                ))}
            </div>

            <div className='bg-white w-full' style={{ height: "575px", borderRadius: "5px", padding: "0 0 0 10px" }}>
                {selectedTabIndex === 0 && (
                    <div className="flex flex-col w-full h-full">
                        <div className="flex justify-start items-center" style={{ marginTop: "10px" }}>
                            {Mode.map((item, index) => (
                                <button
                                    key={index}
                                    className={`font-base font-bold text-gray border-white ${index === selectedModeIndex ? "active" : ""
                                        }`}
                                    style={{
                                        width: "30px",
                                        height: "30px",
                                        borderRadius: "50%", // Hình tròn
                                        border: "1px solid #ccc", // Viền
                                        margin: "0 10px", // Khoảng cách giữa các nú
                                        backgroundImage: `url(${selectedModeIndex === index ? item.bgat : item.bg})`,
                                        backgroundSize: "cover",
                                    }}
                                    onClick={() => setSelectedModeIndex(index)}
                                />

                            ))}
                        </div>
                        {selectedModeIndex === 0 && (
                            <div className="flex flex-row w-full h-full overflow-y-auto" style={{ marginTop: "2px" }}>
                                <ImageGridMemo simData={result} />
                            </div>

                        )}
                        {selectedModeIndex !== 0 && (
                            <div className="flex flex-row w-full h-full overflow-y-auto" style={{ marginTop: "2px" }}>
                                <SimialrityAdvancedGrid tabindex={selectedModeIndex} data = {result}/> 
                            </div>
                        )}                        
                    </div>
                )}

                {
                    selectedTabIndex === 1 && (
                        <TimelineTab data={result}/>
                        
                    )
                }
                {
                    selectedTabIndex === 2 && (
                        // <ImageCluster data={timelineData} />
                        <MapTab className="flex flex-row" style={{marginTop: "12px"}} query={query} filters={displayedFilters} />
                    )
                }
            </div>

        </div>
    );
};

export default Home;