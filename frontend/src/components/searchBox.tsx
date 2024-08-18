import { type Dispatch, type SetStateAction, useEffect, useRef, useState, forwardRef, useCallback } from 'react'
import { ObjectPosIcon } from '../assets'
// import { usePopUp } from '../contexts/popUpContext'
import Dropdown from './dropDown'
import ToggableComponent from './toggleEvaluationBox'
import { Box, ClickAwayListener, Paper } from '@mui/material'
import { MessagePopup, ObjectPositionPopup } from '.'
import type { QueryPayload, SearchTermType } from '../types/search' 
import { appActions, useAppDispatch, useAppSelector, useLazyGetImagesQuery } from '../AppState'
import type { ImageRecord } from '../types/image'

type SearchBoxProps =
{
  displayedFilters: any;
  setDisplayedFilters: any;
  handleFilterChange: any;
  setSearchTerms: Dispatch<SetStateAction<SearchTermType[]>>;
  setSubmitText: Dispatch<SetStateAction<string>>;
  setSubmitFilename: Dispatch<SetStateAction<string>>;
}

const SearchBox = forwardRef<HTMLDivElement, SearchBoxProps>(({
  displayedFilters,
  setDisplayedFilters,
  handleFilterChange,
  setSearchTerms,
  setSubmitText,
  setSubmitFilename,
}, ref) => {
  const [textareaValue, setTextareaValue] = useState('')
  const [textareaHeight, setTextareaHeight] = useState('60px')
  // const { setDisplayedImages } = useSelectedImages()
  const [isFocus, setIsFocus] = useState(false)
  const messagePopup = useRef<HTMLElement | null>(null)
  const objPosPopup = useRef<HTMLElement | null>(null)
  
  const [trigger, result ] = useLazyGetImagesQuery();
  const { data, error, isError, isFetching } = result;
  // const { setLoadingPopUp } = usePopUp()

  const dispatch = useAppDispatch()
  const setQuery = useCallback((value: string) => {
    const newPayload = { ...queryPayload, text_query: value }
    dispatch(appActions.setQueryPayload(newPayload))
  }, [dispatch])
  const setMode = useCallback((value: string) => {
    const newPayload = { ...queryPayload, mode: value }
    dispatch(appActions.setQueryPayload(newPayload))
  }, [dispatch])
  const setModel = useCallback((value: string) => {
    const newPayload = { ...queryPayload, model: value }
    dispatch(appActions.setQueryPayload(newPayload))
  }, [dispatch])
  const setLoadingPopup = useCallback((value: string) => {
    dispatch(appActions.setLoadingPopUp(value))
  }, [dispatch])
  const setMessagePopup = useCallback((value: boolean) => {
    dispatch(appActions.setMessagePopUp(value))
  }, [dispatch])
  const setObjectPosPopup = useCallback((value: boolean) => {
    dispatch(appActions.setObjPosPopUp(value))
  }, [dispatch])
  const setResult = useCallback((value: ImageRecord[]) => {
    dispatch(appActions.setAppImageData(value))
  }, [dispatch])
  const setCacheResult = useCallback((value: ImageRecord[]) => {
    dispatch(appActions.setCacheData(value))
  }, [dispatch])

  const queryPayload = useAppSelector((state) => state.app.queryPayload)

  const handleTextareaChange = (event: any) => {
    setTextareaValue(event.target.value)
    // Automatically adjust height based on content if it exceeds the current height
    if (event.target.scrollHeight > event.target.clientHeight) {
      setTextareaHeight(`${event.target.scrollHeight}px`)
    }
  }

  const handleTextareaBlur = () => {
    // Reset height when textarea loses focus
    setTextareaHeight('60px')
  }

  const handleTextareaFocus = (event: any) => {
    //check if the text area has content
    if (event.target.value) {
      setTextareaHeight(`${event.target.scrollHeight}px`)
    }
    // console.log('messagePopup', messagePopup);
    setIsFocus(true)
    setMessagePopup(true)
  }

  const handleEnter = (event: any) => {
    if (event.key === 'Enter') {
      // setDisplayedImages(false);
      event.preventDefault() // Prevent default behavior
      console.log('Enter key pressed')
      const input = event.target.value.trim()
      if (input.startsWith('-lo ')) {
        const value = input.substring(4)
        const filter = { category: 'location', value, status: 1 }
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        handleFilterChange('location', value)
      } else if (input.startsWith('-t ')) {
        const value = input.substring(3)
        const filter = { category: 'time', value, status: 1 }
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        handleFilterChange('time', value)
      } else if (input.startsWith('-d ')) {
        const value = input.substring(3)
        const filter = { category: 'date', value, status: 1 }
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        handleFilterChange('date', value)
      } else if (input.startsWith('-ocr ')) {
        const value = input.substring(5)
        const filter = { category: 'ocr', value, status: 1 }
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        handleFilterChange('ocr', value)
      } else if (input.startsWith('-obj ')) {
        const value = input.substring(5)
        const filter = { category: 'object_tags', value, status: 1 }
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        handleFilterChange('object_tags', value)
      } else if (input.startsWith('-act ')) {
        const value = input.substring(5)
        const filter = { category: 'activity', value, status: 1 }
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        handleFilterChange('activity', value)
      } else if (input.startsWith('-dow ')) {
        const value = input.substring(5)
        const filter = { category: 'day_of_week', value, status: 1 }
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        handleFilterChange('day_of_week', value)
      } else if (input.startsWith('-text ')) {
        const value = input.substring(6)
        const filter = { category: 'SUBMIT TEXT', value, status: 1 }
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        setSubmitText(value)
      } else if (input === '-c') {
        // Handle special case
      } else if (input.startsWith('-file ')) {
        const filename = input.substring(6)
        const filter = { category: 'file', value: filename, status: 1 }
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        setSubmitFilename(filename)
      } else {
        const value = input
        const filter = { category: 'query', value, status: 1 }
        // console.log('input', input);
        setQuery(value)
        trigger({ text_query: value, mode: queryPayload.mode, model: queryPayload.model })
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        // setLoadingPopUp(true)
      }
      setTextareaValue('')
      // setDisplayedImages(true)
      setMessagePopup(true)
    }
  }

  useEffect(() => {
    if (isFetching) {
      setLoadingPopup('Fetching object result...');
    }
    
    if (isError) {
      console.error('Error:', error);
      setLoadingPopup('Error: fetching object result');
    }
  
    if (data && !isFetching) {
      setLoadingPopup('');
      setResult(data);
      setCacheResult(data);
    }
  }, [isFetching, isError, error, data]);

  return (
    // <div className='left-filter-container'>
    <Box
      className="text-query-container"
      sx={{
        width: 'auto',
        height: '50px',
        display: 'flex',
        position: 'relative',
        paddingTop: '10px',
        paddingLeft: '10px',
        paddingBottom: '15px',
      }}
    >
      <ClickAwayListener onClickAway={() => setMessagePopup(false)}>
        <div>
          <textarea
            style={{
              height: textareaHeight,
              width: '286px',
              display: 'block',
              position: 'relative',
              boxShadow: '2px 3px #c8c5c5 ',
              border: 'solid 1.9px #636262',
              borderRadius: '10px',
              overflow: 'hidden',
              zIndex: '10',
              paddingLeft: '7px',
              paddingTop: '5px',
            }}
            value={textareaValue}
            onChange={handleTextareaChange}
            autoComplete="on"
            placeholder="Search here then Enter..."
            className="search-textarea"
            rows={2}
            onKeyDown={handleEnter}
            // onMouseEnter={() => messagePopup.current.classList.remove('hidden')}
            onBlur={handleTextareaBlur}
            onFocus={(e) => handleTextareaFocus(e)}
          />
          <Paper 
          elevation={3}
          sx={{
            position: 'absolute',
            left: '10px',
            top: '20px',
          }}>
            <MessagePopup
              setSearchTerms={setSearchTerms}
              displayedFilters={displayedFilters}
              setDisplayedFilters={setDisplayedFilters}
            />
            
          </Paper>
          
        </div>
      </ClickAwayListener>
      <ClickAwayListener onClickAway={() => setObjectPosPopup(false)}>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
          }}
        >
          <Box
            component="img"
            src={ObjectPosIcon}
            alt="object_pos_icon"
            onClick={() => setObjectPosPopup(true)}
            sx={{
              marginLeft: '3px',
              marginTop: '2px',
              cursor: 'pointer',
              position: 'relative',
              width: "2.25rem",
              height: "2.25rem",
            }}
          />
          <ObjectPositionPopup/>
        </Box>
      </ClickAwayListener>
      <Box
        sx={{ marginLeft: '12px', marginTop: '8px' }}
        >
        <Dropdown
          // className='ml-300'
          label="Model"
          displayItems={['CLIP', 'BLIP2', 'BEiT-3', 'STFM']}
          valueItems={['clip', 'blip2', 'beit3', 'stfm']}
          setData={setModel}
        />
      </Box>
      <Box
      sx={{ marginLeft: '12px', marginTop: '8px' }}
      >
        <Dropdown
          // className='ml-10'
          label="Mode"
          displayItems={[
            'Semantic',
            'Semantic-Full text',
            'Semantic-Autoparse',
          ]}
          valueItems={['smt', 'smt-mm-dtin', 'smt-3m-dtin']}
          setData={setMode}
        />
      </Box>
      <Box sx={{ marginLeft: '12px', marginTop: '8px' }} style={{ zIndex: 9999 }}>
        <ToggableComponent />
      </Box>
    </Box>
    // {/* </div> */}
  )
})

export default SearchBox
