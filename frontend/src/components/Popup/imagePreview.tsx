import { Box } from '@mui/material'
import { useAppSelector } from '../../AppState'

const ImagePreviewPopup = () => {
  const viewImage = useAppSelector(
    (state) => state.app.imagePreviewData?.img_link,
  )
  return (
    <Box
      className="video-popup"
      sx={{
        zIndex: '99999',
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        backgroundColor: 'rgba(110, 110, 110, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <Box
        component="img"
        src={viewImage}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          maxHeight: '90dvh',
          maxWidth: '90dvw',
        }}
      />
    </Box>
  )
}

export default ImagePreviewPopup
