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

// create a list of image data (10 images needed)

const imageList = [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU",
    "https://s1.ticketm.net/dam/a/a67/86eb84c0-ad6a-43c6-a55f-ff5d109c9a67_RETINA_PORTRAIT_3_2.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQANCqdY31uljrV73FJrq9RYPdHUbqqou5lXfTGDLH-dQ&s",
    "https://assets.teenvogue.com/photos/641b2a23912ddccbabf80f80/16:9/w_2560%2Cc_limit/GettyImages-1474459622.jpg",
    "https://m.media-amazon.com/images/I/71LVEINqZaL._UF1000,1000_QL80_.jpg",
    "https://e3.365dm.com/23/08/1600x900/skynews-taylor-swift-santa-clara_6237922.jpg?20230802101540",
    "https://ca-times.brightspotcdn.com/dims4/default/b598fb5/2147483647/strip/true/crop/4000x2667+0+0/resize/1200x800!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2Fe0%2Fde%2F9e80ee1545d9bc32a14a304bede6%2Ftaylor-swift-francia-07405.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYFAXqcwl-tVJwjkdF3G3Fwry4ukTFtTNBcec4q2Hyfw&s",
    "https://i.abcnewsfe.com/a/06f5ba1e-de2d-4b1a-b3df-4a1649608ac2/katy-perry-taylor-swift-01-ht-jt-240223_1708718542679_hpEmbed_4x5.jpg",
    "https://d.newsweek.com/en/full/2345169/taylor-swift-2024-grammy-awards.jpg?w=1600&h=1600&q=88&f=b1b0f37269d3db205aa0aef9dec181b6"
]



const timelineData = [
    { date: "2023-01-01", score: 7, img_link: imageList[0], location: "Location 1", activity: "Dancing" },
    { date: "2023-03-15", score: 9, img_link: imageList[1], location: "Location 2", activity: "Drive to work"  },
    { date: "2023-01-01", score: 3, img_link: imageList[4], location: "Location 1", activity: "Lecturing"  },
    { date: "2022-01-01", score: 1, img_link: imageList[8], location: "Location 2", activity: "Breakfast"  },
    { date: "2023-01-15", score: 3, img_link: imageList[2], location: "Location 3", activity: "Breakfast"  },
    { date: "2012-06-20", score: 3, img_link: imageList[3], location: "Location 1", activity: "Dancing"  },
    { date: "2022-01-01", score: 8, img_link: imageList[4], location: "Location 2", activity: "Drive to work"  },
    { date: "2023-12-15", score: 4, img_link: imageList[5], location: "Location 3", activity: "Breakfast"  },
    { date: "2023-01-01", score: 2, img_link: imageList[2], location: "Location 1", activity: "Breakfast"  },
    { date: "2023-01-01", score: 5, img_link: imageList[3], location: "Location 1", activity: "Drive to work"  },
    { date: "2023-01-01", score: 3, img_link: imageList[9], location: "Location 2", activity: "Drive to work"  },
    { date: "2023-01-01", score: 2, img_link: imageList[2], location: "Location 3", activity: "Lecturing"  },
    { date: "2023-01-02", score: 0, img_link: imageList[9], location: "Location 3", activity: "Lecturing"  },
    { date: "2012-06-20", score: 4, img_link: imageList[5], location: "Location 1", activity: "Dancing"  },
    { date: "2022-01-01", score: 8, img_link: imageList[0], location: "Location 2", activity: "Breakfast"  },
    { date: "2023-12-15", score: 4, img_link: imageList[1], location: "Location 2", activity: "Breakfast"  },
    { date: "2023-01-01", score: 2, img_link: imageList[5], location: "Location 4", activity: "Drive to work"  },
    { date: "2023-03-15", score: 8, img_link: imageList[2], location: "Location 4", activity: "Lecturing"  },
    { date: "2023-03-15", score: 5, img_link: imageList[3], location: "Location 4", activity: "Drive to work"  },
    { date: "2023-01-02", score: 3, img_link: imageList[7], location: "Location 1", activity: "Drive to work"  },
    { date: "2022-01-02", score: 1, img_link: imageList[8], location: "Location 2", activity: "Breakfast"  },
    { date: "2022-01-02", score: 2, img_link: imageList[0], location: "Location 3", activity: "Lecturing"  },
    { date: "2022-01-02", score: 2, img_link: imageList[3], location: "Location 3", activity: "Drive to work"  },
    { date: "2023-01-15", score: 3, img_link: imageList[2], location: "Location 4", activity: "Breakfast"  },
    { date: "2023-12-15", score: 8, img_link: imageList[4], location: "Location 2", activity: "Drive to work"  },
    { date: "2023-12-15", score: 4, img_link: imageList[7], location: "Location 4", activity: "Breakfast"  },
    { date: "2023-01-02", score: 2, img_link: imageList[5], location: "Location 4", activity: "Lecturing"  },
    { date: "2023-01-01", score: 5, img_link: imageList[5], location: "Location 1", activity: "Drive to work"  },
    { date: "2023-01-01", score: 3, img_link: imageList[6], location: "Location 2", activity: "Drive to work"  },
    { date: "2023-01-02", score: 2, img_link: imageList[8], location: "Location 1", activity: "Lecturing"  },
    { date: "2023-01-02", score: 0, img_link: imageList[9], location: "Location 2", activity: "Lecturing"  },
    { date: "2012-06-20", score: 3, img_link: imageList[3], location: "Location 1", activity: "Breakfast"  },
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