import { Box, Typography } from '@mui/material'
import type React from 'react'
import { FieldToDisplay } from '../config/fieldToDisplay'
import type { ImageRecord } from '../types/image'

interface ObjectDetailProps {
  viewImage: ImageRecord | undefined | null
  className?: string
}

const ObjectDetail: React.FC<ObjectDetailProps> = ({ viewImage }) => {
  if (!viewImage) return null
  return (
    <Box width="100%" height="100%" paddingLeft="8px" paddingRight="8px">
      {Object.keys(FieldToDisplay).map((fieldKey) => {
        const typedFieldKey = fieldKey as keyof typeof FieldToDisplay
        if (typedFieldKey in viewImage) {
          return (
            <Box key={fieldKey} sx={{ maxWidth: 450, flexWrap: 'wrap' }}>
              <Typography variant="caption">
                <span style={{ fontWeight: 'bold' }}>
                  {FieldToDisplay[typedFieldKey]}:
                </span>{' '}
                {(typedFieldKey as string) === 'img_link'
                  ? viewImage.img_link.split('/').pop()?.split('.')[0]
                  : String(viewImage[typedFieldKey as keyof ImageRecord])}
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
