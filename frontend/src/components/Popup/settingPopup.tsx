import { Paper, Slider, Typography } from '@mui/material'
import type React from 'react'
import { useState } from 'react'
import { saveConfigToLocalStorage } from '..'
import { useAppDispatch, useAppSelector } from '../../AppState'
import { appActions } from '../../AppState'
import type { ConfigType } from '../../types/app'

const ConfigEditor: React.FC = () => {
  const userConfig = useAppSelector((state) => state.app.config)
  const dispatch = useAppDispatch()

  // Use local state to manage slider values
  const [config, setConfig] = useState<ConfigType>(userConfig)

  // Handle slider value changes and immediately dispatch updated values
  const handleSliderChange = (key: keyof ConfigType, value: number) => {
    const updatedConfig = {
      ...config,
      [key]: value,
    }
    setConfig(updatedConfig)
    dispatch(appActions.setConfig(updatedConfig))
    saveConfigToLocalStorage(updatedConfig) // Save updated config
    console.log('Config updated:', updatedConfig)
  }

  return (
    <Paper elevation={3} style={{ padding: '16px', margin: '16px' }}>
      <Typography gutterBottom>Image Grid Column Count</Typography>
      <Slider
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
        step={10}
        min={50}
        max={500}
        valueLabelDisplay="auto"
      />
    </Paper>
  )
}

export default ConfigEditor
