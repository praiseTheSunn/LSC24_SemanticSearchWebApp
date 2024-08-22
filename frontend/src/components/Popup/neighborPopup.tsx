import { Box } from '@mui/material';
import { AnImage } from '..';
import { useEffect, useState, useCallback, useRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid } from 'react-window';
import closeIcon from '../../assets/close.png';
import { useLazyGetNeighborsQuery } from '../../AppState';

// Define the types for props
interface NeighborPopupProps {
  viewImage: string | null;
  onClose: (shouldClose: boolean) => void;
  cellHeight?: number;
  cell?: React.FC<any>;
}

// Define the type for the neighbor data
interface NeighborData {
  img_link: string;
  [key: string]: any; // Add other properties as needed
}

const NeighborPopup: React.FC<NeighborPopupProps> = ({ viewImage, onClose, cellHeight, cell }) => {
  const [triggerGetNeighbors, { data, isError, isFetching }] = useLazyGetNeighborsQuery();
  const [neighborsData, setNeighborsData] = useState<NeighborData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const previousScrollTop = useRef(0);
  const hasScrolled = useRef(false);
  const viewImageRef = useRef<HTMLDivElement | null>(null);

  const fetchNeighbors = useCallback(async (imageId: string, position: 'start' | 'end') => {
    setIsLoading(true);
    try {
      const response = await triggerGetNeighbors(imageId).unwrap();
      const newNeighbors: NeighborData[] = response;
      // console.log('newNeighbors:', newNeighbors);
      const middleIndex = Math.floor(newNeighbors.length / 2);
      const frontNeighbors = newNeighbors.slice(0, middleIndex);
      const backNeighbors = newNeighbors.slice(middleIndex);

      setNeighborsData((prev) => {
        if (imageId === viewImage) return newNeighbors;
        if (position === 'start') {
          return [...frontNeighbors, ...prev];
        }
        return [...prev, ...backNeighbors];
      });
    } catch (error) {
      console.error('Error fetching neighbors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [viewImage, triggerGetNeighbors]);

  useEffect(() => {
    if (viewImage) {
      fetchNeighbors(viewImage, 'end');
    }
  }, [viewImage, fetchNeighbors]);

  useEffect(() => {
    if (viewImageRef.current && !hasScrolled.current) {
      viewImageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      hasScrolled.current = true;
    }
  }, [neighborsData, viewImage]);

  const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
    const scrollDirection = scrollTop < previousScrollTop.current ? 'backward' : 'forward';
    previousScrollTop.current = scrollTop;

    if (scrollDirection === 'backward' && scrollTop === 0 && !isLoading) {
      const firstImage = neighborsData[0]?.img_link;
      if (firstImage) {
        fetchNeighbors(firstImage, 'start');
      }
    }

    if (scrollDirection === 'forward' && !isLoading) {
      const lastImage = neighborsData[neighborsData.length - 1]?.img_link;
      if (lastImage) {
        fetchNeighbors(lastImage, 'end');
      }
    }
  };

  const columnCount: number = 8;
  const itemSize: number = 180;
  const columnGap = 20;
  cellHeight = cellHeight ? cellHeight : 105;



  const Cell: React.FC<{ columnIndex: number; rowIndex: number; style: React.CSSProperties }> = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= neighborsData.length) return null;
  
    const data = neighborsData[index];
    const { img_link } = data;
    const isHighlighted = img_link === viewImage;
  

  
    return (
      <div
        style={{
          ...style,
          border: isHighlighted ? '2px solid #FFD700' : 'none',
          boxShadow: isHighlighted ? '0 0 10px #FFD700' : 'none',
        }}
      >
        {/* <Box
          sx={{
            width: '100%', // Chiếm toàn bộ chiều rộng của cha
            height: '100%', // Chiếm toàn bộ chiều cao, điều chỉnh theo columnGap
            position: 'relative',
            overflow: 'hidden',
            padding: columnGap,
          }}
        > */}
          <AnImage key={index} data={data} index={index} />
        {/* </Box> */}
      </div>
    );
  };

  const closePopup = () => {
    onClose(true);
  };



  return (
    <div
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        height: '100%', 
        width: '100%', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        zIndex: 10000 
      }}
    >
      <div
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          width: '95%', 
          height: '90%', 
          backgroundColor: 'white', 
          borderRadius: '20px', 
          position: 'relative', 
          top: '10px' 
        }}
      >
        <div
          style={{ flexDirection: 'column', flex: 1 }}
          ref={viewImageRef}
        >
          <h1 
          style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', textAlign: 'center' }}>
            Neighbor Images
          </h1>
          <div 
          style={{ 
            display: 'flex', 
            height: '80%',
          }}
            >
            <Box sx={{ width: '95vw' }}>
              <AutoSizer>
                {({ height, width }) => {
                  const columnWidth = width / columnCount - 2;
                  const rowHeight = cellHeight + 2;
                  const rowCount = Math.ceil(neighborsData.length / columnCount);

                  console.log('height:', height, 'width:', width, 'columnWidth:', columnWidth, 'rowHeight:', rowHeight, 'rowCount:', rowCount);
                  return (
                    <Grid
                      columnCount={columnCount}
                      columnWidth={columnWidth}
                      height={height}
                      rowCount={rowCount}
                      rowHeight={rowHeight}
                      width={width}
                      overscanRowCount={5}
                      onScroll={({ scrollTop }) => handleScroll({ scrollTop })}
                      style={{ gap: `${columnGap}px` }}
                    >
                      {Cell}
                    </Grid>
                  );
                }}
              </AutoSizer>
            </Box>
          </div>
        </div>
        <div 
        style = {{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '30px',
          width: '30px',
          padding: '5px',
          backgroundColor: 'white',
          position: 'absolute',
          top: '-1.7%',
          right: '-0.7%',
          borderRadius: '20px',
          cursor: 'pointer',
          zIndex: 10000,
        }}
        >
          <img
            src={closeIcon}
            // className="close-popup-button"
            style={{  cursor: 'pointer',
              position: 'relative',
              height: '100%',
              width: '100%',
              zIndex: 1000,}}
            alt="close button"
            onClick={closePopup}
          />
        </div>
      </div>
    </div>
  );
};

export default NeighborPopup;