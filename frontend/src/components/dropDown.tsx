import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from '@mui/material'
import { useEffect, useState } from 'react'

interface DropdownProps {
  label: string
  displayItems: string[]
  valueItems: string[]
  setData: (value: string) => void
  value?: string
}

const Dropdown = ({
  label,
  displayItems,
  valueItems,
  setData,
  value,
}: DropdownProps) => {
  const getInitialValue = () => {
    if (value && valueItems.includes(value)) return value
    return valueItems[0]
  }

  const [currentValue, setCurrentValue] = useState<string>(getInitialValue())

  useEffect(() => {
    const nextValue = getInitialValue()
    if (nextValue !== currentValue) setCurrentValue(nextValue)
  }, [value, valueItems, currentValue])

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value as string
    const selectedIndex = valueItems.indexOf(selectedValue)
    setCurrentValue(selectedValue)
    setData(selectedValue)
  }

  return (
    <FormControl
      size="small"
      sx={{ marginTop: '0.5rem', marginRight: '0.5rem', minWidth: 120 }}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={currentValue}
        onChange={handleChange}
        label={label}
        sx={{
          textTransform: 'none',
          fontSize: '0.875rem', // Text size equivalent to text-sm
          borderRadius: '4px', // Rounded corners
        }}
      >
        {displayItems.map((displayItem, index) => (
          <MenuItem key={displayItem} value={valueItems[index]}>
            {displayItem}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default Dropdown
