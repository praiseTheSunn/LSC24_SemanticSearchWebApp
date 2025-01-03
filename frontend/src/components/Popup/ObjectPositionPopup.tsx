import AccessibilityIcon from '@mui/icons-material/Accessibility'
import BrushIcon from '@mui/icons-material/Brush'
import CloseIcon from '@mui/icons-material/Close'
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  IconButton,
  Slider,
  SpeedDial,
  SpeedDialAction,
  TextField,
  Typography,
} from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Whiteboard } from '..'
import {
  appActions,
  useAppDispatch,
  useAppSelector,
  useLazyGetImagesQuery,
} from '../../AppState'
import { ObjectV8ClassNames } from '../../assets/ObjClass/yolov8_class_names'
import { ObjectV10ClassNames } from '../../assets/ObjClass/yolov10_class_names'
import { MVKClassNames, LHEClassNames } from '../../assets/ObjClass/mvk_lhe_names'
import pico8Colors from '../../assets/ObjColors/pico8'
import { HumanPoses } from '../../data/HumanPoses'
import { InitPoseCoor } from '../../data/InitPoseCoor'
import { DragIconList } from '../../data/icon'
import type { ObjPosResponse } from '../../types/api'
import type { ImageRecord } from '../../types/image'
import { brushEncoding } from '../../utils/encoding/brushEncoding'
import { objColorPosEncoding } from '../../utils/encoding/objColorPosEncoding'
import { poseEncoding } from '../../utils/encoding/poseEncoding'
import BrushWhiteboard from '../BrushWhiteboard'
import PoseCanvas from '../PoseCanvas'
import { MVKImages } from '../../data/MVKImages'
import { LHEImages } from '../../data/LHEImages'

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

export interface GridDict {
  color: string
  objectName: string
}

