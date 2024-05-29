import React, { useEffect, useState, useContext } from 'react';
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
import MetadataTab from '../../containers/metadata/metadataTab';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'

// will delete 
import evalService from '../../services/evalService';
import { EvaluationContext } from '../../contexts/EvaluationContext';

const LevelList = [
    { level: "Similarity", bg: TrapoziedBgGrayLeft },
    { level: "Timeline", bg: TrapoziedBgGray2 },
    { level: "Location", bg: TrapoziedBgGray3 },
    { level: "VQA", bg: TrapoziedBgGray3 },
];

const Mode = [
    { mode: "Similarity", bg: SimilarityIcon, bgat: SimilarityIconActive },
    { mode: "Timeline", bg: TimelineIcon, bgat: TimelineIconActive },
    { mode: "Location", bg: LocationIcon, bgat: LocationIconActive },
];

// create a list of image data (10 images needed)



const Home = () => {
    const { evaluationId } = useContext(EvaluationContext);
    // console.log('selectedFilters in home', selectedFilters);

    const [displayedFilters, setDisplayedFilters] = useState([]);
    const [query, setQuery] = useState('');
    const [model, setModel] = useState('clip');
    const [mode, setMode] = useState('smt-3m-dtin');
    const { loadingPopUp, setLoadingPopUp } = usePopUp();
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const [selectedModeIndex, setSelectedModeIndex] = useState(0);
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);
    const [windowHeigt, setWindowHeight] = useState(window.innerHeight);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const handleTabClick = (index) => {
        setSelectedTabIndex(index);
    };
    const { displayedImages } = useSelectedImages();
    const [result, setResult] = useState([]);
    const [cacheResult, setCacheResult] = useState([]);
    const [searchTerms, setSearchTerms] = useState([]);
    const [submitText, setSubmitText] = useState('');
    // const [fuzzyKeys, setFuzzyKeys] = useState(['activity', 'caption', 'date', 'location', 'time', 'ocr']);
    
    // Handle input changes for each key
    const handleFilterChange = (key, value) => {
        console.log('key', key, value);
        setSearchTerms((prevTerms) => {
            const updatedTerms = [...prevTerms];
            updatedTerms.push({ category: key, value });
            return updatedTerms;
        });
    };

    useEffect(() => {
        console.log('searchTerms', searchTerms);
        if (searchTerms.length > 0 && cacheResult.length > 0) {
            let fuseResults = cacheResult;

            searchTerms.forEach((term) => {
                if (term.value !== '') {
                    const fuse = new Fuse(fuseResults, { keys: [term.category], threshold: 0.3 });
                    fuseResults = fuse.search(term.value).map((result) => {
                        return { ...result.item, score: result.score };
                    });
                }
            });

            if (fuseResults.length === 0) {
                toast.error('No fuzzy results found');
            }

            setResult(fuseResults);
            console.log('filteredResults', fuseResults.length, fuseResults);
        } else if (searchTerms.length === 0) {
            setResult(cacheResult);
        }
    }, [searchTerms, cacheResult]);

    useEffect(() => {
        if (!displayedImages) {
            setDisplayedFilters([]);
            setQuery('');
            setResult([]);
            setCacheResult([]);
            setSearchTerms([]);
        }
    }, [displayedImages]);

    const submit = (src) => {
        var sesId = localStorage.getItem('session');
        var evalId = evaluationId;

        // Parse the filename from the file path
        let filename = src.split('/').pop();
        // Remove the file extension
        filename = src.split('/').pop().split('.')[0];
        console.log('filename', filename);

        evalService.submitFile(evalId, sesId, filename).then((response) => {
            console.log('response', response);
            toast.success(`Submit: ${filename}`);
        })
        .catch((error) => {
            console.log('error', error);
            toast.error(`ERROR: ${filename}`);
        });

        
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Control') {
                setIsCtrlPressed(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Control') {
                setIsCtrlPressed(false);
            }
        };

        const handleClick = (e) => {
            if (isCtrlPressed && e.target.classList.contains('submissible')) {
                const src = e.target.getAttribute('src');
                submit(src);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('click', handleClick);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('click', handleClick);
        };
    }, [isCtrlPressed]);

    const ImageGridMemo = React.memo(ImageGrid);

    window.document.addEventListener('keydown', function(event) {
        if (event.altKey) {
            switch (event.key) {
                case '1':
                    setSelectedTabIndex(0);
                    event.preventDefault(); // Prevent default action (if needed)
                    break;
                case '2':
                    setSelectedTabIndex(1);
                    event.preventDefault(); // Prevent default action (if needed)
                    break;
                case '3':
                    setSelectedTabIndex(2);
                    event.preventDefault(); // Prevent default action (if needed)
                    break;
                case '4':
                    setSelectedTabIndex(3);
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
            setLoadingPopUp(false);
          })
          .catch((error) => {
            console.log('error', error);
          });
        }
    }, [query, model, mode]);

    useEffect(() => {
        if (submitText !== '') {
            evalService.submitText(evaluationId, localStorage.getItem('session'), submitText)
            .then((response) => {
                toast.success('Text submitted');
                setSubmitText('');
                console.log('response', response);
            })
            .catch((error) => {
                toast.error('Error submitting text');
                console.log('error', error);
            });
        }
    }, [submitText]);


    return (
        <div className='home-main-container flex flex-col h-[100%] w-[100%] min-h-[200px] overflow-hidden relative' style={{ backgroundColor: "#F5F5F5"}}>
            <ToastContainer/>
            {loadingPopUp && <LoadingPopup />}
            <Tooltip id='tooltip_img'  
                style={{zIndex: "9999999", position:"fixed", top: "0", right:"0"}}
                positionStrategy='fixed'
                // anchorSelect='.tooltip-display'
                place='bottom'
                // position={{x: 0, y: 0}}
                position={{x: windowWidth, y: 0}}
                render={(content) => {
                    // console.log('content', content.content);
                    const tooltipData = content.content ? JSON.parse(content.content) : null;
                    // console.log('tooltipData', tooltipData);
                    return(
                        (tooltipData && (
                            <div className="w-full h-full p-2" >
                                <p><strong>Activity:</strong> {tooltipData.activity}</p>
                                {/* <p><strong>Activity ID:</strong> {tooltipData.activity_id}</p> */}
                                <p><strong>Caption:</strong> {tooltipData.caption}</p>
                                <p><strong>Date:</strong> {tooltipData.date}</p>
                                <p><strong>Time:</strong> {tooltipData.time}</p>
                                <p><strong>Day of Week:</strong> {tooltipData.day_of_week}</p>
                                {/* <p><strong>Event ID:</strong> {tooltipData.event_id}</p> */}
                                <p><strong>Location:</strong> {tooltipData.location_displayed}</p>
                                {/* <p><strong>Location ID:</strong> {tooltipData.location_id}</p> */}
                                {/* <p><strong>Latitude:</strong> {tooltipData.new_lat}</p>
                                <p><strong>Longitude:</strong> {tooltipData.new_lng}</p> */}
                                <p style={{wordBreak: "break-word", maxWidth:"500px"}}><strong>Object Tags:</strong> {tooltipData.object_tags}</p>
                                <p style={{wordBreak: "break-word", maxWidth:"500px"}}><strong>OCR:</strong> {tooltipData.ocr}</p>
                                <p><strong>Score:</strong> {tooltipData.score}</p>
                            </div>
                         ))
                    )
                }}
            />
            <SearchBox
                displayedFilters={displayedFilters}
                setDisplayedFilters={setDisplayedFilters}
                setQuery={setQuery}
                setResult= {setResult}
                setModel={setModel}
                setMode={setMode}
                handleFilterChange={handleFilterChange}
                setSearchTerms={setSearchTerms}
                setCacheResult={setCacheResult}
                setSubmitText={setSubmitText}
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
                            <div className="flex flex-row h-full overflow-y-auto" style={{ marginTop: "2px", width: "calc(100dvw - 10px)" }}>
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
                {
                    selectedTabIndex === 3 && (
                        <MetadataTab data={result} />
                    )
                }
            </div>

        </div>
    );
};

export default Home;