import React, { useEffect, useRef, useState } from 'react'

import type { ImageRecord } from '../../types/image'
import RichImageGrid from './richImageGrid'

// data is search result from home page
const MetadataTab = () => {
  return (
    // <div className="flex flex-col w-full h-full">
    //   <RichImageGrid simData={data} />
    // </div>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
    >
      <RichImageGrid />
    </div>
  )
}

export default MetadataTab
