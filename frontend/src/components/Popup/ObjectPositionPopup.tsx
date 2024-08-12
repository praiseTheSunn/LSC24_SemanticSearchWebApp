import React, { useState } from 'react';
import { Box, Button, Grid, IconButton } from '@mui/material';
// import { usePopUp } from '../../contexts/popUpContext';
import { DragIconList } from '../../data/icon';
// import { ObjectService } from '../../services/objectService';
import Whiteboard from '../WhiteBoard';

export interface DrawnItem {
  rect: Rect;
  icon: Icon;
}
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
}
export interface Icon {
  source: string;
  name: string;
}

const ObjectPositionPopup = ({ showPopup, setResult, setCacheResult } 
  : 
  {
    showPopup: boolean;
    setResult: (result: any) => void;
    setCacheResult: (result: any) => void;
  }) => {
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<DrawnItem[]>([]);
  // const { setLoadingPopUp } = usePopUp();
  const [isClear, setIsClear] = useState(false);

  const handleIconClick = (icon: Icon) => {
    setSelectedIcon(icon);
    console.log('Selected icon:', icon);
  };

  const handleDraw = (item: DrawnItem) => {
    console.log('Drawn item:', item);
    setSelectedIcon(null); // Clear selection after drawing
  };

  const handleClear = () => {
    setSelectedIcon(null);
    setIsClear(true);
  };

  const handleQuery = () => {
    const query = selectedObjects.map((obj: DrawnItem) => {
      const { rect: obj_coor, icon } = obj;
      return {
        object_name: icon.name.charAt(0).toUpperCase() + icon.name.slice(1),
        top_left_x: obj_coor.left,
        top_left_y: obj_coor.top,
        bottom_right_y: obj_coor.bottom,
        bottom_right_x: obj_coor.right,
      };
    });

    // setLoadingPopUp(true);
    // ObjectService.searchObjectPosition(query)
    //   .then((response: any) => {
    //     setResult(response.data);
    //     setCacheResult(response.data);
    //     setLoadingPopUp(false);
    //   })
    //   .catch((error: any) => {
    //     console.error('Error:', error);
    //     setLoadingPopUp(false);
    //   });
  };

  return (
    <Box
      id="objectPosPopup"
      className={`absolute left-10 top-0 flex flex-row bg-white ${showPopup ? 'p-2 border' : 'p-0'} transition-all duration-300`}
      sx={{
        zIndex: 10000,
        borderRadius: '6px',
        boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
        height: showPopup ? 'fit-content' : '0px',
        width: showPopup ? 'fit-content' : '0px',
        overflow: 'hidden',
        border: showPopup ? '1px solid black' : '0px',
      }}
    >
      <Grid container spacing={0.5} className="mr-2 min-w-[100px]">
        {DragIconList.map((icon: Icon) => (
          <Grid item xs={4} key={icon.name}>
            <IconButton
              onClick={() => handleIconClick(icon)}
              className="cursor-crosshair"
              sx={{ p: 0 }}
            >
              <img
                src={icon.source}
                alt={icon.name}
                className="w-[33px] h-[33px] object-contain"
              />
            </IconButton>
          </Grid>
        ))}
      </Grid>
      <Whiteboard
        setSelecObjects={setSelectedObjects}
        onDraw={handleDraw}
        selectedIcon={selectedIcon}
        onClear={isClear}
        setIsClear={setIsClear}
      />
      <Box className="flex flex-col ml-1">
        <Button
          variant="contained"
          color="error"
          onClick={handleClear}
          className="bg-red-500 text-white rounded-[3px] w-[50px] h-[30px] mb-2"
        >
          Clear
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleQuery}
          className="bg-blue-500 text-white rounded-[3px] w-[50px] h-[30px]"
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ObjectPositionPopup;
