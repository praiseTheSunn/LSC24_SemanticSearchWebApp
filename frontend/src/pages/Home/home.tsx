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
           
          </Box>
        )}

      </Box>
    </div>
  )
}

export default Home
