import React, { useEffect, useState } from 'react';
import { usePopUp } from '../../contexts/popUpContext';
import LoadingPopup from '../../components/Popup/loadingPopup';
import { SearchBox } from '../../components';
import { TrapoziedBgGray2, TrapoziedBgGray3, TrapoziedBgGrayLeft, SimilarityIcon, SimilarityIconActive, TimelineIcon, TimelineIconActive, LocationIcon, LocationIconActive } from '../../assets';
import TimelineTab from '../../containers/timeline/timelineTab';
import ImageGrid from '../../containers/similarity/image-grid';
import MapTab from '../../containers/location/mapTab';
import { SimialrityAdvancedGrid } from '../../containers';
import imageService from '../../services/imageService';
import Fuse from 'fuse.js';
import { ToastContainer, toast } from 'react-toastify';
import { useSelectedImages } from '../../contexts/selectedImageContext';
import 'react-toastify/dist/ReactToastify.css';

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



const Home = () => {
    
    // console.log('selectedFilters in home', selectedFilters);

    const [displayedFilters, setDisplayedFilters] = useState([]);
    const [query, setQuery] = useState('');
    const [model, setModel] = useState('clip');
    const [mode, setMode] = useState('smt-3m-dtin');
    const { loadingPopUp } = usePopUp();
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const [selectedModeIndex, setSelectedModeIndex] = useState(0);
    const handleTabClick = (index) => {
        setSelectedTabIndex(index);
    };
    const { displayedImages } = useSelectedImages();
    const [result, setResult] = useState([]);
    const [cacheResult, setCacheResult] = useState([]);
    const [searchTerms, setSearchTerms] = useState({});
    // const [fuzzyKeys, setFuzzyKeys] = useState(['activity', 'caption', 'date', 'location', 'time', 'ocr']);
    
    // Handle input changes for each key
    const handleFilterChange = (key, value) => {
        console.log('key', key, value);
        setSearchTerms((prevTerms) => ({
        ...prevTerms,
        [key]: value
        }));
    };

    useEffect(() => {
        if (Object.keys(searchTerms).length > 0 && cacheResult.length > 0) {
            let fuseResults = cacheResult;

            Object.keys(searchTerms).forEach(key => {
                if (searchTerms[key] !== '') {
                const fuse = new Fuse(fuseResults, { keys: [key], threshold: 0.3 });
                fuseResults = fuse.search(searchTerms[key]).map(result => {
                    return { ...result.item, score: result.score };
                });
                }
            });

            if (fuseResults.length === 0) {
                toast.error('No fuzzy results found'); 
            }

            setResult(fuseResults);
            console.log('filteredResults', fuseResults.length, fuseResults);
        }
    }, [searchTerms, cacheResult]);

    useEffect(() => {
        if (!displayedImages) {
            setDisplayedFilters([]);
            setQuery('');
            setResult([]);
            setCacheResult([]);
            setSearchTerms({});
        }
    }, [displayedImages]);

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
          console.log('query', query, model, mode);
          imageService.getImages(query, model, mode).then((response) => {
            console.log('response.data', query, model, mode, response.data.response[0]);
            setResult(response.data.response);
            setCacheResult(response.data.response);
          })
          .catch((error) => {
            console.log('error', error);
          });
        }
      }, [query, model, mode]);


    return (
        <div className='home-main-container flex flex-col h-[100%] w-[100%] min-h-[200px] min-w-[1500px] overflow-hidden relative' style={{ backgroundColor: "#F5F5F5"}}>
            <ToastContainer/>
            {loadingPopUp && <LoadingPopup />}
            <SearchBox
                displayedFilters={displayedFilters}
                setDisplayedFilters={setDisplayedFilters}
                setQuery={setQuery}
                setResult= {setResult}
                setModel={setModel}
                setMode={setMode}
                handleFilterChange={handleFilterChange}
                setCacheResult={setCacheResult}
            />
            <div
                className="flex w-full justify-start relative"
                style={{ marginBottom: "-1.5px", paddingTop: "15px", paddingLeft: "15px" }}
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

            <div className='bg-white w-full' style={{ height: "calc(100dvh - 120px)", borderRadius: "5px", padding: "0 0 0 10px" }}>
                {selectedTabIndex === 0 && (
                    <div className="flex flex-col w-full h-full">
                        <div className="flex justify-start items-center" style={{ paddingTop: "10px" }}>
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
                        <MapTab className="flex flex-row" style={{marginTop: "12px"}} data = {result} />
                    )
                }
            </div>

        </div>
    );
};

export default Home;