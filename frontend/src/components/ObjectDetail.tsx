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
        <Typography variant="subtitle1" component="strong">Activity: </Typography>
        <Typography variant="body2">{viewImage.activity}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle1" component="strong">Caption: </Typography>
        <Typography variant="body2">{viewImage.caption}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle1" component="strong">Date: </Typography>
        <Typography variant="body2">{viewImage.date}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle1" component="strong">Time: </Typography>
        <Typography variant="body2">{viewImage.time}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle1" component="strong">Day of week: </Typography>
        <Typography variant="body2">{viewImage.day_of_week}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle1" component="strong">Location: </Typography>
        <Typography variant="body2">{viewImage.location_displayed}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle1" component="strong">Object tags: </Typography>
        <Typography variant="body2">{viewImage.object_tags}</Typography>
      </Box>
      <Box sx={{ maxWidth: 400, flexWrap: 'wrap' }}>
        <Typography variant="subtitle1" component="strong">OCR: </Typography>
        <Typography variant="body2">{viewImage.ocr}</Typography>
      </Box>
      <Box sx={{ maxWidth: 400, flexWrap: 'wrap' }}>
        <Typography variant="subtitle1" component="strong">Location: </Typography>
        <Typography variant="body2">{viewImage.location}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle1" component="strong">Filename: </Typography>
        <Typography variant="body2">{viewImage.img_link?.split('/').pop()?.split('.')[0]}</Typography>
      </Box>
    </Box>
  );
};

export default ObjectDetail;
