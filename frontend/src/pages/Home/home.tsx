import Fuse, { FuseResult } from 'fuse.js'
import React, { useEffect, useState, useContext, useCallback } from 'react'
import {  toast } from 'react-toastify'
import {
  LocationIcon,
  LocationIconActive,
  SimilarityIcon,
  SimilarityIconActive,
  TimelineIcon,
  TimelineIconActive,
  TrapoziedBgGray2,
  TrapoziedBgGray3,
  TrapoziedBgGrayLeft,
} from '../../assets'
import { ObjectDetail, SearchBox } from '../../components'
import MapTab from '../../containers/location/mapTab'
import ImageGrid from '../../containers/similarity/image-grid'
import TimelineTab from '../../containers/timeline/timelineTab'
// import imageService from '../../services/imageService'
import { Tooltip } from 'react-tooltip'
import MetadataTab from '../../containers/metadata/metadataTab'
import 'react-tooltip/dist/react-tooltip.css'
// import evalService from '../../services/evalService'


// import { usePopUp } from '../contexts/popUpContext';
import { createPortal } from 'react-dom'
// Popup
import NeighborPopup from '../../components/Popup/neighborPopup'
import SinglePopup from '../../components/Popup/singlePopup'
import { appActions, useAppDispatch, useAppSelector, useLazyGetImagesQuery } from '../../AppState'
import { isEmpty, isNil } from 'lodash'
import LoadingPopup from '../../components/Popup/loadingPopup'
import SimialrityAdvancedGrid from '../../containers/similarity/SimilarityAdvancedGrid'
import type { SearchTermType } from '../../types/search'
import { Box, ClickAwayListener } from '@mui/material'
import type { ImageRecord } from '../../types/image'

const LevelList = [
  { level: 'Similarity', bg: TrapoziedBgGrayLeft },
  { level: 'Timeline', bg: TrapoziedBgGray2 },
  { level: 'Location', bg: TrapoziedBgGray3 },
  { level: 'VQA', bg: TrapoziedBgGray3 },
]

const Mode = [
  { mode: 'Similarity', bg: SimilarityIcon, bgat: SimilarityIconActive },
  { mode: 'Timeline', bg: TimelineIcon, bgat: TimelineIconActive },
  { mode: 'Location', bg: LocationIcon, bgat: LocationIconActive },
]

// create a list of image data (10 images needed)

