// Whiteboard.jsx
import React from 'react';
import { useDrop } from 'react-dnd';

const Whiteboard = ({ onDrop }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'icon',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      onDrop({
        x: offset.x,
        y: offset.y,
        name: item.name,
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      style={{
        width: '280px !important' ,
        height: '200px !important',
        border: '1px solid black',
        position: 'relative',
      }}
    >
      {isOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
};

export default Whiteboard;
