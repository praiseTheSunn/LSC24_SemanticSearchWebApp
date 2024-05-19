// Popup.jsx
import React, { useState } from 'react';
import { DragIconList } from '../../data/icon';
import DragIcon from '../DragIcon';
import Whiteboard from '../WhiteBoard';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
const ObjectPositionPopup = () => {
    const [selectedIcons, setSelectedIcons] = useState([]);
    const [selectedIcon, setSelectedIcon] = useState(null);
  
    const handleIconClick = (icon) => {
      setSelectedIcon(icon);
      setSelectedIcons([...selectedIcons, icon]);
      console.log('Selected icon:', icon);
    };
  
    const handleDraw = (item) => {
      console.log('Drawn item:', item);
      setSelectedIcon(null); // Clear selection after drawing
    };
  
    return (
      <div
        className='absolute left-10 top-0 p-2 flex flex-row border border-solid border-black bg-white w-fit'
        style={{
          zIndex: '1000',
          borderRadius: '6px',
          boxShadow: '2px 4px 4px 0px rgba(0, 0, 0, 0.5)',
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
        <Whiteboard onDraw={handleDraw} selectedIcon={selectedIcon} />
      </div>
    );
  };
  
  export default ObjectPositionPopup;