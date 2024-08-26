import { Box, Typography } from '@mui/material';
import type React from "react";
import { ImageRecord } from '../types/image';

interface ObjectDetailProps {
  viewImage: ImageRecord | undefined | null;
  className?: string;
}

const ObjectDetail: React.FC<ObjectDetailProps> = ({ viewImage }) => {
  if (!viewImage) return null;
  return (
    <Box width="100%" height="100%" padding="8px">
      <Box>
        <Typography variant="caption" ><span style={{fontWeight: 'bold'}}>Activity:</span> {viewImage.activity} </Typography>
      </Box>
      <Box>
        <Typography variant="caption" ><span style={{fontWeight: 'bold'}}>Caption:</span> {viewImage.caption} </Typography>
      </Box>
      <Box>
        <Typography variant="caption" ><span style={{fontWeight: 'bold'}}>Date:</span> {viewImage.date} </Typography>
      </Box>
      <Box>
        <Typography variant="caption" ><span style={{fontWeight: 'bold'}}>Time:</span> {viewImage.time}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" ><span style={{fontWeight: 'bold'}}>Day of week:</span> {viewImage.day_of_week}</Typography>
        
      </Box>
      <Box>
        <Typography variant="caption" ><span style={{fontWeight: 'bold'}}>Location:</span> {viewImage.location_displayed}</Typography>
        
      </Box>
      <Box>
        <Typography variant="caption" ><span style={{fontWeight: 'bold'}}>Object tags:</span> {viewImage.object_tags}</Typography>
        
      </Box>
      <Box sx={{ maxWidth: 400, flexWrap: 'wrap' }}>
        <Typography variant="caption" ><span style={{fontWeight: 'bold'}}>OCR:</span> {viewImage.ocr}</Typography>
        
      </Box>
      <Box sx={{ maxWidth: 400, flexWrap: 'wrap' }}>
        <Typography variant="caption" ><span style={{fontWeight: 'bold'}}>Location:</span> {viewImage.location}</Typography>
        
      </Box>
      <Box>
        <Typography variant="caption" ><span style={{fontWeight: 'bold'}}>Filename:</span> {viewImage.img_link?.split('/').pop()?.split('.')[0]}</Typography>
        
      </Box>
    </Box>
  );
};

export default ObjectDetail;
