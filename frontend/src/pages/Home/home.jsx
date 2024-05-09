import './home.css';
import React, { useEffect, useState } from 'react';
import './home.css';
import { usePopUp } from '../../contexts/popUpContext';
import LoadingPopup from '../../components/Popup/loadingPopup';
import { SearchBox } from '../../components';
import { TrapoziedBgGray2, TrapoziedBgGray3, TrapoziedBgGrayLeft } from '../../assets';
import {Scrollbar} from '../../components';
import {ImageContainer} from '../../components';
// import TimelineTab from '../../components/timelineTab';
import ImageGrid from '../../containers/similarity/image-grid';
import ImageCluster from '../../containers/similarity/image-cluster';
import ImageLocation  from '../../containers/similarity/image-location';
import MapTab from '../../components/map_tab';

const LevelList = [
    { level: "Similarity", bg: TrapoziedBgGrayLeft },
    { level: "Timeline", bg: TrapoziedBgGray2 },
    { level: "Location", bg: TrapoziedBgGray3 },
];

const similarityData1 = [
    { date: '2019-01-01', time: '10:37:17', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp' },
    { date: '2019-01-01', time: '10:37:49', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103749_000.webp' },
    { date: '2019-01-01', time: '10:38:21', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103821_000.webp' },
    { date: '2019-01-01', time: '10:38:53', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103853_000.webp' },
    { date: '2019-01-01', time: '10:39:25', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103925_000.webp' },
    { date: '2019-01-01', time: '10:39:57', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_103957_000.webp' },
    { date: '2019-01-01', time: '10:40:29', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104029_000.webp' },
    { date: '2019-01-01', time: '10:41:01', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104101_000.webp' },
    { date: '2019-01-01', time: '10:41:33', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104133_000.webp' },
    { date: '2019-01-01', time: '10:42:05', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104205_000.webp' },
    { date: '2019-01-01', time: '10:42:37', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104237_000.webp' },
    { date: '2019-01-01', time: '10:43:09', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104309_000.webp' },
    { date: '2019-01-01', time: '10:43:41', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104341_000.webp' },
    { date: '2019-01-01', time: '10:44:13', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104413_000.webp' },
    { date: '2019-01-01', time: '10:44:45', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104445_000.webp' },
    { date: '2019-01-01', time: '10:45:17', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104517_000.webp' },
    { date: '2019-01-01', time: '10:45:49', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104549_000.webp' },
    { date: '2019-01-01', time: '10:46:21', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104621_000.webp' },
    { date: '2019-01-01', time: '10:46:53', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104653_000.webp' },
    { date: '2019-01-01', time: '10:47:25', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104725_000.webp' },
    { date: '2019-01-01', time: '10:47:57', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104757_000.webp' },
    { date: '2019-01-01', time: '10:48:29', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104829_000.webp' },
    { date: '2019-01-01', time: '10:49:01', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104901_000.webp' },
    { date: '2019-01-01', time: '10:49:33', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_104933_000.webp' },
    { date: '2019-01-01', time: '10:50:05', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105005_000.webp' },
    { date: '2019-01-01', time: '10:50:37', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105037_000.webp' },
    { date: '2019-01-01', time: '10:51:09', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105109_000.webp' },
    { date: '2019-01-01', time: '10:51:41', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105141_000.webp' },
    { date: '2019-01-01', time: '10:52:13', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105213_000.webp' },
    { date: '2019-01-01', time: '10:52:45', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105245_000.webp' },
    { date: '2019-01-01', time: '10:53:17', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105317_000.webp' },
    { date: '2019-01-01', time: '10:53:49', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105349_000.webp' },
    { date: '2019-01-01', time: '10:54:21', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105421_000.webp' },
    { date: '2019-01-01', time: '10:54:53', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105453_000.webp' },
    { date: '2019-01-01', time: '10:55:25', path: 'http://34.124.236.208/img_lsc/201901/01/20190101_105525_000.webp' }
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
// import LeftPanel from '../../components/leftPanel';
// import RightPanel from '../../components/rightPanel';
// import { SelectedImagesProvider } from '../../contexts/selectedImageContext';



const Home = ({selectedFilters}) => {
    
    console.log('selectedFilters in home', selectedFilters);

    const [displayedFilters, setDisplayedFilters] = useState([]);
    useEffect(()=>{
        console.log('displayedFilters HOME',displayedFilters);
    }, [displayedFilters]);
    const [query, setQuery] = useState('');
    const {loadingPopUp} = usePopUp();
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const handleTabClick = (index) => {
        setSelectedTabIndex(index);
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
                style={{ marginBottom: "-1.5px", marginTop: "15px", marginLeft: "15px"}}
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
                    marginLeft:`${index != 0 && "-20px"}`,
                    position: "relative",
                    height: "30px"
                    }}
                    onClick={() => handleTabClick(index)}
                >
                    {item.level}
                </button>
                ))}
            </div>
            <div className='bg-white w-full' style={{height: "575px", borderRadius:"5px", margin:"0 15px 0 15px"}}>
                {/* {selectedTabIndex === 0 && (<Thẻ A/>)} */}
                {selectedTabIndex === 0 && (
                    <div className="flex flex-row" style={{marginTop: "12px"}}>
                        <ImageGrid simData={similarityData1}/>
                        {/* <ImageLocation data = {timelineData}/>  */}
                    </div>
                )}

                {/* {selectedTabIndex === 1 && (
                    // <div className="flex flex-row" style={{marginTop: "10px"}}>
                    //     <Scrollbar/>
                    //     <ImageContainer/>
                    // </div>
                    // <TimelineTab data={timelineData}/>
                    
                )} */}
                {
                    selectedTabIndex === 2 && (
                        // <ImageCluster data={timelineData} />
                        <MapTab className="flex flex-row" style={{marginTop: "12px"}} query={query} filters={displayedFilters} />
                    )
                }

                
            </div>
            {/* <SelectedImagesProvider>
                <RightPanel 
                    query={query}
                    filters={displayedFilters}
                />
            </SelectedImagesProvider> */}

            
            
        </div>
    );
    };
    
export default Home;