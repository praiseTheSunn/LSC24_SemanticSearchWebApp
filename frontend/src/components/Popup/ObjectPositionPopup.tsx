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
import pico8Colors from '../../assets/ObjColors/pico8'
import { HumanPoses } from '../../data/HumanPoses'
import { InitPoseCoor } from '../../data/InitPoseCoor'
import { DragIconList } from '../../data/icon'
import bodyPartToIndex from '../../data/JointMapping'
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
  const [layer, setLayer] = useState(0)
  const [isClear, setIsClear] = useState(false)
  // const [trigger, result] = useLazyGetObjectsByPositionQuery()
  const [trigger, result] = useLazyGetImagesQuery()
  const { data, error, isError, isFetching } = result

  const [openPoseSpeedDial, setOpenPoseSpeedDial] = useState(false)
  const [openBrushSpeedDial, setOpenBrushSpeedDial] = useState(true)

  const [brushSize, setBrushSize] = useState<number>(3) // Default brush size is 3x3

  const systemConfig = useAppSelector((state) => state.app.config)
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

  const handleBrushSizeChange = (event: Event, newValue: number | number[]) => {
    setBrushSize(newValue as number)
  }

  const txtQuery = useAppSelector((state) => state.app.queryPayload.text_query)

  const handleQuery = () => {
    const obj_global_encoding: { [key: string]: number } = {}
    const color_global_encoding: { [key: string]: number } = {}
    let obj_local_encoding = ''
    let color_local_encoding = ''

    let pose_local_encoding = ''
    const pose_parts: string[] = []

    // Helper function to calculate the Euclidean distance
    function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // Loop through selectedPose to get the pose encoding
    for (const key in selectedPose) {
      const [x, y] = selectedPose[key];
      
      // Compute the cell coordinates
      const cellY = Math.ceil(y / (systemConfig.WhiteboardCanvasHeight / 20)) - 1;
      const cellX = Math.ceil(x / (systemConfig.WhiteboardCanvasWidth / 20)) - 1;

      console.log('Key:', key, 'Y:', cellY, 'X:', cellX);
      const encode = `${String.fromCharCode(65 + cellY)}${String.fromCharCode(97 + cellX)}${bodyPartToIndex[key]}`;

      pose_parts.push(encode);

      // Iterate over surrounding cells (-1, 0, 1)
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue; // Skip the current cell

          const surroundingCellRow = cellY + i;
          const surroundingCellCol = cellX + j;

          // Ensure surrounding cells are within grid bounds
          const gridRows = 20;  // Assuming a 20x20 grid
          const gridCols = 20;

          if (
            surroundingCellRow < 0 || surroundingCellRow >= gridRows ||
            surroundingCellCol < 0 || surroundingCellCol >= gridCols
          ) {
            continue;
          }

          // Calculate the surrounding cell's center
          const cellSizeHeight = systemConfig.WhiteboardCanvasHeight / gridRows;
          const cellSizeWidth = systemConfig.WhiteboardCanvasWidth / gridCols;

          const surroundingCenterX = (surroundingCellCol + 0.5) * cellSizeWidth;
          const surroundingCenterY = (surroundingCellRow + 0.5) * cellSizeHeight;

          // Calculate distances from the keypoint to the surrounding cell's center
          const distanceY = calculateDistance(x, y, x, surroundingCenterY);
          const distanceX = calculateDistance(x, y, surroundingCenterX, y);
          // console.log('Checking cell:', surroundingCellRow, surroundingCellCol);
          // console.log('DistanceY:', distanceY, 'DistanceX:', distanceX);

          // If the keypoint is near the center of the surrounding cell, add it to the grid
          if (
            distanceY < 0.8 * cellSizeHeight &&
            distanceX < 0.8 * cellSizeWidth
          ) {
            // console.log("SURROUND: ", surroundingCellRow, surroundingCellCol, key);
            const encode = `${String.fromCharCode(65 + surroundingCellRow)}${String.fromCharCode(97 + surroundingCellCol)}${bodyPartToIndex[key]}`;
            pose_parts.push(encode);
          }
        }
      }
    }

    pose_local_encoding = pose_parts.join(' ');

    console.log('Pose Encoding:', pose_local_encoding);

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
      dataset: queryPayload.dataset,
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
              setSelecObjects={setSelectedObjects}
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
              icon={<BrushIcon onClick={() => {
                setOpenBrushSpeedDial(!openBrushSpeedDial)
                setLayer(layer === 0 ? 1 : 0)}
                }
                />}
              direction="down"
              open={openBrushSpeedDial}
              FabProps={{ size: 'small', color: 'secondary' }}
            />
            {layer === 0 && (
              <Box
                  sx={{
                    // width: '100%',
                    position: 'absolute',
                    width: '160px',
                    height: 'fit-content',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    // marginTop: '10px',
                    // marginBottom: '10px',
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
                    align='center'
                  >
                    Brush Size: {brushSize}
                  </Typography>
                  <Slider
                    sx={
                      {
                        // marginRight: '10px',
                        
                        // rotate: '180deg',
                      }
                    }
                    // orientation='vertical'
                    // track="inverted"
                    // track={false}
                    value={brushSize}
                    min={1}
                    max={7} // You can adjust the max brush size here
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
                onClick={() => setSelectedPose(null)}
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
