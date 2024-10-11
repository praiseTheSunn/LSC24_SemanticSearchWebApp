import AccessibilityIcon from '@mui/icons-material/Accessibility'
import CloseIcon from '@mui/icons-material/Close'
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  IconButton,
  SpeedDial,
  SpeedDialAction,
  TextField,
} from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  appActions,
  useAppDispatch,
  useAppSelector,
  useLazyGetImagesQuery,
} from '../../AppState'
import { ObjectV8ClassNames } from '../../assets/ObjClass/yolov8_class_names'
import { ObjectV10ClassNames } from '../../assets/ObjClass/yolov10_class_names'
import pico8Colors from '../../assets/ObjColors/pico8'
import { HumanPoses } from '../../data/HumanPoses'
import { InitPoseCoor } from '../../data/InitPoseCoor'
import { DragIconList } from '../../data/icon'
import type { ObjPosResponse } from '../../types/api'
import type { ImageRecord } from '../../types/image'
import BrushWhiteboard from '../BrushCanvas'
import PoseCanvas from '../PoseCanvas'

const ObjectClassNames = Array.from(
  new Set(ObjectV8ClassNames.concat(ObjectV10ClassNames)),
)

export interface DrawnItem {
  rect: Rect
  icon: Icon
  encodeObjects: string
  encodeColors: string
}
export interface Rect {
  x: number
  y: number
  width: number
  height: number
  top: number
  left: number
  bottom: number
  right: number
}
export interface Icon {
  source: string
  name: string
  color?: string
}

// define a dict type
export interface GridDict {
  // color as string
  color: string
  // object name as string
  objectName: string
}

