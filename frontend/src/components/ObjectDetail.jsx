import React from 'react';

const ObjectDetail = ({ viewImage, className }) => {
  className = className || '';
  return (
    <div className={className}>
      <div><strong>Activity: </strong>{viewImage.activity}</div>
      <div><strong>Caption: </strong>{viewImage.caption}</div>
      <div><strong>Date: </strong>{viewImage.date}</div>
      <div><strong>Time: </strong>{viewImage.time}</div>
      <div><strong>Day of week: </strong>{viewImage.day_of_week}</div>
      <div><strong>Location: </strong>{viewImage.location_displayed}</div>
      <div><strong>Object tags: </strong>{viewImage.object_tags}</div>
      <div><strong>OCR: </strong>{viewImage.ocr}</div>
      <div>Location: {viewImage.location}</div>
    </div>
  );
};

export default ObjectDetail;