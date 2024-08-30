import { useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { Box, Grid } from '@mui/material'; // Imported MUI components
import type { ImageRecord, VisibilityType, TimelineTabActivityRowData, TimelineTabActivityData } from '../types/image';
import type React from 'react';

interface Activity {
  images: ImageRecord[];
  [key: string]: any; // To allow any other properties
}

interface ActivityBarProps {
  rowData: TimelineTabActivityRowData;
  visibility: VisibilityType;
  onActivitySelect: (activity_id: number | null) => void;
}

const activityColorMap: { [key: string]: string } = {
  'driving car': '#800000',
  'working on computer': '#9a6324',
  eating: '#808000',
  'doing laundry': '#469990',
  cooking: '#000075',
  biking: '#000000',
  'watching tv': '#911eb4',
  writing: '#3cb44b',
  shopping: '#ffe119',
  Other: '#f58231',
};

const ActivityBar: React.FC<ActivityBarProps> = ({ rowData, visibility, onActivitySelect }) => {
  // Determine the width of each activity segment on the bar
  const imageCounts = rowData.map((activity_item) => `${activity_item.images.length}`);
  const resultString = imageCounts.map((item) => `${item}fr`).join(' ');

  if (rowData) {
    for (const activity_item of rowData) {
      activity_item.images.sort((a, b) => b.score - a.score);
    }
  }

  const [bestImg, setBestImg] = useState<string | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Placeholder effect for any logic related to bestImg
  }, [bestImg]);

  const handleActivityClick = (activity_id: number | null, bestImg: string | null, index: number | null) => {
    if (clickedIndex !== index) {
      setClickedIndex(index);
      onActivitySelect(activity_id);
    } else {
      setClickedIndex(null);
      onActivitySelect(null);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: 'white',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: resultString,
        gap: 0,
        width: '1080px',
        height: '10px',
        my: 2,
        borderRadius: '4px',
        visibility: visibility,
      }}
    >
      <Tooltip
        id={'.tooltip_'}
        place="top"
        clickable
        style={{ zIndex: 9999 }}
        render={({ content, activeAnchor }) => (
          <Box sx={{ width: '100%', height: '100%', zIndex: 9999 }}>
            <Box component="span" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem', textAlign: 'center', display: 'block' }}>
              {content ? content : 'undefined'}
            </Box>
            <Box
              component="img"
              src={activeAnchor?.getAttribute('data-tooltip-img') || ''}
              alt="activity"
              sx={{ width: '110px', height: '80px', objectFit: 'contain', zIndex: 9999 }}
            />
          </Box>
        )}
      />

      {rowData.map((activity_item: TimelineTabActivityData, index: number) => {
        const activity_id = activity_item.activity_id;
        const activity = activity_item.activity;
        const color = activityColorMap[activity];
        const best_img = activity_item.images[0].img_link;

        return (
          <Box
            key={index}
            className={`relative cursor-pointer tooltip_${index}`}
            data-tooltip-id={'.tooltip_'}
            sx={{
              height: '14px',
              backgroundColor: color,
              opacity: clickedIndex === index ? 1 : 0.35,
              cursor: 'pointer',
            }}
            data-tooltip-content={activity}
            data-tooltip-img={best_img}
            onClick={() => handleActivityClick(activity_id, best_img, index)}
          />
        );
      })}
    </Box>
  );
};

export default ActivityBar;
