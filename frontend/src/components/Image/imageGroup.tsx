import { Box, Dialog, Typography } from '@mui/material'
import React from 'react'
import { createPortal } from 'react-dom'
import type { ImageRecord } from '../../types/image'
import AnImage from '../AnImage'
import ViewMorePopup from '../Popup/viewMorePopup'

interface ImageGroupProps {
  images: ImageRecord[]
  title: string
  sortType?: number
}

const ImageGroup: React.FC<ImageGroupProps> = ({
  images,
  title,
  sortType = 0,
}) => {
  if (sortType === 1) {
    // sort images by time string
    images.sort((a, b) => a.time.localeCompare(b.time))
  } else {
    // sort images by score
    images.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  }

  const [showMore, setShowMore] = React.useState(false)

  return (
    <Box
      className="image-group"
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        px: 0.5,
        bgcolor: 'white',
        my: 1,
        boxShadow: '2px 4px 4px 0px rgba(0, 0, 0, 0.5)',
        maxHeight: '230px',
      }}
    >
      <Dialog open={showMore} onClose={() => setShowMore(false)}>
        <ViewMorePopup
          viewImages={images}
          title={title}
          setOpenViewMore={setShowMore}
        />
      </Dialog>

      <Box
        sx={{
          mb: '2px',
          width: '100%',
          height: '120px',
          objectFit: 'contain',
        }}
      >
        <AnImage data={images[0]} />
      </Box>

      <Box
        className="small-images"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          maxHeight: '70px',
          gap: 0.5,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {images[1]?.img_link && (
          <Box
            className="small-image"
            sx={{
              width: '50%',
              objectFit: 'contain',
            }}
            component="img"
            alt="small"
            src={images[1]?.img_link}
          />
        )}
        {images[2]?.img_link && (
          <Box
            className="small-image"
            sx={{
              width: '50%',
              objectFit: 'contain',
            }}
            component="img"
            alt="small"
            src={images[2]?.img_link}
          />
        )}
      </Box>

      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'center',
          height: '36px',
          maxWidth: '180px',
          cursor: 'pointer',
        }}
        onClick={() => setShowMore(!showMore)}
      >
        <Typography
          className="title"
          variant="subtitle2"
          sx={{
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={title}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  )
}

export default ImageGroup