const ObjectPositionPopup = ({ query }: { query?: string }) => {
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null)
  const [selectedPose, setSelectedPose] = useState<Record<
    string,
    [number, number]
  > | null>(null)
  const [selectedObjects, setSelectedObjects] = useState<DrawnItem[]>([])
  const [layer, setLayer] = useState(1)
  const [isClear, setIsClear] = useState(false)
  // const [trigger, result] = useLazyGetObjectsByPositionQuery()
  const [trigger, result] = useLazyGetImagesQuery()
  const { data, error, isError, isFetching } = result

  const [openPoseSpeedDial, setOpenPoseSpeedDial] = useState(false)
  const [openBrushSpeedDial, setOpenBrushSpeedDial] = useState(true)

  const [brushSize, setBrushSize] = useState<number>(3) // Default brush size is 3x3

  const systemConfig = useAppSelector((state) => state.app.config)
  const initDataGrid = Array(systemConfig.WhiteboardGridRowCount)
    .fill(null)
    .map(() =>
      Array(systemConfig.WhiteboardGridColumnCount).fill({
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

  const handleIconClick = (icon: Icon) => {
    setSelectedIcon(icon)
    // console.log('Selected icon:', icon)
  }
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleMVKOptionImage = (option: string) => {
    const imageObj = MVKImages.find((img) => img.name === option);
    return imageObj ? imageObj.source : '';
  };

  const handleLHEOptionImage = (option: string) => {
    const imageObj = LHEImages.find((img) => img.name === option);
    return imageObj ? imageObj.source : '';
  };

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

  const handleBrushSizeChange = (event: Event, newValue: number | number[]) => {
    setBrushSize(newValue as number)
  }

  const handleQuery = () => {
    const {
      obj_global_encoding,
      color_global_encoding,
      obj_local_encoding,
      color_local_encoding,
    } = objColorPosEncoding({ selectedObjects })
    const pose_local_encoding = poseEncoding({ selectedPose, systemConfig })
    const {
      brush_color_global_encoding,
      brush_obj_local_encoding,
      brush_color_local_encoding,
    } = brushEncoding(dataGrid)

    const finalColorLocalEncoding = color_local_encoding
      .trim()
      .concat(' ', brush_color_local_encoding.trim())
    const finalObjLocalEncoding = obj_local_encoding
      .trim()
      .concat(' ', brush_obj_local_encoding.trim())
    const finalColorGlobalEncoding = { ...color_global_encoding }

    for (const [key, value] of Object.entries(brush_color_global_encoding)) {
      if (finalColorGlobalEncoding[key]) {
        finalColorGlobalEncoding[key] += value
      } else {
        finalColorGlobalEncoding[key] = value
      }
    }

    const searchQuery = {
      object_global_encoding: obj_global_encoding,
      color_global_encoding: finalColorGlobalEncoding,
      object_local_encoding: finalObjLocalEncoding.trim(),
      color_local_encoding: finalColorLocalEncoding.trim(),
      pose_local_encoding: pose_local_encoding.trim(),
      text_query: queryPayload.text_query,
      mode: queryPayload.mode,
      model: queryPayload.model,
      dataset: queryPayload.dataset,
    }
    console.log('Query:', searchQuery)
    trigger(searchQuery)
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
        <Autocomplete
          autoComplete={true}
          autoHighlight={true}
          clearOnBlur={true}
          options={MVKClassNames}
          renderOption={(props, option) => (
            <li
              {...props}
              onMouseEnter={() => setHoveredOption(option)}
              onMouseLeave={() => setHoveredOption(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                padding: 8,
              }}
            >
              {hoveredOption === option && (
                <Box
                  sx={{
                    position: 'fixed',
                    width: 200,
                    height: 200,
                    marginLeft: 10,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    overflow: 'hidden',
                    backgroundColor: '#f9f9f9',
                    right: '-200px',
                    top: 0,
                  }}
                >
                  <img
                    src={handleMVKOptionImage(option)}
                    alt={option}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
              )}
              <span>{option}</span>
            </li>
          )}
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
              label="MVK"
            />
          )}
        />
        <Autocomplete
          autoComplete={true}
          autoHighlight={true}
          clearOnBlur={true}
          options={LHEClassNames}
          renderOption={(props, option) => (
            <li
              {...props}
              onMouseEnter={() => setHoveredOption(option)}
              onMouseLeave={() => setHoveredOption(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                padding: 8,
              }}
            >
              {hoveredOption === option && (
                <Box
                  sx={{
                    position: 'fixed',
                    width: 200,
                    height: 200,
                    marginLeft: 10,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    overflow: 'hidden',
                    backgroundColor: '#f9f9f9',
                    right: '-200px',
                    top: 0,
                  }}
                >
                  <img
                    src={handleLHEOptionImage(option)}
                    alt={option}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
              )}
              <span>{option}</span>
            </li>
          )}
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
              label="LHE"
            />
          )}
        />
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        position="relative"
        height="fit-content"
      >
        <Box
          position="relative"
          sx={{
            width: `${systemConfig.WhiteboardCanvasWidth}px`,
            height: `${systemConfig.WhiteboardCanvasHeight}px`,
          }}
        >
          <Box
            id="brush-container"
            sx={{
              opacity: layer === 0 ? 1 : 0.5,
              zIndex: 1010 + (layer === 0 ? 1000 : 0),
              position: 'absolute',
              width: '100%',
              height: '100%',
              padding: 0,
            }}
          >
            <BrushWhiteboard
              onDraw={handleDraw}
              selectedIcon={selectedIcon}
              onClear={isClear}
              setIsClear={setIsClear}
              dataGrid={dataGrid}
              setDataGrid={setDataGrid}
              brushSize={brushSize}
            />
          </Box>
          <Box
            id="whiteboard-container"
            sx={{
              opacity: layer === 1 ? 1 : 0.5,
              zIndex: 1010 + (layer === 1 ? 1000 : 0),
              position: 'absolute',
              width: '100%',
              height: '100%',
              padding: 0,
            }}
          >
            <Whiteboard
              setSelecObjects={setSelectedObjects}
              onDraw={handleDraw}
              selectedIcon={selectedIcon}
              onClear={isClear}
              setIsClear={setIsClear}
            />
          </Box>
          <Box
            id="pose-container"
            sx={{
              opacity: layer === 2 ? 1 : 0.5,
              zIndex: 1010 + (layer === 2 ? 1000 : 0),
              position: 'absolute',
              width: '100%',
              height: '100%',
              padding: 0,
            }}
          >
            <PoseCanvas joints={selectedPose} setJoints={setSelectedPose} />
          </Box>
        </Box>
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
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 1 }}>
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
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            gap: '15px',
            top: '10px',
          }}
        >
          <Box position="relative" width="100%" height="40px">
            <SpeedDial
              ariaLabel="SpeedDial basic example"
              sx={{ position: 'absolute', zIndex: 20000, width: '100%' }}
              icon={
                <BrushIcon
                  onClick={() => {
                    setOpenBrushSpeedDial(!openBrushSpeedDial)
                    setLayer(layer === 0 ? 1 : 0)
                  }}
                />
              }
              direction="down"
              open={openBrushSpeedDial}
              FabProps={{ size: 'small', color: 'secondary' }}
            />
            {layer === 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  width: '160px',
                  height: 'fit-content',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginLeft: '80px',
                  gap: '5px',
                  paddingX: '15px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
                }}
              >
                <Typography
                  gutterBottom
                  sx={{
                    width: '100%',
                  }}
                  align="center"
                >
                  Brush Size: {brushSize}
                </Typography>
                <Slider
                  value={brushSize}
                  min={1}
                  max={7}
                  step={2}
                  onChange={handleBrushSizeChange}
                  valueLabelDisplay="off"
                />
              </Box>
            )}
          </Box>
          <Box position="relative" width="100%" height="40px">
            <SpeedDial
              ariaLabel="SpeedDial basic example"
              sx={{ position: 'absolute', zIndex: 20000, width: '100%' }}
              icon={
                <AccessibilityIcon
                  onClick={() => {
                    if (selectedPose === null) {
                      setSelectedPose(InitPoseCoor)
                      setOpenPoseSpeedDial(true)
                      setLayer(1)
                    } else setOpenPoseSpeedDial(!openPoseSpeedDial)
                    setLayer(openPoseSpeedDial ? 1 : 2)
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
                      sx={{
                        objectFit: 'contain',
                        height: '20px',
                        width: '20px',
                      }}
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
                onClick={() => {
                  setSelectedPose(null)
                  setOpenPoseSpeedDial(false)
                  setLayer(1)
                }}
              />
            </SpeedDial>
          </Box>

          {/* </SpeedDial> */}
        </Box>
      </Box>
    </Box>
  )
}

export default ObjectPositionPopup
