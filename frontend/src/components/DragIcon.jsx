// Icon.jsx
import React from 'react'
import { useDrag } from 'react-dnd'

const DragIcon = ({ name, source }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'icon',
    item: { name, source },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  })

  return (
    <img
      src={source}
      alt={name}
      className="size-[33px] min-w-[33px] min-h-[33px] object-contain"
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
    />
  )
}

export default DragIcon
