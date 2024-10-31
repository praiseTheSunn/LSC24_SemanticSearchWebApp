import Fuse, { FuseResult } from 'fuse.js'
import React, { useEffect, useState, useContext, useCallback } from 'react'
import { Id, toast } from 'react-toastify'
// import imageService from '../../services/imageService'
import { Tooltip } from 'react-tooltip'
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
import MetadataTab from '../../containers/metadata/metadataTab'
import ImageGrid from '../../containers/similarity/image-grid'
import TimelineTab from '../../containers/timeline/timelineTab'
import 'react-tooltip/dist/react-tooltip.css'
// import evalService from '../../services/evalService'

import { Box, ClickAwayListener } from '@mui/material'
import { appActions, useAppDispatch, useAppSelector } from '../../AppState'
import VideoPopup from '../../components/Popup/VideoPopup'
import ImagePreviewPopup from '../../components/Popup/imagePreview'
import LoadingPopup from '../../components/Popup/loadingPopup'
// import { usePopUp } from '../contexts/popUpContext';
// Popup
import NeighborPopup from '../../components/Popup/neighborPopup'
import SinglePopup from '../../components/Popup/singlePopup'
import SubmitDataPopup from '../../components/Popup/submitDataPopup'
import SimialrityAdvancedGrid from '../../containers/similarity/SimilarityAdvancedGrid'
import type { ImageRecord } from '../../types/image'
import type { SearchTermType } from '../../types/search'
import { ObjPosResponse } from '../../types/api'
import { Event, Result } from '../../types/log'

const categoryMapping = {
  "ocr": "OCR",
  "caption": "caption",
  "location": "location",
  "object_tags": "localizedObject",
  "date": "date",
  "timestamp": "time"
}

