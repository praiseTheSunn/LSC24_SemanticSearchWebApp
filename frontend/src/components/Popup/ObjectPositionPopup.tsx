import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Grid, IconButton, TextField } from '@mui/material';
// import { usePopUp } from '../../contexts/popUpContext';
import { DragIconList } from '../../data/icon';
// import { ObjectService } from '../../services/objectService';
import Whiteboard from '../WhiteBoard';
import { appActions, useAppDispatch, useAppSelector, useLazyGetObjectsByPositionQuery } from '../../AppState';
import type { ImageRecord } from '../../types/image';
import type { ObjPosResponse } from '../../types/api';
import { ObjectV10ClassNames } from '../../assets/ObjClass/yolov10_class_names';
import { ObjectV8ClassNames } from '../../assets/ObjClass/yolov8_class_names';
import pico8Colors from '../../assets/ObjColors/pico8';

const ObjectClassNames = Array.from(new Set(ObjectV8ClassNames.concat(ObjectV10ClassNames)));

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
  color?: string;
}

const ObjectPositionPopup = () => {
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<DrawnItem[]>([]);
  const [isClear, setIsClear] = useState(false);
  const [trigger, result]  = useLazyGetObjectsByPositionQuery();
  const { data, error, isError, isFetching } = result;
  
  const dispatch = useAppDispatch();
  const setLoadingPopUp = useCallback((message: string) => {
    dispatch(appActions.setLoadingPopUp(message));
  }, [dispatch]);
  const setResult = useCallback((data: ImageRecord[]) => {
    dispatch(appActions.setAppImageData(data));
  }, [dispatch]);
  const setCacheResult = useCallback((data: ObjPosResponse[]) => {
    dispatch(appActions.setCacheData(data));
  }, [dispatch]);


  const handleIconClick = (icon: Icon) => {
    setSelectedIcon(icon);
    console.log('Selected icon:', icon);
  };

  const handleColorClick = (color: string) => {
    if (selectedIcon) {
      setSelectedIcon({ ...selectedIcon, color });
      return;
    }
    setSelectedIcon({ source: 'none', name: 'none', color });
  }

  const handleDraw = (item: DrawnItem) => {
    console.log('Drawn item:', item);
    setSelectedIcon(null); // Clear selection after drawing
  };

  const handleClear = () => {
    setSelectedIcon(null);
    setIsClear(true);
  };

  const handleQuery = () => {
    // const query = selectedObjects.map((obj: DrawnItem) => {
    //   const { rect: obj_coor, icon } = obj;
    //   return {
    //     object_name: icon.name.charAt(0).toUpperCase() + icon.name.slice(1),
    //     top_left_x: obj_coor.left,
    //     top_left_y: obj_coor.top,
    //     bottom_right_y: obj_coor.bottom,
    //     bottom_right_x: obj_coor.right,
    //   };
    // });
    // trigger(query);
  };

  useEffect(() => {
    if (isFetching) {
      setLoadingPopUp('Fetching object result...');
    }
    
    if (isError) {
      console.error('Error:', error);
      setLoadingPopUp('Error: fetching object result');
    }
  
    if (data && !isFetching) {
      setLoadingPopUp('');
      setResult(data);
      setCacheResult(data);
    }
  }, [isFetching, isError, error, data]);

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
        zIndex: 1003,
        borderRadius: '6px',
        boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
        height: 'fit-content',
        width: 'fit-content',
        overflow: 'hidden',
        border: '1px solid black',
        padding: '8px'
      }}
    >
      <Box  marginRight='8px'>
        <Grid style={{
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
        <Autocomplete  
          autoComplete={true}
          autoHighlight={true}
          clearOnBlur={true}
          options={ObjectClassNames} 
          slotProps={{
            popper: { style: { zIndex: 10005,  } },
            paper: { elevation: 6}
          }}
          sx={{ width: '100%'}}
          onChange={(e: any, newValue: string | null) => {
            const name = newValue ? newValue : '';
            const source = 'none';
            console.log('Selected object:', name);
            setSelectedIcon({ source, name});
          }}
          renderInput={(params) => <TextField {...params} size='small' fullWidth={true}  margin="dense" label="Objects" />} 
        />
      </Box>
      <Box>
        <Whiteboard
          setSelecObjects={setSelectedObjects}
          onDraw={handleDraw}
          selectedIcon={selectedIcon}
          onClear={isClear}
          setIsClear={setIsClear}
        />
        <Grid style={{
          minWidth: '100px',
          maxWidth: '100%',
          marginTop: '8px',
        }} columns={8} container>
          {Object.keys(pico8Colors).map((colorKeys) => (
            <Grid title={colorKeys} item xs={1} key={colorKeys as string} sx={{ boxSizing: 'border-box', width: '33px', height: '33px', cursor: 'pointer', borderWidth: '1px', borderColor: 'black' }}>
              <Box
                sx={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: pico8Colors[colorKeys as keyof typeof pico8Colors] }}
                title={colorKeys}
                onClick={() => handleColorClick(pico8Colors[colorKeys as keyof typeof pico8Colors])}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
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
