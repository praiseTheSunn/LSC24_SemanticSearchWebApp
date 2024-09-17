import { Box, Typography } from '@mui/material'
import type React from 'react'
import { AIC2024_fieldToDisplay } from '../config/fieldToDisplay'
import type { ImageRecord } from '../types/image'

interface ObjectDetailProps {
  viewImage: ImageRecord | undefined | null
  className?: string
}

const ObjectDetail: React.FC<ObjectDetailProps> = ({ viewImage }) => {
  if (!viewImage) return null
  return (
    <Box width="100%" height="100%" paddingLeft="8px" paddingRight="8px">
      {Object.keys(AIC2024_fieldToDisplay).map((fieldKey) => {
        const typedFieldKey = fieldKey as keyof typeof AIC2024_fieldToDisplay
        if (typedFieldKey in viewImage) {
          return (
            <Box key={fieldKey} sx={{ maxWidth: 400, flexWrap: 'wrap' }}>
              <Typography variant="caption">
                <span style={{ fontWeight: 'bold' }}>
                  {AIC2024_fieldToDisplay[typedFieldKey]}:
                </span>{' '}
                {typedFieldKey === 'img_link'
                  ? viewImage.img_link.split('/').pop()?.split('.')[0]
                  : viewImage[typedFieldKey as keyof ImageRecord]}
              </Typography>
            </Box>
          )
        }
        return null
      })}
    </Box>
  )
}

export default ObjectDetail
