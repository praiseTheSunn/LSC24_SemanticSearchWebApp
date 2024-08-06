import React, { useEffect, useRef, useState } from 'react'

import RichImageGrid from './richImageGrid'

const MetadataTab = ({ data }) => {
  return (
    <div className="flex flex-col w-full h-full">
      <RichImageGrid simData={data} />
    </div>
  )
}

export default MetadataTab
