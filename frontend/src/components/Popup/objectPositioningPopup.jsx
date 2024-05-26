// Popup.jsx
import React, { useEffect, useRef, useState } from 'react';
import { DragIconList } from '../../data/icon';
import Whiteboard from '../WhiteBoard';
import { ObjectService } from '../../services/objectService';
const ObjectPositionPopup = ({showPopup, setResult, setCacheResult}) => {
    const [selectedIcon, setSelectedIcon] = useState(null);
    const [selectedObjects, setSelectedObjects] = useState([]);
  
    const handleIconClick = (icon) => {
      setSelectedIcon(icon);
      console.log('Selected icon:', icon);
    };
  
    const handleDraw = (item) => {
      console.log('Drawn item:', item);
      setSelectedIcon(null); // Clear selection after drawing
    };

    const [isClear, setIsClear] = useState(false);

    const handleClear = (e) => {
      setSelectedIcon(null);
      setIsClear(true);
    };

    const handleQuery = () => {
      const query = [];
      for (const obj of selectedObjects) {
        console.log('Object:', obj);
        const obj_coor = obj.rect;
        const new_element = {
          "object_name": obj.icon.name.charAt(0).toUpperCase() + obj.icon.name.slice(1),
          "top_left_x": obj_coor.left,
          "top_left_y": obj_coor.top,
          "bottom_right_y": obj_coor.bottom,
          "bottom_right_x": obj_coor.right,
        }
        query.push(new_element);
      }

      ObjectService.searchObjectPosition(query)
      .then((response) => {
        console.log('Response:', response);
        setResult(response.data);
        setCacheResult(response.data);
      })
      .catch((error) => {
        console.log('Error:', error);
      });
    }
  
    return (
      <div
        id='objectPosPopup'
        className='objectPosPopup absolute left-10 top-0 flex flex-row bg-white w-fit'
        style={{
          zIndex: '10000',
          borderRadius: '6px',
          boxShadow: '2px 4px 4px 0px rgba(0, 0, 0, 0.5)',
          height: showPopup ? 'fit-content' : '0px',
          width: showPopup ? 'fit-content' : '0px',
          overflow: 'hidden',
          padding: showPopup ? '8px' : '0px',
          border: showPopup ? '1px solid black' : '0px',
        }}
      >
        <div className='grid grid-cols-3 mr-2 min-w-[100px] gap-x-0.5 gap-y-0.5'>
          {DragIconList.map((icon, index) => (
            <img
              key={index}
              src={icon.source}
              alt={icon.name}
              className='size-[33px] min-w-[33px] min-h-[33px] object-contain'
              onClick={() => handleIconClick(icon)}
              style={{ cursor: 'crosshair' }}
            />
          ))}
        </div>
        <Whiteboard setSelecObjects={setSelectedObjects} onDraw={handleDraw} selectedIcon={selectedIcon} onClear={isClear} setIsClear={setIsClear} />
        <div className='flex flex-col'>
          <button className='bg-red text-white rounded-[3px] w-[50px] h-[30px] ml-[3px]' onClick={(e) => handleClear(e)} >Clear</button>
          <button className='bg-blue text-white rounded-[3px] mt-2 w-[50px] h-[30px] ml-[3px]' onClick={(e) => handleQuery()} >Send</button>
        </div>
      </div>
    );
  };
  
  export default ObjectPositionPopup;