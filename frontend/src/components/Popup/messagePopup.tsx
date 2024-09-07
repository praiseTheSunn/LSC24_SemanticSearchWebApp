import React, { forwardRef } from 'react';
import { Box, Button, Paper, Typography, List, ListItem } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import type { FilterTagType, SearchTermType } from '../../types/search';
import FilterTag from '../Filter/filterTag';
import { appActions, useAppDispatch, useAppSelector } from '../../AppState';

interface MessagePopupProps {
  displayedFilters: FilterTagType[];
  setDisplayedFilters: Dispatch<SetStateAction<FilterTagType[]>>;
  setSearchTerms: Dispatch<SetStateAction<SearchTermType[]>>;
}

// Forward ref to the root element
const MessagePopup = forwardRef<HTMLDivElement, MessagePopupProps>(({
  displayedFilters,
  setDisplayedFilters,
  setSearchTerms,
}, ref) => {
  const handleClearAll = () => {
    setDisplayedFilters([]);
    setSearchTerms([]);
  };

  const showPopup = useAppSelector((state) => state.app.isMessagePopUpOpen);

  const onIconClick = (index: number, category: string, value: any) => {
    const updatedFilters = displayedFilters.map((filter: any, i: number) => {
      if (i === index) {
        const currentStatus = filter.status;
        if (currentStatus === 1) {
          setSearchTerms((prevState: SearchTermType[]) =>
            prevState.filter(
              (term: any) => term.value !== value || term.category !== category,
            ),
          );
        } else {
          setSearchTerms((prevState: SearchTermType[]) => [...prevState, { category, value }]);
        }
        return { ...filter, status: currentStatus === 1 ? 0 : 1 };
      }
      return filter;
    });
    setDisplayedFilters(updatedFilters);
  };

  return (
    <Paper
      ref={ref} // Forward the ref to the root element
      elevation={3}
      sx={{
        backgroundColor: 'rgb(206, 232, 255)',
        maxHeight: showPopup ? '400px': '0px',
        width: showPopup ? '300px' : '0px',
        minHeight: showPopup ? '250px' : '0px',
        position: 'absolute',
        overflow: 'auto',
        top: '70px',
        zIndex: '10000',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <Box zIndex="9999" sx={{ width: '100%', position: 'sticky', top: 0, backgroundColor: 'rgb(206, 232, 255)' }}>
        <Button
          size="small"
          variant="text"
          onClick={handleClearAll}
          sx={{ textAlign: 'left' }}
        >
          Clear
        </Button>
      </Box>
      <Box height="100%" display="flex" flexDirection="column" flexWrap="wrap" alignContent="center">
        <List>
          {displayedFilters.map((filter, index) => (
            <ListItem key={`${filter.category}-${filter.value}-${index}`} disableGutters disablePadding>
              <FilterTag filter={filter} index={index} onIconClick={onIconClick} />
            </ListItem>
          )).reverse()}
        </List>
        <Paper
          elevation={1}
          sx={{
            backgroundColor: 'white',
            width: '80%',
            height: 'auto',
            borderRadius: '7px',
            p: 2,
            mt: 1,
            mb: 1,
          }}
        >
          <Typography variant="body2" component="div">
            -lo ... : location
            <br />
            -t ... : time
            <br />
            -d ... : date
            <br />
            -dow ... : Day of week
            <br />
            -act ... : activity
            <br />
            -ocr ... : OCR text
            <br />
            -obj ... : Object Detection
            <br />
            -text ... : Submit text
            <br />
            -file ... : Submit file name
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
});

export default MessagePopup;