const saveLog = (events: Event[], data: ObjPosResponse[]) => {
  const timestamp = Date.now();
  const output: {
    timestamp: number;
    sortType: string;
    resultSetAvailability: string;
    events: Event[];
    results: Result[];
  } = {
    timestamp: timestamp,
    sortType: "rankingModel",
    resultSetAvailability: "Top1000",
    events: [],
    results: []
  };
  for (let i = 0; i < events.length; i++) {
    output.events.push(
      {
        timestamp: timestamp,
        category: "TEXT",
        type: categoryMapping[events[i].category] || events[i].category,
        value: events[i].value,
      }
    )
  }
  for (let i = 0; i < data.length; i++) {
    output.results.push({
        "answer": {
            "mediaItemName": data[i].img_link.split("/").pop()?.split(".")[0] || ""
        },
        "rank": i + 1
    })
  }
  // Save to JSON file
  const filePath = `${timestamp}.json`;
  const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filePath;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

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

const Home = () => {
  const sesId = localStorage.getItem('session')
  // const { evaluationId } = useContext(EvaluationContext)
  const evaluationId = 0
  // console.log('selectedFilters in home', selectedFilters);

  const [displayedFilters, setDisplayedFilters] = useState<SearchTermType[]>([])
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [selectedModeIndex, setSelectedModeIndex] = useState(0)
  const [isCtrlPressed, setIsCtrlPressed] = useState(false)
  const windowWidth = window.innerWidth
  const handleTabClick = (index: number) => {
    setSelectedTabIndex(index)
  }
  const [searchTerms, setSearchTerms] = useState<SearchTermType[]>([])
  const [submitText, setSubmitText] = useState('')
  const [submitFilename, setSubmitFilename] = useState('')

  const neighborPopupData: ImageRecord | null | undefined = useAppSelector(
    (state) => state.app.neighborPopUpData,
  )
  const similarPopupData: ImageRecord | null | undefined = useAppSelector(
    (state) => state.app.similarPopUpData,
  )
  const imagePreviewData: ImageRecord | null | undefined = useAppSelector(
    (state) => state.app.imagePreviewData,
  )

  const submitData: ImageRecord | null | undefined = useAppSelector(
    (state) => state.app.SubmitData,
  )

  const loadingPopUpMessage: string = useAppSelector(
    (state) => state.app.loadingPopUpMessage,
  )
  const imageDatas: ImageRecord[] = useAppSelector((state) => state.app.data)
  const videoPopupSource: string | undefined = useAppSelector(
    (state) => state.app.videoDataForPopup?.source,
  )

  const dispatch = useAppDispatch()

  const toggleNeighborPopup = React.useCallback(
    (data: ImageRecord | null | undefined) => {
      dispatch(appActions.setNeighborPopupData(data))
    },
    [dispatch],
  )

  const toggleSimilarPopup = React.useCallback(
    (data: ImageRecord | null | undefined) => {
      dispatch(appActions.setSimilarPopupData(data))
    },
    [dispatch],
  )

  const toggleSubmitData = React.useCallback(
    (data: ImageRecord | null | undefined) => {
      dispatch(appActions.setSubmitData(data))
    },
    [dispatch],
  )

  const handleFilterChange = (key: string, value: string) => {
    setSearchTerms((prevTerms) => {
      const updatedTerms: { category: string; value: string }[] = [...prevTerms]
      updatedTerms.push({ category: key, value })
      return updatedTerms
    })
  }

  const [imageAfterFilter, setImageAfterFilter] = useState<ImageRecord[]>([])
  useEffect(() => {
    if ((imageDatas !== null) && (imageDatas !== undefined) && ((imageDatas as ImageRecord[]).length > 0)){
      setImageAfterFilter(imageDatas)
    }
  }, [imageDatas])

  useEffect(() => {
    // console.log('searchTerms changed', searchTerms)
    if (searchTerms.length > 0) {
      let fuseResults: ImageRecord[] = imageDatas
      // console.log('fuseResults', fuseResults.length, fuseResults);

      for (let i = 0; i < searchTerms.length; i++) {
        if (searchTerms[i].value !== '') {
          const fuse = new Fuse(fuseResults, {
            keys: [searchTerms[i].category],
            includeScore: true,
            threshold: 0.6,
            distance: 10000,
          })
          fuseResults = fuse.search(searchTerms[i].value).map((result) => {
            return { ...result.item, score: result.score }
          })
        }
      }

      saveLog(searchTerms, fuseResults);

      if (fuseResults.length === 0) {
        toast.error('No fuzzy results found')
      }

      setImageAfterFilter(fuseResults)
    } else if (searchTerms.length === 0) {
      setImageAfterFilter(imageDatas)
    }
  }, [searchTerms])

  // const appState = useAppSelector((state) => state.app)
  // const csvData = useAppSelector((state) => state.app.csvImages)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case '1':
            setSelectedTabIndex(0)
            e.preventDefault()
            break
          case '2':
            setSelectedTabIndex(1)
            e.preventDefault()
            break
          case '3':
            setSelectedTabIndex(2)
            e.preventDefault()
            break
          case '4':
            setSelectedTabIndex(3)
            e.preventDefault()
            break
          default:
            break
        }
      }
      if (e.key === 'Escape') {
        dispatch(appActions.setSimilarPopupData(null))
        dispatch(appActions.setNeighborPopupData(null))
        dispatch(appActions.setVideoDataForPopup(null))
        dispatch(appActions.setSubmitData(null))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [isCtrlPressed, toggleNeighborPopup, toggleSimilarPopup])

  // useEffect(() => {
  //   if (submitText !== '') {
  //     // evalService
  //     //   .submitText(evaluationId, localStorage.getItem('session'), submitText)
  //     //   .then((response: ApiResponse) => {
  //     //     toast.success(`Text submitted: ${response.data.submission}`)
  //     //     setSubmitText('')
  //     //     console.log('response', response)
  //     //     if (response?.data && response?.data?.submission === 'CORRECT') {
  //     //       evalService
  //     //         .submitText(
  //     //           evaluationId,
  //     //           localStorage.getItem('sessionCentral'),
  //     //           submitText,
  //     //         )
  //     //         .then((response: ApiResponse) => {
  //     //           toast.success(`Text submitted: ${response.data.submission}`)
  //     //           setSubmitText('')
  //     //           console.log('response', response)
  //     //         })
  //     //         .catch((error: ApiError) => {
  //     //           toast.error(`Error submit TEXT: ${error.message}`)
  //     //           console.log('error', error)
  //     //         })
  //     //     }
  //     //   })
  //     //   .catch((error: ApiError) => {
  //     //     toast.error(`Error submit TEXT: ${error.message}`)
  //     //     console.log('error', error)
  //     //   })
  //   }
  // }, [submitText])

  // useEffect(() => {
  //   if (submitFilename !== '') {
  //     // submit(submitFilename)
  //   }
  // }, [submitFilename])

  // console.log('result');

  return (
    <div
      className="home-main-container flex flex-col h-[100%] w-[100%] min-h-[200px] overflow-hidden relative"
      style={{ backgroundColor: '#F5F5F5' }}
    >
      {loadingPopUpMessage ? <LoadingPopup /> : null}
      {videoPopupSource ? <VideoPopup /> : null}

      <Tooltip
        id="tooltip_img"
        style={{
          zIndex: '9999999',
          position: 'fixed',
          top: '0',
          right: '0',
          maxWidth: '500px',
          maxHeight: '150px',
          overflow: 'auto',
        }}
        positionStrategy="fixed"
        place="bottom"
        position={{ x: windowWidth, y: 0 }}
        render={(content) => {
          const tooltipData = content.content
            ? JSON.parse(content.content)
            : null
          return tooltipData && <ObjectDetail viewImage={tooltipData} />
        }}
      />
      {neighborPopupData && (
        <NeighborPopup onClose={() => toggleNeighborPopup(null)} />
      )}
      {similarPopupData && (
        <SinglePopup onClose={() => toggleSimilarPopup(null)} />
      )}
      {imagePreviewData && <ImagePreviewPopup />}
      {submitData && <SubmitDataPopup onClose={() => toggleSubmitData(null)} />}
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
            type="button"
            className={`font-base grid-tab text-gray ${index === selectedTabIndex ? 'active' : ''}`}
            style={{
              paddingTop: '0.375rem',
              paddingBottom: '0.375rem',
              width: '197px',
              backgroundImage: `url(${item.bg})`,
              zIndex: 90 - index * 10,
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
          width: 'calc(100dvw - 10px)',
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
                  type="button"
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
                <ImageGrid style={{ width: '100dvw' }} data={imageAfterFilter} />
              </Box>
            )}
            {selectedModeIndex !== 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  width: '100%',
                  height: '100%',
                  overflowY: 'auto',
                  marginTop: '2px',
                }}
              >
                <SimialrityAdvancedGrid tabindex={selectedModeIndex} />
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
