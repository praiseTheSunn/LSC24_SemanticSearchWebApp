import React from 'react'
import './imageSingle.css'
import AnImage from './AnImage'
import type { ImageRecord } from '../types/image'

interface ImageSingleProps {
  image: ImageRecord;
}

// instead of ImageGroup, now create a new component called ImageSingle
const ImageSingle: React.FC<ImageSingleProps> = ({ image }) => {
  return (
    <div
      className="relative image-group p-0.5 flex-col flex bg-white my-1"
      style={{
        boxShadow: '2px 4px 4px 0px rgba(0, 0, 0, 0.5)',
        maxHeight: '230px',
      }}
    >
      <div
        className="mb-[2px]"
        style={{
          width: '100%',
          height: '120px',
          objectFit: 'contain',
          minWidth: '160px',
        }}
      >
        <AnImage data={image} />
      </div>
    </div>
  )
}

export default ImageSingle
