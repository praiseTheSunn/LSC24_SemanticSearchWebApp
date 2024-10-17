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
import { useState } from 'react'
import { saveConfigToLocalStorage } from '..'
import { useAppDispatch, useAppSelector } from '../../AppState'
import { appActions } from '../../AppState'
import type { ConfigType } from '../../types/app'

const ConfigEditor: React.FC = () => {
  const userConfig = useAppSelector((state) => state.app.config)
  const dispatch = useAppDispatch()

  const [config, setConfig] = useState<ConfigType>(userConfig)

  const handleSliderChange = (key: keyof ConfigType, value: number) => {
    const updatedConfig = {
      ...config,
      [key]: value,
    }
    setConfig(updatedConfig)
    dispatch(appActions.setConfig(updatedConfig))
    saveConfigToLocalStorage(updatedConfig)
    console.log('Config updated:', updatedConfig)
  }

  return (
    <Box style={{ padding: '10px', margin: '10px' }}>
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
            value={config.ImageGridColumnCount}
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
            value={config.ImageGridCellHeight}
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
            value={config.ViewMorePopupColumnCount}
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
            value={config.ViewMorePopupCellHeight}
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
            value={config.SinglePopupColumnCount}
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
            value={config.SinglePopupCellHeight}
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
            value={config.NeighborPopupColumnCount}
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
            value={config.NeighborPopupCellHeight}
            onChange={(e, newValue) =>
              handleSliderChange('NeighborPopupCellHeight', newValue as number)
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
          <Typography variant="h6">Whiteboard Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography gutterBottom> Whiteboard Height</Typography>
          <Slider
            value={config.WhiteboardCanvasHeight}
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
            value={config.WhiteboardCanvasWidth}
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
            value={config.LikeNumber}
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
            value={config.DislikeNumber}
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