const Home = () => {
  const sesId = localStorage.getItem('session')
  // const { evaluationId } = useContext(EvaluationContext)
  const evaluationId = 0
  // console.log('selectedFilters in home', selectedFilters);

  const [displayedFilters, setDisplayedFilters] = useState([])
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [selectedModeIndex, setSelectedModeIndex] = useState(0)
  const [isCtrlPressed, setIsCtrlPressed] = useState(false)
  const [windowHeigt, setWindowHeight] = useState(window.innerHeight)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const handleTabClick = (index: number) => {
    setSelectedTabIndex(index)
  }
  const [searchTerms, setSearchTerms] = useState<SearchTermType[]>([])
  const [submitText, setSubmitText] = useState('')
  const [submitFilename, setSubmitFilename] = useState('')

  const neighborPopupData: ImageRecord[] = useAppSelector(
    (state) => state.app.neighborPopUpData
  );
  const similarPopupData: ImageRecord | null | undefined = useAppSelector(
    (state) => state.app.similarPopUpData
  );
  const loadingPopUpMessage: string = useAppSelector(
    (state) => state.app.loadingPopUpMessage
  );
  const displayedImages: string[] = useAppSelector(
    (state) => state.app.displayedImages
  );
  const imageDatas: ImageRecord[] = useAppSelector(
    (state) => state.app.data
  );
  const cacheData: ImageRecord[] = useAppSelector(
    (state) => state.app.cacheData
  );

  const dispatch = useAppDispatch();
  const setCacheResult = React.useCallback((data: ImageRecord[]) => {
    dispatch(appActions.setCacheData(data));
  }, [dispatch]);

  const setImageData = React.useCallback((data: ImageRecord[]) => {
    dispatch(appActions.setAppImageData(data));
  }, [dispatch]);

  const queryPayload = useAppSelector((state) => state.app.queryPayload);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const setQuery = useCallback((query: string) => {
    const newPayload = { ...queryPayload, text_query: query }
    dispatch(appActions.setQueryPayload(newPayload));
  }, [dispatch]);

  const toggleNeighborPopup = React.useCallback((data: ImageRecord | null | undefined) => {
    dispatch(appActions.setNeighborPopupData(data));
  }, [dispatch]);

  const toggleSimilarPopup = React.useCallback((data: ImageRecord | null | undefined) => {
    dispatch(appActions.setSimilarPopupData(data));
  }, [dispatch]);

  // Handle input changes for each key
  const handleFilterChange = (key: string, value: string) => {
    console.log('key', key, value)
    setSearchTerms((prevTerms) => {
      const updatedTerms: {category: string, value: string}[] = [...prevTerms]
      updatedTerms.push({ category: key, value })
      return updatedTerms
    })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // console.log('searchTerms', searchTerms);
    if (searchTerms.length > 0) {
      let fuseResults: ImageRecord[] = cacheData
      // console.log('fuseResults', fuseResults.length, fuseResults);

      for (const term of searchTerms) {
        if (term.value !== '') {
          // console.log('term', term.category, term.value);
          const fuse = new Fuse(fuseResults, {
            keys: [term.category],
            includeScore: true,
            threshold: 0.6,
            distance: 10000,
          })
          fuseResults = fuse.search(String(term.value)).map((result: FuseResult<ImageRecord>) => {
            return { ...result.item, score: result.score } as ImageRecord;
          })
        }
      }

      if (fuseResults.length === 0) {
        toast.error('No fuzzy results found')
      }

      setImageData(fuseResults)
      console.log('filteredResults', fuseResults.length)
    } else if (searchTerms.length === 0) {
      setImageData(cacheData)
    }
  }, [searchTerms])


  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
    if (!displayedImages) {
      setDisplayedFilters([])
      setQuery('')
      setImageData([])
      setCacheResult([])
      setSearchTerms([])
    }
  }, [displayedImages])

  // const submit = (src: string) => {
  //   if (src === '') {
  //     return
  //   }
  //   const evalId = evaluationId

  //   // Parse the filename from the file path
  //   const filenameWithExt = src.split('/').pop()
  //   // Remove the file extension
  //   const filename = filenameWithExt ? filenameWithExt.split('.')[0] : ''
  //   console.log('filename', filename)
  //   toast.info(`Submitting: ${filename}`)

  //   evalService
  //     .submitFile(evalId, sesId, filename)
  //     .then((response: ApiResponse) => {
  //       console.log('response', response)
  //       toast.success(
  //         `Submit: ${filename} ${response.data.submission ? response.data.submission : ''}`,
  //       )
  //       if (
  //         response?.data?.submission &&
  //         response?.data?.submission === 'CORRECT'
  //       ) {
  //         evalService
  //           .submitFile(
  //             evalId,
  //             localStorage.getItem('sessionCentral'),
  //             filename,
  //           )
  //           .then((response: ApiResponse) => {
  //             console.log('response', response)
  //             toast.success(
  //               `Submit FOR CENTRAL: ${filename} ${response.data.submission ? response.data.submission : ''}`,
  //             )
  //           })
  //           .catch((error: ApiError) => {
  //             console.log('error', error)
  //             toast.error(`ERROR FOR CENTRAL: ${`${filename}: ${error}`}`)
  //           })
  //       }
  //     })
  //     .catch((error: ApiError) => {
  //       console.log('error', error)
  //       toast.error(`ERROR: ${`${filename}: ${error}`}`)
  //     })
  // }

  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key === 'Control') {
  //       setIsCtrlPressed(true)
  //     }
  //     if (e.altKey) {
  //       switch (e.key) {
  //         case '1':
  //           setSelectedTabIndex(0)
  //           e.preventDefault()
  //           break
  //         case '2':
  //           setSelectedTabIndex(1)
  //           e.preventDefault()
  //           break
  //         case '3':
  //           setSelectedTabIndex(2)
  //           e.preventDefault()
  //           break
  //         case '4':
  //           setSelectedTabIndex(3)
  //           e.preventDefault()
  //           break
  //         default:
  //           break
  //       }
  //     }
  //     if (e.key === 'Escape') {
  //       setNeighborPopUp(false)
  //       setSimilarPopUp(false)
  //     }
  //   }

  //   const handleKeyUp = (e: KeyboardEvent) => {
  //     if (e.key === 'Control') {
  //       setIsCtrlPressed(false)
  //     }
  //   }

  //   const handleClick = (e: MouseEvent) => {
  //     if (isCtrlPressed && (e.target as HTMLElement).classList.contains('submissible')) {
  //       const src =(e.target as HTMLElement).getAttribute('src')
  //       submit(src as string)
  //     }
  //   }
  //   // console.log('isCtrlPressed', isCtrlPressed);

  //   document.addEventListener('keydown', handleKeyDown)
  //   document.addEventListener('keyup', handleKeyUp)
  //   document.addEventListener('click', handleClick)

  //   return () => {
  //     document.removeEventListener('keydown', handleKeyDown)
  //     document.removeEventListener('keyup', handleKeyUp)
  //     document.removeEventListener('click', handleClick)
  //   }
  // }, [isCtrlPressed, toggleNeighborPopup, toggleSimilarPopup])


  useEffect(() => {
    if (submitText !== '') {
      // evalService
      //   .submitText(evaluationId, localStorage.getItem('session'), submitText)
      //   .then((response: ApiResponse) => {
      //     toast.success(`Text submitted: ${response.data.submission}`)
      //     setSubmitText('')
      //     console.log('response', response)
      //     if (response?.data && response?.data?.submission === 'CORRECT') {
      //       evalService
      //         .submitText(
      //           evaluationId,
      //           localStorage.getItem('sessionCentral'),
      //           submitText,
      //         )
      //         .then((response: ApiResponse) => {
      //           toast.success(`Text submitted: ${response.data.submission}`)
      //           setSubmitText('')
      //           console.log('response', response)
      //         })
      //         .catch((error: ApiError) => {
      //           toast.error(`Error submit TEXT: ${error.message}`)
      //           console.log('error', error)
      //         })
      //     }
      //   })
      //   .catch((error: ApiError) => {
      //     toast.error(`Error submit TEXT: ${error.message}`)
      //     console.log('error', error)
      //   })
    }
  }, [submitText])

  useEffect(() => {
    if (submitFilename !== '') {
      // submit(submitFilename)
      setSubmitFilename('')
    }
  }, [submitFilename])

  // console.log('result');

  return (
    <div
      className="home-main-container flex flex-col h-[100%] w-[100%] min-h-[200px] overflow-hidden relative"
      style={{ backgroundColor: '#F5F5F5' }}
    >
      {loadingPopUpMessage ? <LoadingPopup /> : null}

      <Tooltip
        id="tooltip_img"
        style={{ zIndex: '9999999', position: 'fixed', top: '0', right: '0' }}
        positionStrategy="fixed"
        // anchorSelect='.tooltip-display'
        place="bottom"
        // clickable={true}
        // position={{x: 0, y: 0}}
        position={{ x: windowWidth, y: 0 }}
        render={(content) => {
          // console.log('content', content.content);
          const tooltipData = content.content
            ? JSON.parse(content.content)
            : null
          return (
            tooltipData && (
              <ObjectDetail
                viewImage={tooltipData}
                className={'w-full h-full p-2'}
              />
            )
          )
        }}
      />
      {neighborPopupData && (
        <NeighborPopup
          viewImage={neighborPopupData.img_link}
          onClose={() => toggleNeighborPopup(null)}
        />
      )}
      {similarPopupData && (
        <SinglePopup
          viewImage={similarPopupData}
          onClose={() => toggleSimilarPopup(null)}
        />
      )}
      <SearchBox
        displayedFilters={displayedFilters}
        setDisplayedFilters={setDisplayedFilters}
        handleFilterChange={handleFilterChange}
        setSearchTerms={setSearchTerms}
        setSubmitText={setSubmitText}
        setSubmitFilename={setSubmitFilename}
      />
      
      
      <Box
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          position: 'relative',
          marginBottom: '-1.5px',
          paddingTop: '15px',
          paddingLeft: '15px',
        }}
      >
        {LevelList.map((item, index) => (
          <button
            key={item.level}
            type='button'
            className={`font-base grid-tab text-gray ${index === selectedTabIndex ? 'active' : ''}`}
            style={{
              paddingTop: '0.375rem',
              paddingBottom: '0.375rem',
              width: '197px',
              backgroundImage: `url(${item.bg})`,
              zIndex: 999 - index * 10,
              border: 'none',
              backgroundColor: 'transparent',
              marginLeft: `${index !== 0 && '-20px'}`,
              position: 'relative',
              height: '30px',
            }}
            onClick={() => handleTabClick(index)}
          >
            {item.level}
          </button>
        ))}
      </Box>

      <Box
        style={{
          height: 'calc(100dvh - 120px)',
          borderRadius: '5px',
          padding: '0 0 0 10px',
          backgroundColor: '#fff',
        }}
      >
        {selectedTabIndex === 0 && (
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                paddingTop: '10px',
              }}
            >
              {Mode.map((item, index) => (
                <button
                  key={item.mode}
                  type='button'
                  className={`font-base font-bold text-gray border-white ${
                    index === selectedModeIndex ? 'active' : ''
                  }`}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%', // Hình tròn
                    border: '1px solid #ccc', // Viền
                    margin: '0 10px', // Khoảng cách giữa các nú
                    backgroundImage: `url(${selectedModeIndex === index ? item.bgat : item.bg})`,
                    backgroundSize: 'cover',
                  }}
                  onClick={() => setSelectedModeIndex(index)}
                />
              ))}
            </Box>
            {selectedModeIndex === 0 && (
              <Box
                sx={{ 
                  marginTop: '2px', 
                  width: 'calc(100dvw - 10px)',
                  display: 'flex',
                  flexDirection: 'row',
                  height: '100%',
                }}
              >
                <ImageGrid />
              </Box>
            )}
            {selectedModeIndex !== 0 && (
              <div
                className="flex flex-row w-full h-full overflow-y-auto"
                style={{ marginTop: '2px' }}
              >
                <SimialrityAdvancedGrid
                  tabindex={selectedModeIndex}
                />
              </div>
            )}
          </Box>
        )}

        {selectedTabIndex === 1 && <TimelineTab />}
        {selectedTabIndex === 2 && (
          // <ImageCluster data={timelineData} />
          <MapTab
            // style={{ marginTop: '12px', display: 'flex', flexDirection: 'row' }}
          />
        )}
        {selectedTabIndex === 3 && <MetadataTab />}
      </Box>
    </div>
  )
}

export default Home
