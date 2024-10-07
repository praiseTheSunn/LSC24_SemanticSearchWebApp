import { Box, Paper, Typography } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../AppState'
import AnImage from '../AnImage'

export const DislikePreviewPopup = () => {
  const dislikeImages = useAppSelector((state) => state.app.dislikedImages)
  const dispatch = useAppDispatch()

  return (
    // display all csvImages
    <Paper
      elevation={4}
      sx={{
        maxHeight: '800px',
        width: '600px',
        position: 'relative',
        // right: '300px',
        // top: '300px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        zIndex: 20000,
        borderRadius: 2,

        overflow: 'hidden',
        // border: '1px solid black',
        // paddingTop: '8px',
        // paddingBottom: '8px',
        // paddingLeft: '8px',
        // paddingRight: '8px',
        alignItems: 'center',
        overflowY: 'scroll',

        p: 2,
      }}
    >
      {dislikeImages.length === 0 && <Typography>No images to preview</Typography>}
      {dislikeImages.map((image) => {
        return (
          <Box
            sx={{
              width: '100%',
              marginBottom: '8px',
            }}
            key={image.img_link}
          >
            {/* <Typography>{image.video_id}, {image.frame_id}</Typography> */}
            <AnImage data={image} />
          </Box>
        )
      })}
    </Paper>
  )
}
