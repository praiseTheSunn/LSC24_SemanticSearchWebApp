// Popup.jsx
import React, { useEffect, useRef, useState } from 'react';
import { DragIconList } from '../../data/icon';
import Whiteboard from '../WhiteBoard';
const ObjectPositionPopup = ({showPopup}) => {
    const [selectedIcon, setSelectedIcon] = useState(null);
  
    const handleIconClick = (icon) => {
      setSelectedIcon(icon);
      console.log('Selected icon:', icon);
    };
  
    const handleDraw = (item) => {
      console.log('Drawn item:', item);
      setSelectedIcon(null); // Clear selection after drawing
    };

    const [isClear, setIsClear] = useState(false);

    const handleClear = () => {
      setSelectedIcon(null);
      setIsClear(true);
    };
  
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
        <Whiteboard onDraw={handleDraw} selectedIcon={selectedIcon} onClear={isClear} setIsClear={setIsClear} />
        <button className='bg-red text-white rounded-[3px] w-[50px] h-[30px] ml-[3px]' onClick={() => handleClear()} >Clear</button>
      </div>
    );
  };
  
  export default ObjectPositionPopup;