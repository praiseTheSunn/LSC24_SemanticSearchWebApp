import React, { useEffect, useRef, useState } from 'react'

import RichImageGrid from './richImageGrid'

// data is search result from home page
const MetadataTab = ({ data }: { data: JSON[] }) => {
  return (
    <div className="flex flex-col w-full h-full">
      <RichImageGrid simData={data} />
    </div>
  )
}

export default MetadataTab
