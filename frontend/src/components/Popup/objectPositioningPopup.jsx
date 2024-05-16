// Popup.jsx
import React from 'react';
import { DragIconList } from '../../data/icon';
import DragIcon from '../DragIcon';
import Whiteboard from '../WhiteBoard';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ObjectPositionPopup = () => {

    const handleDrop = (item) => {
        console.log(item);
    };

  return (
    <div className='absolute left-10 top-0  p-2 flex flex-row border border-solid border-black bg-white' 
    style={{ 
        zIndex: '1000',
        borderRadius: '6px',
        boxShadow: '2px 4px 4px 0px rgba(0, 0, 0, 0.5)',
    }}> 
        <DndProvider backend={HTML5Backend}>
            <div className='grid grid-cols-3 mr-2'>
                {
                    DragIconList.map((icon, index) => (
                        <DragIcon key={index} name={icon.name} source={icon.source} />
                    ))
                }
            </div>
            <Whiteboard onDrop={handleDrop} />
        </DndProvider>
    </div>
  );
};

export default ObjectPositionPopup;
