import './home.css';
import React, { useEffect, useState } from 'react';
import './home.css';
import { usePopUp } from '../../contexts/popUpContext';
import LoadingPopup from '../../components/Popup/loadingPopup';
import { SearchBox } from '../../components';
import { TrapoziedBgGray2, TrapoziedBgGray3, TrapoziedBgGrayLeft } from '../../assets';
import {Scrollbar} from '../../components';
import {ImageContainer} from '../../components';
import TimelineTab from '../../containers/timeline/timelineTab';

const LevelList = [
    { level: "Similarity", bg: TrapoziedBgGrayLeft },
    { level: "Timeline", bg: TrapoziedBgGray2 },
    { level: "Location", bg: TrapoziedBgGray3 },
];

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
                {selectedTabIndex === 1 && (
                    // <div className="flex flex-row" style={{marginTop: "10px"}}>
                    //     <Scrollbar/>
                    //     <ImageContainer/>
                    // </div>
                    <TimelineTab data={timelineData}/>
                    
                )}
            </div>
            
        </div>
    );
    };
    
    export default Home;