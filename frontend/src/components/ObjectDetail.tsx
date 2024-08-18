import { Box, Typography } from '@mui/material';
import type React from "react";

interface ObjectDetailProps {
  viewImage: {
    activity: string;
    caption: string;
    date: string;
    time: string;
    day_of_week: string;
    location_displayed: string;
    object_tags: string;
    ocr: string;
    location: string;
    img_link: string;
  };
  className?: string;
}

const ObjectDetail: React.FC<ObjectDetailProps> = ({ viewImage, className }) => {
  return (
    <Box className={className}>
      <Box>
        <Typography variant="caption" >Activity: {viewImage.activity} </Typography>
      </Box>
      <Box>
        <Typography variant="caption" >Caption: {viewImage.caption} </Typography>
      </Box>
      <Box>
        <Typography variant="caption" >Date: {viewImage.date} </Typography>
      </Box>
      <Box>
        <Typography variant="caption" >Time: {viewImage.time}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" >Day of week: {viewImage.day_of_week}</Typography>
        
      </Box>
      <Box>
        <Typography variant="caption" >Location: {viewImage.location_displayed}</Typography>
        
      </Box>
      <Box>
        <Typography variant="caption" >Object tags: {viewImage.object_tags}</Typography>
        
      </Box>
      <Box sx={{ maxWidth: 400, flexWrap: 'wrap' }}>
        <Typography variant="caption" >OCR: {viewImage.ocr}</Typography>
        
      </Box>
      <Box sx={{ maxWidth: 400, flexWrap: 'wrap' }}>
        <Typography variant="caption" >Location: {viewImage.location}</Typography>
        
      </Box>
      <Box>
        <Typography variant="caption" >Filename: {viewImage.img_link?.split('/').pop()?.split('.')[0]}</Typography>
        
      </Box>
    </Box>
  );
};

export default ObjectDetail;
