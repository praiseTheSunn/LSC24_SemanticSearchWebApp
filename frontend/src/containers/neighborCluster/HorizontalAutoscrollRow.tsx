import { Box } from '@mui/material'
import { useEffect, useRef } from 'react'
import { AnImage } from '../../components'
import type { ImageRecord } from '../../types/image'

export const NeighborRow: React.FC<{
  imageData: ImageRecord
  style: React.CSSProperties
  config: any
}> = ({ imageData, style, config }) => {
  const neighbors = imageData?.neighbors ?? []
  const displayedImages = [
    { ...imageData, isOriginal: true },
    ...neighbors,
  ].sort((a, b) => {
    return (
      Number.parseInt(a.frame_id as string) -
      Number.parseInt(b.frame_id as string)
    )
  })

  const originalImageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (originalImageRef.current) {
      originalImageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [])

  return (
    <Box sx={style} display="flex" flexDirection="column" alignItems="center">
      <Box
        display="flex"
        flexDirection="row"
        position="relative"
        overflow="auto"
        width="100%"
      >
        {displayedImages.map((image, index) => (
          <Box
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={index}
            ref={
              (image as ImageRecord & { isOriginal: boolean }).isOriginal
                ? originalImageRef
                : null
            }
            sx={{
              height: `calc(${style.height}px - 2 * ${config.gridRowGap}) + 8px`, // +8px of scrollbar
              minWidth: `${config.NeighborTabCellMinWidth}px`,
              position: 'relative',
              overflow: 'hidden',
              marginRight: config.gridRowGap,
              padding: config.gridRowGap,
              border: (image as ImageRecord & { isOriginal: boolean })
                .isOriginal
                ? '2px solid #ff1500'
                : 'none',
              boxShadow: (image as ImageRecord & { isOriginal: boolean })
                .isOriginal
                ? '0 0 10px #ff1500'
                : 'none',
            }}
          >
            <AnImage data={image} />
          </Box>
        ))}
      </Box>
      <Box
        border="0.5px solid gray"
        height="0px"
        width="100%"
        marginTop="5px"
        marginBottom="5px"
      />
    </Box>
  )
}