const ObjectPositionPopup = ({ query }: { query?: string }) => {
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null)
  const [selectedPose, setSelectedPose] = useState<Record<
    string,
    [number, number]
  > | null>(null)
  const [selectedObjects, setSelectedObjects] = useState<DrawnItem[]>([])
  const [isClear, setIsClear] = useState(false)
  // const [trigger, result] = useLazyGetObjectsByPositionQuery()
  const [trigger, result] = useLazyGetImagesQuery()
  const { data, error, isError, isFetching } = result

  const [openPoseSpeedDial, setOpenPoseSpeedDial] = useState(false)

  // TO DO: move to config
  const gridSize = 20
  const initDataGrid = Array(gridSize)
    .fill(null)
    .map(() =>
      Array(gridSize).fill({
        color: '',
        objectName: '',
      }),
    )
  const [dataGrid, setDataGrid] = useState<GridDict[][]>(initDataGrid)

  const queryPayload = useAppSelector((state) => state.app.queryPayload)

  const dispatch = useAppDispatch()
  const setLoadingPopUp = useCallback(
    (message: string) => {
      dispatch(appActions.setLoadingPopUp(message))
    },
    [dispatch],
  )
  const setResult = useCallback(
    (data: ImageRecord[]) => {
      dispatch(appActions.setAppImageData(data))
    },
    [dispatch],
  )
  const setCacheResult = useCallback(
    (data: ObjPosResponse[]) => {
      dispatch(appActions.setCacheData(data))
    },
    [dispatch],
  )

  const handleIconClick = (icon: Icon) => {
    setSelectedIcon(icon)
    // console.log('Selected icon:', icon)
  }

  const handleColorClick = (color: string) => {
    if (selectedIcon) {
      setSelectedIcon({ ...selectedIcon, color })
      return
    }
    setSelectedIcon({ source: 'none', name: 'none', color })
  }

  const handleDraw = (item: DrawnItem) => {
    setSelectedIcon(null) // Clear selection after drawing
  }

  const handleClear = () => {
    setDataGrid(initDataGrid)
    setSelectedIcon(null)
    setIsClear(true)
  }

  const txtQuery = useAppSelector((state) => state.app.queryPayload.text_query)

  const handleQuery = () => {
    const obj_global_encoding: { [key: string]: number } = {}
    const color_global_encoding: { [key: string]: number } = {}
    let obj_local_encoding = ''
    let color_local_encoding = ''

    for (const item of selectedObjects) {
      const { encodeObjects, encodeColors, icon } = item
      const iconName = icon.name.replace(' ', '_')
      const iconColor = icon.color ? icon.color.replace('#', '') : 'none'
      if (!obj_global_encoding[iconName]) {
        obj_global_encoding[iconName] = 0
      }
      if (
        iconColor &&
        iconColor !== 'none' &&
        !color_global_encoding[iconColor]
      ) {
        color_global_encoding[iconColor] = 0
      }
      if (iconColor && iconColor !== 'none')
        color_global_encoding[iconColor] += 1
      obj_global_encoding[iconName] += 1
      obj_local_encoding = obj_local_encoding.concat(' ', encodeObjects)
      color_local_encoding = color_local_encoding.concat(' ', encodeColors)
    }

    const searchQuery = {
      obj_global_encoding,
      color_global_encoding,
      obj_local_encoding: obj_local_encoding.trim(),
      color_local_encoding: color_local_encoding.trim(),
      query: txtQuery,
    }
    console.log('Query:', searchQuery)
    // trigger(query);
    trigger({
      text_query: txtQuery,
      mode: queryPayload.mode,
      model: queryPayload.model,
      object_global_encoding: obj_global_encoding,
      object_local_encoding: obj_local_encoding,
      color_global_encoding: color_global_encoding,
      color_local_encoding: color_local_encoding,
    })
  }

  useEffect(() => {
    if (isFetching) {
      setLoadingPopUp('Fetching object result...')
    }

    if (isError) {
      console.error('Error:', error)
      setLoadingPopUp('Error: fetching object result')
    }

    if (data && !isFetching) {
      setLoadingPopUp('')
      setResult(data)
      setCacheResult(data)
    }
  }, [isFetching, isError, error, data])

  return (
    <Box
      id="objectPosPopup"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'white',
        zIndex: 1003,
        borderRadius: '6px',
        boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
        height: 'fit-content',
        width: 'fit-content',
        overflow: 'visible',
        padding: '8px',
      }}
    >
      <Box marginRight="8px">
        <Grid
          style={{
            minWidth: '100px',
            maxWidth: '120px',
          }}
          columns={3}
          container
        >
          {DragIconList.map((icon: Icon) => (
            <Grid
              item
              xs={1}
              key={icon.name}
              sx={{ width: '33px', height: '33px', cursor: 'pointer' }}
            >
              <Box
                component="img"
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                src={icon.source}
                alt={icon.name}
                title={icon.name}
                onClick={() => handleIconClick(icon)}
              />
            </Grid>
          ))}
        </Grid>
        <Autocomplete
          autoComplete={true}
          autoHighlight={true}
          clearOnBlur={true}
          options={ObjectClassNames}
          slotProps={{
            popper: { style: { zIndex: 10005 } },
            paper: { elevation: 6 },
          }}
          sx={{ width: '100%' }}
          onChange={(e: any, newValue: string | null) => {
            const name = newValue ? newValue : ''
            const source = 'none'
            console.log('Selected object:', name)
            setSelectedIcon({ source, name })
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              fullWidth={true}
              margin="dense"
              label="Objects"
            />
          )}
        />
      </Box>
      <Box display="flex" flexDirection="column">
        {/* <Whiteboard
          setSelecObjects={setSelectedObjects}
          onDraw={handleDraw}
          selectedIcon={selectedIcon}
          onClear={isClear}
          setIsClear={setIsClear}
        />*/}
                <BrushWhiteboard
          setSelecObjects={setSelectedObjects}
          onDraw={handleDraw}
          selectedIcon={selectedIcon}
          onClear={isClear}
          setIsClear={setIsClear}
          dataGrid={dataGrid}
          setDataGrid={setDataGrid}
        />
        <PoseCanvas joints={selectedPose} setJoints={setSelectedPose} />
        <Grid
          style={{
            minWidth: '100px',
            marginTop: '8px',
            position: 'relative',
          }}
          columns={8}
          container
        >
          {Object.keys(pico8Colors).map((colorKeys) => (
            <Grid
              title={colorKeys}
              item
              xs={1}
              key={colorKeys as string}
              sx={{
                boxSizing: 'border-box',
                height: '33px',
                cursor: 'pointer',
                borderWidth: '1px',
                borderColor: 'black',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor:
                    pico8Colors[colorKeys as keyof typeof pico8Colors],
                }}
                title={colorKeys}
                onClick={() =>
                  handleColorClick(
                    pico8Colors[colorKeys as keyof typeof pico8Colors],
                  )
                }
              />
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', marginLeft: 1 }}
        className="flex flex-col ml-1"
      >
        <Button
          variant="contained"
          color="error"
          onClick={handleClear}
          style={{
            color: 'white',
            width: '50px',
            height: '30px',
            marginBottom: '2px',
          }}
        >
          Clear
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleQuery}
          style={{ color: 'white', width: '50px', height: '30px' }}
        >
          Send
        </Button>
        <Box
          sx={{
            position: 'relative',
            alignItems: 'flex-start',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <SpeedDial
            ariaLabel="SpeedDial basic example"
            sx={{ position: 'absolute', top: 10, zIndex: 20000 }}
            icon={
              <AccessibilityIcon
                onClick={() => {
                  if (selectedPose === null) {
                    setSelectedPose(InitPoseCoor)
                    setOpenPoseSpeedDial(true)
                  } else setOpenPoseSpeedDial(!openPoseSpeedDial)
                }}
              />
            }
            direction="down"
            open={openPoseSpeedDial}
            FabProps={{ size: 'small', color: 'secondary' }}
          >
            {HumanPoses.map((pose) => (
              <SpeedDialAction
                key={pose.name}
                icon={
                  <Box
                    component="img"
                    src={pose.icon}
                    alt={pose.name}
                    sx={{ objectFit: 'contain', height: '20px', width: '20px' }}
                  />
                }
                tooltipTitle={pose.name}
                onClick={() => setSelectedPose(pose.joints)}
              />
            ))}
            <SpeedDialAction
              key="clear"
              icon={<CloseIcon />}
              tooltipTitle="Clear poses"
              onClick={() => setSelectedPose(null)}
            />
          </SpeedDial>
        </Box>
      </Box>
    </Box>
  )
}

export default ObjectPositionPopup
