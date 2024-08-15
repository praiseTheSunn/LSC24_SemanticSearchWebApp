import { type Dispatch, type SetStateAction, useEffect, useRef, useState, forwardRef } from 'react'
import { ObjectPosIcon } from '../assets'
// import { usePopUp } from '../contexts/popUpContext'
import { useSelectedImages } from '../contexts/selectedImageContext'
import Dropdown from './dropDown'
import ToggableComponent from './toggleEvaluationBox'
import { Box, ClickAwayListener, Paper } from '@mui/material'
import { MessagePopup, ObjectPositionPopup } from '.'
import type { SearchTermType } from '../types/search' 

type SearchBoxProps =
{
  displayedFilters: any;
  setDisplayedFilters: any;
  setQuery: any;
  setResult: any;
  setModel: Dispatch<SetStateAction<string>>;
  setMode: Dispatch<SetStateAction<string>>;
  handleFilterChange: any;
  setCacheResult: any;
  setSearchTerms: Dispatch<SetStateAction<SearchTermType[]>>;
  setSubmitText: Dispatch<SetStateAction<string>>;
  setSubmitFilename: Dispatch<SetStateAction<string>>;
}

const SearchBox = forwardRef<HTMLDivElement, SearchBoxProps>(({
  displayedFilters,
  setDisplayedFilters,
  setQuery,
  setResult,
  setModel,
  setMode,
  handleFilterChange,
  setCacheResult,
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
  const [showObjectPosPopup, setShowObjectPosPopup] = useState(false)
  const [showMessagePopup, setShowMessagePopup] = useState(false)
  // const { setLoadingPopUp } = usePopUp()

  useEffect(() => {
    messagePopup.current = document.querySelector('.messagePopup')
    objPosPopup.current = document.querySelector('.objectPosPopup')
    const handleClickOutside = (event: any) => {
      if (objPosPopup.current && !objPosPopup.current.contains(event.target)) {
        setShowObjectPosPopup(false)
        // console.log('objPosPopup', objPosPopup);
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
    setShowMessagePopup(true)
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
        setDisplayedFilters((previousState: any) => [...previousState, filter])
        // setLoadingPopUp(true)
      }
      setTextareaValue('')
      // setDisplayedImages(true)
      setShowMessagePopup(true)
    }
  }

  const openObjPosPopup = () => {
    setShowObjectPosPopup(true)
  }

  return (
    // <div className='left-filter-container'>
    <Box
      className="text-query-container"
      sx={{
        width: 'auto',
        height: '50px',
        paddingBottom: '5px',
        display: 'flex',
        position: 'relative',
        marginTop: '10px',
        marginLeft: '10px',
        marginBottom: '10px',
      }}
    >
      <ClickAwayListener onClickAway={() => setShowMessagePopup(false)}>
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
            left: '0',
            top: '10px',
          }}>
            <MessagePopup
              setSearchTerms={setSearchTerms}
              displayedFilters={displayedFilters}
              showPopup={showMessagePopup}
              setDisplayedFilters={setDisplayedFilters}
            />
            
          </Paper>
          
        </div>
      </ClickAwayListener>
      <ClickAwayListener onClickAway={() => setShowObjectPosPopup(false)}>
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
            onClick={() => openObjPosPopup()}
            sx={{
              marginLeft: '3px',
              marginTop: '2px',
              cursor: 'pointer',
              position: 'relative',
              width: "2.25rem",
              height: "2.25rem",
            }}
          />
          <ObjectPositionPopup
            setCacheResult={setCacheResult}
            showPopup={showObjectPosPopup}
            setResult={setResult}
          />
        </Box>
      </ClickAwayListener>
      <div className="ml-3 mt-2">
        <Dropdown
          // className='ml-300'
          label="Model"
          displayItems={['CLIP', 'BLIP2', 'BEiT-3', 'STFM']}
          valueItems={['clip', 'blip2', 'beit3', 'stfm']}
          setData={setModel}
        />
      </div>
      <div className="ml-3 mt-2">
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
      </div>
      <div className="ml-3 mt-2 top-0" style={{ zIndex: 9999 }}>
        <ToggableComponent />
      </div>
    </Box>
    // {/* </div> */}
  )
})

export default SearchBox
