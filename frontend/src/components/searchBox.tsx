import { Box, Button, ClickAwayListener, Paper } from '@mui/material'
import {
  type Dispatch,
  type SetStateAction,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { MessagePopup } from '.'
import {
  appActions,
  useAppDispatch,
  useAppSelector,
  useLazyGetImagesQuery,
  useLazyGetTranslatedTextQuery,
} from '../AppState'
import { HistoryIcon } from '../assets'
import { FilterCategories } from '../data/FilterCategory'
import type { ImageRecord } from '../types/image'
import type { SearchTermType } from '../types/search'
import { LanguageSwitch } from './Button/LanguageSwitch'
import { CSVDownloadBox } from './CSVDownloadBox'
import ImageInputBox from './ImageInputBox'
import HistoryPopup from './Popup/HistoryPopup'
// import { usePopUp } from '../contexts/popUpContext'
import Dropdown from './dropDown'

type SearchBoxProps = {
  displayedFilters: any
  setDisplayedFilters: any
  handleFilterChange: any
  setSearchTerms: Dispatch<SetStateAction<SearchTermType[]>>
  setSubmitText: Dispatch<SetStateAction<string>>
  setSubmitFilename: Dispatch<SetStateAction<string>>
}

const SearchBox = forwardRef<HTMLDivElement, SearchBoxProps>(
  (
    {
      displayedFilters,
      setDisplayedFilters,
      handleFilterChange,
      setSearchTerms,
      setSubmitText,
      setSubmitFilename,
    },
    ref,
  ) => {
    const [textareaValue, setTextareaValue] = useState('')
    const [textareaHeight, setTextareaHeight] = useState('60px')
    const [isFocus, setIsFocus] = useState(false)

    const showHistory = useAppSelector((state) => state.app.isHistoryPopUpOpen)
    const queryPayload = useAppSelector((state) => state.app.queryPayload)

    const [trigger, result] = useLazyGetImagesQuery()
    const [TriggerTranslate, TranslatedResult] = useLazyGetTranslatedTextQuery()
    const { data, error, isError, isFetching } = result

    const dispatch = useAppDispatch()
    const setQuery = useCallback(
      (value: string) => {
        const newPayload = { ...queryPayload, text_query: value }
        dispatch(appActions.setQueryPayload(newPayload))
      },
      [queryPayload, dispatch],
    )
    const setMode = useCallback(
      (value: string) => {
        const newPayload = { ...queryPayload, mode: value }
        dispatch(appActions.setQueryPayload(newPayload))
      },
      [queryPayload, dispatch],
    )
    const setModel = useCallback(
      (value: string) => {
        const newPayload = { ...queryPayload, model: value }
        dispatch(appActions.setQueryPayload(newPayload))
      },
      [queryPayload, dispatch],
    )
    const setDataset = useCallback(
      (value: string) => {
        const newPayload = { ...queryPayload, dataset: value }
        dispatch(appActions.setQueryPayload(newPayload))
      },
      [queryPayload, dispatch],
    )
    const setLoadingPopup = useCallback(
      (value: string) => {
        dispatch(appActions.setLoadingPopUp(value))
      },
      [dispatch],
    )
    const setMessagePopup = useCallback(
      (value: boolean) => {
        dispatch(appActions.setMessagePopUp(value))
      },
      [dispatch],
    )

    const setResult = useCallback(
      (value: ImageRecord[]) => {
        dispatch(appActions.setAppImageData(value))
      },
      [dispatch],
    )

    const toggleHistoryPopup = useCallback(
      (value: boolean) => {
        dispatch(appActions.toggleHistoryPopUp(value))
      },
      [dispatch],
    )

    const isVietnameseEnabled = useAppSelector(
      (state) => state.app.isVietnameseEnabled,
    )

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

    const lastHistory = useAppSelector(
      (state) => state.app.queryHistory[state.app.queryHistory.length - 1],
    )?.query
    const handleEnter = (event: any) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        dispatch(appActions.setLikedImages([]))
        dispatch(appActions.setDislikedImages([]))

        const input = event.target.value.trim()
        const timestamp = new Date().toLocaleTimeString()
        let updatedQuery = input

        for (const key in FilterCategories) {
          if (input.startsWith(key)) {
            console.log('key:', key)
            const { category, startIndex } =
              FilterCategories[key as keyof typeof FilterCategories]
            const value = input.substring(startIndex)
            const filter = { category, value, status: 1 }
            setDisplayedFilters((previousState: any) => [
              ...previousState,
              filter,
            ])
            handleFilterChange(category, value)
            updatedQuery = `${lastHistory} | ${category}: ${value}`
          }
        }

        if (input.startsWith('-text ')) {
          const value = input.substring(6)
          const filter = { category: 'SUBMIT TEXT', value, status: 1 }
          setDisplayedFilters((previousState: any) => [
            ...previousState,
            filter,
          ])
          setSubmitText(value)
        } else if (input === '-c') {
          // Handle special case
        } else if (input.startsWith('-file ')) {
          const filename = input.substring(6)
          const filter = { category: 'file', value: filename, status: 1 }
          setDisplayedFilters((previousState: any) => [
            ...previousState,
            filter,
          ])
          setSubmitFilename(filename)
        } else if (!input.startsWith('-')) {
          const value = input
          if (isVietnameseEnabled) {
            // Translate to english
            TriggerTranslate({ q: value, target: 'en' })
            setTextareaValue('')
            setMessagePopup(true)
            return
          }

          const filter = { category: 'query', value, status: 1 }
          setQuery(value)

          trigger({
            text_query: value,
            mode: queryPayload.mode,
            model: queryPayload.model,
            dataset: queryPayload.dataset,
          })
          setDisplayedFilters((previousState: any) => [
            ...previousState,
            filter,
          ])
          updatedQuery = `query: ${input}`
        }
        dispatch(
          appActions.setQueryHistory({ time: timestamp, query: updatedQuery }),
        )
        setTextareaValue('')
        setMessagePopup(true)
      }
    }

    useEffect(() => {
      if (isFetching) {
        setLoadingPopup('Fetching result...')
      }

      if (isError) {
        console.error('Error:', error)
        setLoadingPopup('Error: fetching result')
      }

      if (data && !isFetching) {
        setLoadingPopup('')
        setResult(data)
      }
    }, [isFetching, isError, error, data])

    useEffect(() => {
      if (TranslatedResult.isFetching) {
        setLoadingPopup('Translating...')
      }

      if (TranslatedResult.isError) {
        console.error('Error:', TranslatedResult.error)
        setLoadingPopup('Error: translating')
      }

      if (TranslatedResult.data && !TranslatedResult.isFetching) {
        const translatedText = TranslatedResult.data.translatedText

        const filter = { category: 'query', value: translatedText, status: 1 } // status 1 for success
        setQuery(translatedText)
        // trigger({
        //   text_query: translatedText,
        //   mode: queryPayload.mode,
        //   model: queryPayload.model,
        // })

        trigger({
          text_query: translatedText,
          mode: queryPayload.mode,
          model: queryPayload.model,
          dataset: queryPayload.dataset,
        })
        setDisplayedFilters((previousState: any) => [...previousState, filter])

        const updatedQuery = `query: ${translatedText}`
        const timestamp = new Date().toLocaleTimeString()
        dispatch(
          appActions.setQueryHistory({ time: timestamp, query: updatedQuery }),
        )
      }
    }, [TranslatedResult])

    return (
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
                zIndex: '99',
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
                top: `calc( ${textareaHeight})`,
              }}
            >
              <MessagePopup
                setSearchTerms={setSearchTerms}
                displayedFilters={displayedFilters}
                setDisplayedFilters={setDisplayedFilters}
              />
            </Paper>
          </div>
        </ClickAwayListener>

        <ClickAwayListener onClickAway={() => toggleHistoryPopup(false)}>
          <Box position="relative">
            <Box
              component="img"
              src={HistoryIcon}
              alt="history_icon"
              onClick={() => toggleHistoryPopup(true)}
              sx={{
                marginLeft: '3px',
                marginTop: '2px',
                cursor: 'pointer',
                position: 'relative',
                width: '2.25rem',
                height: '2.25rem',
              }}
              title="Search History"
            />
            {showHistory && (
              <HistoryPopup
                setSearchTerms={setSearchTerms}
                setDisplayedFilters={setDisplayedFilters}
              />
            )}
          </Box>
        </ClickAwayListener>
        <ImageInputBox />
        <Box sx={{ marginLeft: '12px' }}>
          <Dropdown
            label="Model"
            displayItems={['CLIP', 'BLIP2', 'BEiT-3', 'STFM']}
            valueItems={['clip', 'blip2', 'beit3', 'stfm']}
            setData={setModel}
          />
        </Box>
        <Box sx={{ marginLeft: '12px' }}>
          <Dropdown
            label="Mode"
            displayItems={['Vector', 'Vector + Keyword', 'Keyword']}
            valueItems={['vec', 'vec_kw', 'kw']}
            setData={setMode}
          />
        </Box>
        <Box sx={{ marginLeft: '12px' }}>
          <Dropdown
            label="Dataset"
            displayItems={['All', 'Lesson', 'Cooking']}
            valueItems={['aic24', 'aic24_lesson', 'aic24_cooking']}
            setData={setDataset}
          />
        </Box>
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          sx={{ marginLeft: 'auto', marginRight: '20px', zIndex: 100 }}
          gap={2}
        >
          <LanguageSwitch
            value={isVietnameseEnabled}
            onClick={() => dispatch(appActions.toggleVietnamese())}
          />
          <CSVDownloadBox />
          {/* <ToggableComponent /> */}
        </Box>
      </Box>
    )
  },
)

export default SearchBox
