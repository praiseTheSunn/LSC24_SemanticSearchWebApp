import { Box, Typography } from '@mui/material'
import { useCallback, useEffect } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import { AnImage, ObjectDetail } from '..'
import { isNil } from 'lodash'
import {
    appActions,
    useAppDispatch,
    useAppSelector,
    useGetSimilarsQuery,
} from '../../AppState'
import type { ImageRecord } from '../../types/image'
// biome-ignore lint/style/useImportType: <explanation>
import React from 'react'

interface PreviewImageProps {
    onClose: (shouldClose: boolean) => void
    data: ImageRecord | null | undefined
}

const ImagePreviewPopup: React.FC<PreviewImageProps> = ({
    onClose,
}) => {
    // if (isNil(data)) return null
    // const src = data?.img_link ? data.img_link : undefined
    // const date = data?.date ? data.date : null
    // const time = data?.time ? data.time : null
    // const formattedTime: string = `${date ? date : ''}  ${time ? time : ''}`
    const viewImage = useAppSelector(
        (state) => state.app.imagePreviewData?.img_link,
      )
    
    return (
        // create a box to display the image in the middle of the screen
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
            }}
        />
    )
}

export default ImagePreviewPopup
