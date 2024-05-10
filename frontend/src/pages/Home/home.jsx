import './home.css';
import React, { useEffect, useState } from 'react';
import './home.css';
import { usePopUp } from '../../contexts/popUpContext';
import LoadingPopup from '../../components/Popup/loadingPopup';
import { SearchBox } from '../../components';
import { TrapoziedBgGray2, TrapoziedBgGray3, TrapoziedBgGrayLeft, SimilarityIcon, SimilarityIconActive, TimelineIcon, TimelineIconActive, LocationIcon, LocationIconActive } from '../../assets';
import {Scrollbar} from '../../components';
import {ImageContainer} from '../../components';
// import TimelineTab from '../../components/timelineTab';
import ImageGrid from '../../containers/similarity/image-grid';
import ImageCluster from '../../containers/similarity/image-cluster';
import ImageLocation  from '../../containers/similarity/image-location';
import ImageGridTime from '../../containers/similarity/image-time';

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

const similarityData1 = [
    { date: '2019-03-13', time: '01:44:25', path: 'http://34.124.236.208/img_lsc/201903/13/20190313_014425_000.webp', score: 0.9  , location : 'Location 1'},
    { date: '2019-01-01', time: '10:37:17', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp', score: 0.89 , location : 'Location 2'},
    { date: '2020-02-11', time: '08:24:28', path: 'http://34.124.236.208/img_lsc/202002/11/20200211_082428_000.webp', score: 0.88 , location : 'Location 2'},
    { date: '2019-03-13', time: '01:46:01', path: 'http://34.124.236.208/img_lsc/201903/13/20190313_014601_000.webp', score: 0.87 , location : 'Location 3'},
    { date: '2019-11-02', time: '07:29:53', path: 'http://34.124.236.208/img_lsc/201911/02/20191102_072953_000.webp', score: 0.86 , location : 'Location 2'},
    { date: '2019-09-14', time: '06:21:25', path: 'http://34.124.236.208/img_lsc/201909/14/20190914_062125_000.webp', score: 0.85 , location : 'Location 3'},
    { date: '2019-01-01', time: '10:37:49', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103749_000.webp', score: 0.84 , location : 'Location 1'},
    { date: '2019-03-13', time: '01:43:53', path: 'http://34.124.236.208/img_lsc/201903/13/20190313_014353_000.webp', score: 0.83 , location : 'Location 2'},
    { date: '2019-09-14', time: '06:21:08', path: 'http://34.124.236.208/img_lsc/201909/14/20190914_062108_000.webp', score: 0.82 , location : 'Location 2'},
    { date: '2019-01-01', time: '10:38:21', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103821_000.webp', score: 0.81 , location : 'Location 3'},
    { date: '2019-03-13', time: '01:44:57', path: 'http://34.124.236.208/img_lsc/201903/13/20190313_014457_000.webp', score: 0.80 , location : 'Location 3'},
    { date: '2019-11-02', time: '07:31:02', path: 'http://34.124.236.208/img_lsc/201911/02/20191102_073102_000.webp', score: 0.79 , location : 'Location 1'},
    { date: '2019-01-01', time: '10:38:53', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103853_000.webp', score: 0.78 , location : 'Location 2'},
    { date: '2020-02-11', time: '08:27:08', path: 'http://34.124.236.208/img_lsc/202002/11/20200211_082708_000.webp', score: 0.77 , location : 'Location 4'},
    { date: '2019-01-01', time: '10:39:25', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103925_000.webp', score: 0.76 , location : 'Location 2'},
    { date: '2020-02-11', time: '08:25:00', path: 'http://34.124.236.208/img_lsc/202002/11/20200211_082500_000.webp', score: 0.75 , location : 'Location 5'},
    { date: '2019-03-13', time: '01:45:29', path: 'http://34.124.236.208/img_lsc/201903/13/20190313_014529_000.webp', score: 0.74 , location : 'Location 3'},
    { date: '2019-03-13', time: '01:46:33', path: 'http://34.124.236.208/img_lsc/201903/13/20190313_014633_000.webp', score: 0.73 , location : 'Location 1'},
    { date: '2020-02-11', time: '08:25:32', path: 'http://34.124.236.208/img_lsc/202002/11/20200211_082532_000.webp', score: 0.72 , location : 'Location 4'},
    { date: '2020-02-11', time: '08:26:04', path: 'http://34.124.236.208/img_lsc/202002/11/20200211_082604_000.webp', score: 0.71 , location : 'Location 1'},
    { date: '2020-02-11', time: '08:26:36', path: 'http://34.124.236.208/img_lsc/202002/11/20200211_082636_000.webp', score: 0.70 , location : 'Location 5'},
    { date: '2020-02-11', time: '08:27:40', path: 'http://34.124.236.208/img_lsc/202002/11/20200211_082740_000.webp', score: 0.69 , location : 'Location 2'},
    { date: '2019-09-14', time: '06:20:34', path: 'http://34.124.236.208/img_lsc/201909/14/20190914_062034_000.webp', score: 0.68 , location : 'Location 1'},
    { date: '2019-09-14', time: '06:20:51', path: 'http://34.124.236.208/img_lsc/201909/14/20190914_062051_000.webp', score: 0.67 , location : 'Location 4'},
    { date: '2019-09-14', time: '06:21:42', path: 'http://34.124.236.208/img_lsc/201909/14/20190914_062142_000.webp', score: 0.66 , location : 'Location 5'},
    { date: '2019-09-14', time: '06:21:59', path: 'http://34.124.236.208/img_lsc/201909/14/20190914_062159_000.webp', score: 0.65 , location : 'Location 3'},
    { date: '2019-09-14', time: '06:22:16', path: 'http://34.124.236.208/img_lsc/201909/14/20190914_062216_000.webp', score: 0.64 , location : 'Location 4'},
    { date: '2019-11-02', time: '07:30:10', path: 'http://34.124.236.208/img_lsc/201911/02/20191102_073010_000.webp', score: 0.63 , location : 'Location 3'},
    { date: '2019-11-02', time: '07:30:27', path: 'http://34.124.236.208/img_lsc/201911/02/20191102_073027_000.webp', score: 0.62 , location : 'Location 2'},
    { date: '2019-11-02', time: '07:30:44', path: 'http://34.124.236.208/img_lsc/201911/02/20191102_073044_000.webp', score: 0.61 , location : 'Location 3'},
    { date: '2019-11-02', time: '07:31:19', path: 'http://34.124.236.208/img_lsc/201911/02/20191102_073119_000.webp', score: 0.60 , location : 'Location 4'},
    { date: '2019-11-02', time: '07:31:36', path: 'http://34.124.236.208/img_lsc/201911/02/20191102_073136_000.webp', score: 0.59 , location : 'Location 5'},
    { date: '2019-11-02', time: '07:31:53', path: 'http://34.124.236.208/img_lsc/201911/02/20191102_073153_000.webp', score: 0.58 , location : 'Location 1'},
    { date: '2019-11-02', time: '07:32:10', path: 'http://34.124.236.208/img_lsc/201911/02/20191102_073210_000.webp', score: 0.57 , location : 'Location 2'},
    { date: '2019-11-02', time: '07:32:27', path: 'http://34.124.236.208/img_lsc/201911/02/20191102_073227_000.webp', score: 0.56 , location : 'Location 3'},
]

const timelineData = [
    { date: "2023-01-01",score: 1, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 1", activity: "Breakfast" },
    { date: "2023-03-15",score: 2, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 2", activity: "Drive to work"  },
    { date: "2023-01-01",score: 3, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 1", activity: "Lecturing"  },
    { date: "2022-01-01",score: 1, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 2", activity: "Breakfast"  },
    { date: "2023-01-15",score: 3, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 3", activity: "Breakfast"  },
    { date: "2012-06-20",score: 3, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 1", activity: "Breakfast"  },
    { date: "2022-01-01",score: 2, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 2", activity: "Drive to work"  },
    { date: "2023-12-15",score: 1, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 3", activity: "Breakfast"  },
    { date: "2023-01-01",score: 2, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 4", activity: "Breakfast"  },
    { date: "2023-01-01",score: 3, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 1", activity: "Drive to work"  },
    { date: "2023-01-01",score: 3, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 2", activity: "Drive to work"  },
    { date: "2023-01-01",score: 2, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 2", activity: "Lecturing"  },
    { date: "2023-01-01",score: 1, img_link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU", location: "Location 2", activity: "Lecturing"  },
];

const Home = ({selectedFilters}) => {
    
    console.log('selectedFilters in home', selectedFilters);

    const [displayedFilters, setDisplayedFilters] = useState([]);
    useEffect(() => {
        console.log('displayedFilters HOME', displayedFilters);
    }, [displayedFilters]);
    const [query, setQuery] = useState('');
    const { loadingPopUp } = usePopUp();
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const handleTabClick = (index) => {
        setSelectedTabIndex(index);
    };

    const [selectedModeIndex, setSelectedModeIndex] = useState(0);
    const handleModeClick = (index) => {
        setSelectedModeIndex(index);
    };

    return (
        <div className='home-main-container'>
            {loadingPopUp && <LoadingPopup />}
            <SearchBox
                displayedFilters={displayedFilters}
                setDisplayedFilters={setDisplayedFilters}
                setQuery={setQuery}
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
                            marginLeft: `${index != 0 && "-20px"}`,
                            position: "relative",
                            height: "30px"
                        }}
                        onClick={() => handleTabClick(index)}
                    >
                        {item.level}
                    </button>
                ))}
            </div>

            <div className='bg-white w-full' style={{ height: "575px", borderRadius: "5px", margin: "0 15px 0 15px" }}>
                {/* {selectedTabIndex === 0 && (<Thẻ A/>)} */}
                {selectedTabIndex === 0 && (
                    <div className="flex flex-col" style={{ marginTop: "12px" }}>
                        {/* <ImageGrid simData={similarityData1}/> */}
                        {/* <div
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
                                        marginLeft: `${index != 0 && "-20px"}`,
                                        position: "relative",
                                        height: "30px"
                                    }}
                                    onClick={() => handleTabClick(index)}
                                >
                                    {item.level}
                                </button>
                            ))}
                        </div> */}
                        <div className="flex justify-center items-center" style={{ marginTop: "12px" }}>
                            {Mode.map((item, index) => (
                                <button
                                    key={index}
                                    className={`font-base font-bold py-1.5 text-gray border-white ${index === selectedModeIndex ? "active" : ""
                                        }`}
                                    style={{
                                        width: "50px",
                                        height: "50px",
                                        borderRadius: "50%", // Hình tròn
                                        border: "1px solid #ccc", // Viền
                                        margin: "0 10px", // Khoảng cách giữa các nú
                                        backgroundImage: `url(${selectedModeIndex === index ? item.bgat : item.bg})`,
                                        backgroundSize: "cover",
                                    }}
                                    onClick={() => handleModeClick(index)}
                                />

                            ))}
                        </div>
                        {selectedModeIndex === 0 && (
                            <div className="flex flex-row" style={{ marginTop: "12px" }}>
                                <ImageGrid simData={similarityData1} />
                            </div>

                        )}
                        {selectedModeIndex === 1 && (
                            <div className="flex flex-row" style={{ marginTop: "12px" }}>
                                <ImageGridTime data = {similarityData1}/> 
                            </div>
                        )}
                        {selectedModeIndex === 2 && (
                            <div className="flex flex-row" style={{ marginTop: "12px" }}>
                                <ImageLocation data = {similarityData1}/> 
                            </div>
                        )}                        
                    </div>
                )}

                {selectedTabIndex === 1 && (
                    <div className="flex flex-row" style={{ marginTop: "12px" }}>
                        {/* <ImageGrid simData={similarityData1} /> */}
                        <ImageLocation data = {timelineData}/> 
                    </div>

                )}
            </div>

        </div>
    );
};

export default Home;