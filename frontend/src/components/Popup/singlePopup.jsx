import './singlePopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'
import ImageInList from '../Image/imageInList'
import { useRef, useEffect, useState, useCallback  } from 'react'
import imageService from '../../services/imageService'
import { useSelectedImages } from '../../contexts/selectedImageContext'
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const SinglePopup = ({viewImage, onClose}) => {
    const [neighborsData, setNeighborsData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);
    const viewImageRef = useRef(null);
    const gridRef = useRef(null);
    const previousScrollTop = useRef(0);

    const fetchNeighbors = useCallback(async (imageId) => {
        setIsLoading(true);
        try {
            const response = await imageService.getSimilarImages2Image(imageId);
            const newNeighbors = response.data.response;
            setNeighborsData(newNeighbors);
            return newNeighbors;
            // setNeighborsData(prev => {
            //     if (position === 'start') {
            //         return [...newNeighbors, ...prev];
            //     } else {
            //         return [...prev, ...newNeighbors];
            //     }
            // });
        } catch (error) {
            console.error('Error fetching Similar Images:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const imageList = [viewImage];
        fetchNeighbors(imageList, "stfm");
    }, [viewImage, fetchNeighbors]);

    useEffect(() => {
        if (viewImageRef.current && !hasScrolled) {
            viewImageRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            setHasScrolled(true);
        }
    }, [neighborsData, viewImage, hasScrolled]);

    const handleScroll = ({ scrollTop }) => {
        const scrollDirection = scrollTop < previousScrollTop.current ? 'backward' : 'forward';
        previousScrollTop.current = scrollTop;

        if (scrollDirection === 'backward' && scrollTop === 0 && !isLoading) {
            const firstImage = neighborsData[0]?.img_link;
            const firstImageList = firstImage ? [firstImage] : [];
            
            console.log('firstImage', firstImage);
            console.log('firstImageList', firstImageList);

            if (firstImageList) {
                fetchNeighbors(firstImageList, "stfm");
            }
        }

        // if (scrollDirection === 'forward' && !isLoading) {
        //     const grid = gridRef.current;
        //     if (grid) {
        //         const { scrollHeight, clientHeight } = grid._outerRef;
        //         if (scrollTop + clientHeight >= scrollHeight) {
        //             const lastImage = neighborsData[neighborsData.length - 1]?.img_link;
        //             if (lastImage) {
        //                 fetchNeighbors(lastImage, );
        //             }
        //         }
        //     }
        // }
    };

    const Cell = ({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        const data = neighborsData[index];
        if (!data) return null;

        const { img_link, date, time } = data;
        const formattedTime = `${date} ${time}`;
        const isHighlighted = img_link === viewImage;

        return (
            <div
                className={`image-wrapper-neighbor ${isHighlighted ? 'highlight' : ''}`}
                style={{ ...style, padding: '10px', boxSizing: 'border-box' }}
                ref={isHighlighted ? viewImageRef : null}
            >
                <div className='overlay-neighbor'>{formattedTime}</div>
                <img src={img_link} alt={`Image ${index}`} className='image-item-neighbor' />
            </div>
        );
    };

    const columnCount = 6; // Number of columns in the grid
    const itemSize = 180; // Size of each cell in the grid

    return (
        <div className='neighbor-popup-container'>
            <div className='popup-content-background row'>
                <div className='neighbor-image-container col h-full w-full'>
                    <h1>Single</h1>
                    <br />
                    {neighborsData.length > 0 ? (
                        <AutoSizer>
                            {({ height, width }) => {
                                const columnWidth = width / columnCount;
                                const rowHeight = 130; // Making rows square by setting row height equal to column width
                                const rowCount = Math.ceil(neighborsData.length / columnCount);

                                return (
                                    <Grid
                                        columnCount={columnCount}
                                        columnWidth={columnWidth}
                                        height={height}
                                        rowCount={rowCount}
                                        rowHeight={rowHeight}
                                        width={width}
                                        // onScroll={({ scrollTop }) => handleScroll({ scrollTop })}
                                        ref={gridRef}
                                    >
                                        {Cell}
                                    </Grid>
                                )
                            }}
                        </AutoSizer>
                    ) : (
                        <div>Loading neighbors...</div>
                    )}
                </div>

                <div className='close-button-container'>
                    <img src={closeIcon} className='close-popup-button' onClick={() => onClose(true)} />
                </div>
            </div>
        </div>
    );
};

export default SinglePopup;
