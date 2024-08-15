import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, IconButton } from '@mui/material';
// import { usePopUp } from '../../contexts/popUpContext';
import { DragIconList } from '../../data/icon';
// import { ObjectService } from '../../services/objectService';
import Whiteboard from '../WhiteBoard';
import { appActions, useAppDispatch, useLazyGetObjectsByPositionQuery } from '../../AppState';
import { set } from 'lodash';

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
  const [trigger, result]  = useLazyGetObjectsByPositionQuery();
  const { data, error, isError, isFetching } = result;
  const dispatch = useAppDispatch();
  const setLoadingPopUp = (loading: boolean) => {
    dispatch(appActions.setLoadingPopUp(loading));
  }

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

  useEffect(() => {
    if (data){
      setLoadingPopUp(false);
      setResult(data);
      setCacheResult(data);
    }
  }, [data]); 

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
    trigger(query);
  };

  if (isFetching) {
    setLoadingPopUp(true);
    return (
      <div>
        Fetching object result
      </div>
    )
  }
  
  if (isError) {
    console.error('Error:', error);
    return (
      <div>
        Error fetching object result
      </div>
    )
  }

  return (
    <Box
      id="objectPosPopup"
      sx={{
        position: 'absolute',
        left: '10px',
        top: '0',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'white',
        zIndex: 10000,
        borderRadius: '6px',
        boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
        height: showPopup ? 'fit-content' : '0px',
        width: showPopup ? 'fit-content' : '0px',
        overflow: 'hidden',
        border: showPopup ? '1px solid black' : '0px',
        padding: showPopup ? '8px' : '0px'
      }}
    >
      <Grid style={{
        marginRight: '8px',
        minWidth: '100px',
        maxWidth: '120px',
      }} columns={3} container>
        {DragIconList.map((icon: Icon) => (
          <Grid item xs={1} key={icon.name} sx={{ width: '33px', height: '33px', cursor: 'pointer' }}>
            <Box
              component="img"
              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              src={icon.source}
              alt={icon.name}
              title={icon.name}
              onClick={() => handleIconClick(icon)}
            />
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
      <Box sx={{ display: "flex", flexDirection: "column", marginLeft: 1 }} className="flex flex-col ml-1">
        <Button
          variant="contained"
          color="error"
          onClick={handleClear}
          style={{color: 'white', width: '50px', height: '30px', marginBottom: '2px' }}
        >
          Clear
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleQuery}
          style={{color: 'white', width: '50px', height: '30px' }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ObjectPositionPopup;
