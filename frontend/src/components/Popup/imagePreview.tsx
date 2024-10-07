import { Box } from '@mui/material'
import { useAppSelector } from '../../AppState'

const ImagePreviewPopup = () => {
  const viewImage = useAppSelector(
    (state) => state.app.imagePreviewData?.img_link,
  )
  return (
    <Box
      component="img"
      src={viewImage}
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
        pointerEvents: 'none',
        maxHeight: '90dvh',
        maxWidth: '90dvw',
      }}
    />
  )
}

export default ImagePreviewPopup
