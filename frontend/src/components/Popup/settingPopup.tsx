import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Paper,
  Slider,
  Typography,
} from '@mui/material'
import type React from 'react'
import { saveConfigToLocalStorage } from '..'
import { useAppDispatch, useAppSelector } from '../../AppState'
import { appActions } from '../../AppState'
import type { ConfigType } from '../../types/app'

const ConfigEditor: React.FC = () => {
  const userConfig = useAppSelector((state) => state.app.config)
  const queryPayload = useAppSelector((state) => state.app.queryPayload)
  const dispatch = useAppDispatch()

  const handleSliderChange = (key: keyof ConfigType, value: number) => {
    const updatedConfig = {
      ...userConfig,
      [key]: value,
    }
    // setConfig(updatedConfig)
    dispatch(appActions.setConfig(updatedConfig))
    saveConfigToLocalStorage(updatedConfig)
    if (key === 'queryWindowSize') {
      dispatch(
        appActions.setQueryPayload({ ...queryPayload, window_size: value }),
      )
    }
    console.log('Config updated:', updatedConfig)
  }

  return (
    <Box style={{ padding: '10px', margin: '10px' }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Query Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography gutterBottom>Window Size</Typography>
          <Slider
            marks={[
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
              { value: 5, label: '5' },
              { value: 6, label: '6' },
              { value: 7, label: '7' },
              { value: 8, label: '8' },
              { value: 9, label: '9' },
              { value: 10, label: '10' },
            ]}
            value={userConfig.queryWindowSize}
            onChange={(e, newValue) =>
              handleSliderChange('queryWindowSize', newValue as number)
            }
            step={1}
            min={2}
            max={10}
            valueLabelDisplay="auto"
          />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Image Grid Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography gutterBottom>Image Grid Column Count</Typography>
          <Slider
            marks={[
              { value: 5, label: '5' },
              { value: 6, label: '6' },
              { value: 7, label: '7' },
              { value: 8, label: '8' },
              { value: 9, label: '9' },
              { value: 10, label: '10' },
              { value: 11, label: '11' },
              { value: 12, label: '12' },
            ]}
            value={userConfig.ImageGridColumnCount}
            onChange={(e, newValue) =>
              handleSliderChange('ImageGridColumnCount', newValue as number)
            }
            step={1}
            min={5}
            max={12}
            valueLabelDisplay="auto"
          />
          <Typography gutterBottom>Image Grid Cell Height</Typography>
          <Slider
            value={userConfig.ImageGridCellHeight}
            onChange={(e, newValue) =>
              handleSliderChange('ImageGridCellHeight', newValue as number)
            }
            step={2}
            min={50}
            max={500}
            valueLabelDisplay="auto"
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Neighbor Tab Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography gutterBottom>Neighbor Tab Cell Min Width</Typography>
          <Slider
            value={userConfig.NeighborTabCellMinWidth}
            onChange={(e, newValue) =>
              handleSliderChange('NeighborTabCellMinWidth', newValue as number)
            }
            step={10}
            min={100}
            max={500}
            valueLabelDisplay="auto"
          />
          <Typography gutterBottom>Neighbor Tab Row Height</Typography>
          <Slider
            value={userConfig.NeighborTabRowHeight}
            onChange={(e, newValue) =>
              handleSliderChange('NeighborTabRowHeight', newValue as number)
            }
            step={10}
            min={30}
            max={500}
            valueLabelDisplay="auto"
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">View More Popup Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography gutterBottom>View More Popup Column Count</Typography>
          <Slider
            marks={[
              { value: 5, label: '5' },
              { value: 6, label: '6' },
              { value: 7, label: '7' },
              { value: 8, label: '8' },
              { value: 9, label: '9' },
              { value: 10, label: '10' },
              { value: 11, label: '11' },
              { value: 12, label: '12' },
            ]}
            value={userConfig.ViewMorePopupColumnCount}
            onChange={(e, newValue) =>
              handleSliderChange('ViewMorePopupColumnCount', newValue as number)
            }
            step={1}
            min={5}
            max={12}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom>View More Popup Cell Height</Typography>
          <Slider
            value={userConfig.ViewMorePopupCellHeight}
            onChange={(e, newValue) =>
              handleSliderChange('ViewMorePopupCellHeight', newValue as number)
            }
            step={2}
            min={50}
            max={500}
            valueLabelDisplay="auto"
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Single Popup Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography gutterBottom>Single Popup Column Count</Typography>
          <Slider
            marks={[
              { value: 5, label: '5' },
              { value: 6, label: '6' },
              { value: 7, label: '7' },
              { value: 8, label: '8' },
              { value: 9, label: '9' },
              { value: 10, label: '10' },
              { value: 11, label: '11' },
              { value: 12, label: '12' },
            ]}
            value={userConfig.SinglePopupColumnCount}
            onChange={(e, newValue) =>
              handleSliderChange('SinglePopupColumnCount', newValue as number)
            }
            step={1}
            min={5}
            max={12}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom>Single Popup Cell Height</Typography>
          <Slider
            value={userConfig.SinglePopupCellHeight}
            onChange={(e, newValue) =>
              handleSliderChange('SinglePopupCellHeight', newValue as number)
            }
            step={2}
            min={50}
            max={500}
            valueLabelDisplay="auto"
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Neighbor Popup Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography gutterBottom>Neighbor Popup Column Count</Typography>
          <Slider
            marks={[
              { value: 5, label: '5' },
              { value: 6, label: '6' },
              { value: 7, label: '7' },
              { value: 8, label: '8' },
              { value: 9, label: '9' },
              { value: 10, label: '10' },
              { value: 11, label: '11' },
              { value: 12, label: '12' },
            ]}
            value={userConfig.NeighborPopupColumnCount}
            onChange={(e, newValue) =>
              handleSliderChange('NeighborPopupColumnCount', newValue as number)
            }
            step={1}
            min={5}
            max={12}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom>Neighbor Popup Cell Height</Typography>
          <Slider
            value={userConfig.NeighborPopupCellHeight}
            onChange={(e, newValue) =>
              handleSliderChange('NeighborPopupCellHeight', newValue as number)
            }
            step={2}
            min={50}
            max={500}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom>Neighbor Popup Span</Typography>
          <Slider
            value={userConfig.NeighborPopupSpan}
            onChange={(e, newValue) =>
              handleSliderChange('NeighborPopupSpan', newValue as number)
            }
            step={2}
            min={10}
            max={60}
            valueLabelDisplay="auto"
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Whiteboard Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography gutterBottom> Whiteboard Height</Typography>
          <Slider
            value={userConfig.WhiteboardCanvasHeight}
            onChange={(e, newValue) =>
              handleSliderChange('WhiteboardCanvasHeight', newValue as number)
            }
            step={2}
            min={200}
            max={700}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom> Whiteboard Width</Typography>
          <Slider
            value={userConfig.WhiteboardCanvasWidth}
            onChange={(e, newValue) =>
              handleSliderChange('WhiteboardCanvasWidth', newValue as number)
            }
            step={2}
            min={200}
            max={700}
            valueLabelDisplay="auto"
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Feedback Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography gutterBottom> Like</Typography>
          <Slider
            value={userConfig.LikeNumber}
            onChange={(e, newValue) =>
              handleSliderChange('LikeNumber', newValue as number)
            }
            step={2}
            min={30}
            max={500}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom> Dislike</Typography>
          <Slider
            value={userConfig.DislikeNumber}
            onChange={(e, newValue) =>
              handleSliderChange('DislikeNumber', newValue as number)
            }
            step={2}
            min={30}
            max={500}
            valueLabelDisplay="auto"
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default ConfigEditor
