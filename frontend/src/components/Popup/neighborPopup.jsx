import closeIcon from '../../assets/close.png'
import { useRef, useEffect, useState, useCallback  } from 'react'
import imageService from '../../services/imageService'
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AnImage } from '../../components';

const NeighborPopup = ({ viewImage, onClose }) => {
    const [neighborsData, setNeighborsData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);
    const viewImageRef = useRef(null);
    const gridRef = useRef(null);
    const previousScrollTop = useRef(0);

    const fetchNeighbors = useCallback(async (imageId, pageNum, position) => {
        setIsLoading(true);
        try {
            const response = await imageService.getNeighbors(imageId, pageNum);
            const newNeighbors = response.data.response;
            console.log(newNeighbors);
            const middleIndex = Math.floor(newNeighbors.length / 2);
            const frontNeighbors = newNeighbors.slice(0, middleIndex);
            const backNeighbors = newNeighbors.slice(middleIndex);

            setNeighborsData(prev => {
                if (imageId === viewImage) return newNeighbors;
                else if (position === 'start') {
                    return [...frontNeighbors, ...prev];
                } else {
                    return [...prev, ...backNeighbors];
                }
            });
        } catch (error) {
            console.error('Error fetching neighbors:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNeighbors(viewImage, 1, 'end');
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
        console.log("scrollTop: ", scrollTop)
        // if (scrollDirection === 'backward' && scrollTop <= 300 && !isLoading) {
        if (scrollDirection === 'backward' && scrollTop === 0 && !isLoading) {
            const firstImage = neighborsData[0]?.img_link;
            console.log('firstImage', firstImage);
            if (firstImage) {
                fetchNeighbors(firstImage, 1, 'start');
            }
        }

        if (scrollDirection === 'forward' && !isLoading) {
            const grid = gridRef.current;
            if (grid) {
                const { scrollHeight, clientHeight } = grid._outerRef;
                if (scrollTop + clientHeight >= scrollHeight) {
                    const lastImage = neighborsData[neighborsData.length - 1]?.img_link;
                    console.log('lastImage', lastImage);
                    if (lastImage) {
                        fetchNeighbors(lastImage, 1, 'end');
                    }
                }
            }
        }
    };

    const Cell = ({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        const data = neighborsData[index];
        if (!data) return null;

        const { img_link } = data;
        const isHighlighted = img_link === viewImage;
        return (
            <div style={style} className={`image-wrapper-neighbor ${isHighlighted ? 'highlight' : ''}`}
                ref={isHighlighted ? viewImageRef : null}
            >
                <div className="h-full overflow-hidden p-0.5" >
                    <AnImage 
                        key={index} 
                        index={index} 
                        data={data}
                    />
                </div>
            </div>
        );
    };

    const columnCount = 8; // Number of columns in the grid
    const itemSize = 180; // Size of each cell in the grid

    return (
        <div className='fixed top-0 left-0 flex flex-col justify-center items-center bg-black bg-opacity-50 h-full w-full' style={{zIndex:"1000000"}}>
            <div className='relative flex flex-row items-center w-[90%] h-[90%] bg-white rounded-2xl'>
                <div className='max-h-[90%] h-full w-full overflow-y-hidden flex-shrink-0 flex-grow-0 flex-auto'>
                    <h1 className='font-bold text-center max-h-[600px]'>Neighbors</h1>
                    <div className='w-full h-full'>
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
                                            onScroll={({ scrollTop }) => handleScroll({ scrollTop })}
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
                </div>

                <div className='absolute top-[-1.7%] right-[-0.7%] w-8 h-8 bg-white rounded-full flex justify-center items-center cursor-pointer p-[5px]' onClick={() => onClose(true)}>
                    <img src={closeIcon} className='close-popup-button' onClick={() => onClose(true)} />
                </div>
            </div>
        </div>
    );
};

export default NeighborPopup;