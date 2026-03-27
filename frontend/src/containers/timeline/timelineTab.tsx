import React, {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAppDispatch, useAppSelector } from '../../AppState'

import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box, FormControl, IconButton, MenuItem, Select, Typography } from '@mui/material'
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  List,
  type ListRowProps,
  type ListRowRenderer,
} from 'react-virtualized'
import {
  ActivityIcon,
  ActivityIconActive,
  LocationIcon,
  LocationIconActive,
} from '../../assets'
import ImageGroup from '../../components/Image/imageGroup'
import ImageSingle from '../../components/Image/imageSingle'
import KhangScrollBar from '../../components/KhangScrollBar'
import ActivityBar from '../../components/activityBar'
import type {
  ImageRecord,
  TimelineTabActivityAllData,
  TimelineTabActivityData,
  TimelineTabLocationAllData,
  TimelineTabLocationData,
} from '../../types/image'

type JumpGroup = {
  key: string
  label: string
  firstIndex: number
  firstDate: string
}

const normalizeDateKey = (dateLike: unknown): string => {
  if (dateLike instanceof Date) {
    return dateLike.toISOString().slice(0, 10)
  }

  if (typeof dateLike === 'string') {
    if (dateLike.length === 0) return ''
    return dateLike.includes('T') ? dateLike.slice(0, 10) : dateLike
  }

  if (typeof dateLike === 'number' && Number.isFinite(dateLike)) {
    // Keep numeric values as-is to avoid accidental epoch conversion (1970-01-01).
    // Some datasets use numeric day/date identifiers, not Unix timestamps.
    return String(dateLike)
  }

  return ''
}

const toChronologicalValue = (dateKey: string): number => {
  if (!dateKey) return Number.NaN

  // Numeric-like date keys (e.g., day indices) should sort numerically.
  if (/^\d+(\.\d+)?$/.test(dateKey)) {
    return Number(dateKey)
  }

  // Try direct parsing first (handles most ISO variants).
  const direct = new Date(dateKey)
  if (!Number.isNaN(direct.getTime())) {
    return direct.getTime()
  }

  // Then try date-only format explicitly.
  const dateOnly = new Date(`${dateKey}T00:00:00`)
  if (!Number.isNaN(dateOnly.getTime())) {
    return dateOnly.getTime()
  }

  return Number.NaN
}

const compareDateKeysChronologically = (a: string, b: string): number => {
  const av = toChronologicalValue(a)
  const bv = toChronologicalValue(b)

  const aValid = Number.isFinite(av)
  const bValid = Number.isFinite(bv)

  if (aValid && bValid) {
    return av - bv
  }
  if (aValid) return -1
  if (bValid) return 1

  // Stable fallback for non-parseable mixed keys.
  return a.localeCompare(b)
}

const getISOWeek = (dateInput: Date): { year: number; week: number } => {
  const date = new Date(Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)

  return { year: date.getUTCFullYear(), week }
}

const monthLabel = (date: string): string => {
  const normalized = normalizeDateKey(date)
  if (!normalized) return 'Unknown month'
  const d = new Date(`${normalized}T00:00:00`)
  if (Number.isNaN(d.getTime())) return normalized
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

const weekLabel = (date: string): string => {
  const normalized = normalizeDateKey(date)
  if (!normalized) return 'Unknown week'
  const d = new Date(`${normalized}T00:00:00`)
  if (Number.isNaN(d.getTime())) return normalized
  const { year, week } = getISOWeek(d)
  return `${year}-W${String(week).padStart(2, '0')}`
}

const buildJumpGroups = (
  sortedDates: string[],
  keyOf: (date: string) => string,
  labelOf: (date: string) => string,
): JumpGroup[] => {
  const groups: JumpGroup[] = []
  const seen = new Set<string>()

  sortedDates.forEach((date, index) => {
    const safeDate = normalizeDateKey(date)
    if (!safeDate) return

    const key = keyOf(safeDate)
    if (seen.has(key)) return
    seen.add(key)
    groups.push({
      key,
      label: labelOf(safeDate),
      firstIndex: index,
      firstDate: safeDate,
    })
  })

  return groups
}

const TimelineTab = () => {
  const data = useAppSelector((state) => state.app.data)

  const [rowModes, setRowModes] = useState<number[]>([1]) // 0 location, 1 activity
  const [holdActive, setHoldActive] = useState(false) // State to track whether the button is held down
  const [holdTimer, setHoldTimer] = useState<
    string | number | ReturnType<typeof setTimeout> | undefined
  >(undefined)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [inHoldMode, setInHoldMode] = useState(false)
  const [dates, setDates] = useState<string[]>([])
  const [selectedActivityIDs, setSelectedActivityIDs] = useState<
    (number | null | string)[]
  >([])
  const [locationBasedData, setLocationBasedData] =
    useState<TimelineTabLocationAllData | null>(null)
  const [activityBasedData, setActivityBasedData] =
    useState<TimelineTabActivityAllData | null>(null)

  const selectedDateIndex = useMemo(() => {
    if (!selectedDate) return -1
    return dates.indexOf(selectedDate)
  }, [dates, selectedDate])

  const monthGroups = useMemo(
    () => buildJumpGroups(dates, (date) => normalizeDateKey(date).slice(0, 7), monthLabel),
    [dates],
  )

  const weekGroups = useMemo(
    () => buildJumpGroups(dates, weekLabel, weekLabel),
    [dates],
  )

  useEffect(() => {
    const initialSelectedActivityIDs = dates.map(() => null)
    setSelectedActivityIDs(initialSelectedActivityIDs)
  }, [dates])
  const listRef = useRef<List | null>(null)

  const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 258,
  })

  // Handler for mouse down event
  const handleMouseDown = () => {
    setHoldActive(true)

    const timer = setTimeout(() => {
      doClickAndHoldAction()
    }, 500)

    setHoldTimer(timer)
  }

  // Handler for mouse up event
  const handleMouseUp = () => {
    clearTimeout(holdTimer)
    setHoldActive(false)
  }

  // Handler for mouse leave event
  const handleMouseLeave = () => {
    clearTimeout(holdTimer)
    setHoldActive(false)
  }

  // Function to perform when click and hold is triggered
  const doClickAndHoldAction = () => {
    setInHoldMode(true)
  }

  const stepDay = useCallback(
    (direction: -1 | 1) => {
      if (dates.length === 0) return

      const currentIndex = selectedDateIndex >= 0 ? selectedDateIndex : 0
      const nextIndex = Math.min(dates.length - 1, Math.max(0, currentIndex + direction))
      setSelectedDate(dates[nextIndex])
    },
    [dates, selectedDateIndex],
  )

  const jumpToGroup = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  useEffect(() => {
    // Parse data into location-based and activity-based data
    const locationDataMap = new Map() // Type: TimelineTabLocationAllData = Map<string, TimelineTabLocationData[]>
    const activityDataMap = new Map() // Type: TimelineTabActivityAllData = Map<string, TimelineTabActivityData[]>

    for (const item of data) {
      const dateKey = normalizeDateKey(item.date)
      if (!dateKey) continue

      // Location-based data
      if (!locationDataMap.has(dateKey)) {
        locationDataMap.set(dateKey, [])
      }
      const locationRowData = locationDataMap.get(dateKey)
      if (
        !locationRowData.some(
          (data: any) => data.location_id === item.location_id,
        )
      ) {
        locationRowData.push({ location_id: item.location_id, images: [item] })
      } else {
        const existingLocation = locationRowData.find(
          (data: any) => data.location_id === item.location_id,
        )
        existingLocation.images.push(item)
      }

      // Activity-based data
      if (!activityDataMap.has(dateKey)) {
        activityDataMap.set(dateKey, [])
      }
      const activityData = activityDataMap.get(dateKey)
      if (
        !activityData.some((data: any) => data.activity === item.activity)
      ) {
        activityData.push({
          activity: item.activity,
          images: [item],
        })
      } else {
        const existingActivity = activityData.find(
          (data: any) => data.activity === item.activity,
        )
        existingActivity.images.push(item)
      }
    }

    // Sort location_id and activity_id ascending in each date of the map
    locationDataMap.forEach((value, key) => {
      value.sort(
        (a: ImageRecord, b: ImageRecord) => a.location_id - b.location_id,
      )
    })
    activityDataMap.forEach((value, key) => {
      value.sort(
        (a: ImageRecord, b: ImageRecord) => String(a.activity).localeCompare(String(b.activity)),
      )
    })
    // Update state
    setLocationBasedData(locationDataMap)
    setActivityBasedData(activityDataMap)

    // Sort dates ascending
    const dates = Array.from(locationDataMap.keys()).sort(compareDateKeysChronologically)
    setDates(dates)

    const initialRowMode = dates.map(() => 1)
    setRowModes(initialRowMode)

    if (dates.length > 0) {
      setSelectedDate((prev) => prev ?? dates[0])
    }
  }, [data])

  const recomputeRowHeights = useCallback(() => {
    cache.clearAll()
    if (listRef.current) {
      listRef.current.recomputeRowHeights()
    }
  }, [cache])

  useEffect(() => {
    recomputeRowHeights()
  }, [locationBasedData, activityBasedData])

  // useEffect(() => {
  //   window.addEventListener('resize', recomputeRowHeights);
  //   return () => {
  //       window.removeEventListener('resize', recomputeRowHeights);
  //   };
  // }, []);

  useEffect(() => {
    if (selectedDate && listRef.current) {
      const rowIndex = dates.indexOf(selectedDate)
      if (rowIndex !== -1) {
        listRef.current.scrollToRow(rowIndex)
        // console.log('ref', listRef.current);
      }
    }
  }, [selectedDate])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        stepDay(-1)
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        stepDay(1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [stepDay])

  const handleChangeRowModes = (rowIndex: number) => {
    const newRowModes = [...rowModes]
    newRowModes[rowIndex] = newRowModes[rowIndex] === 0 ? 1 : 0
    setRowModes(newRowModes)
  }

  const renderRow: ListRowRenderer = ({
    index,
    key,
    style,
    parent,
    isScrolling,
  }: ListRowProps) => {
    const rowIndex = index
    const currentDate = dates[rowIndex]
    const locationRowData: any = locationBasedData?.get(currentDate) || []
    const activityRowData: any = activityBasedData?.get(currentDate) || []

    const selectedActivityID = selectedActivityIDs[rowIndex]
    const filteredActivityData = selectedActivityID
      ? activityRowData.filter(
          (item: any) => item.activity === selectedActivityID,
        )
      : activityRowData

    activityRowData.sort(
      (a: any, b: any) =>
        Math.min(
          a.images.map((img: any) => (Object.values(img)[0] as any).time),
        ) -
        Math.min(
          b.images.map((img: any) => (Object.values(img)[0] as any).time),
        ),
    )

    return (
      <CellMeasurer
        key={key}
        cache={cache}
        parent={parent}
        columnIndex={0}
        rowIndex={rowIndex}
      >
        {({ registerChild }) => (
          <Box
            ref={registerChild}
            display="flex"
            flexDirection="row"
            position="relative"
            sx={style}
          >
            <Box
              sx={{
                width: '25px',
                height: '25px',
                backgroundColor: 'black',
                borderRadius: '9999px',
                mr: '28px',
                zIndex: 10,
              }}
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                mb: '16px',
                position: 'relative',
                width: '96%',
                minHeight: '100px',
                boxShadow: '0px 2px #D7D7D7',
                borderRadius: '10px',
                transition: 'width 0.5s',
              }}
            >
              <Box
                sx={{ width: '100%', display: 'flex', flexDirection: 'row' }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '22px',
                    minWidth: '200px',
                  }}
                >
                  {currentDate}
                </Typography>
                <Box
                  src={
                    rowModes[rowIndex] === 1 ? LocationIcon : LocationIconActive
                  }
                  component="img"
                  onClick={() => handleChangeRowModes(rowIndex)}
                  sx={{ marginRight: '10px', cursor: 'pointer' }}
                />
                <Box
                  src={
                    rowModes[rowIndex] === 0 ? ActivityIcon : ActivityIconActive
                  }
                  component="img"
                  onClick={() => handleChangeRowModes(rowIndex)}
                  sx={{ marginRight: '10px', cursor: 'pointer' }}
                />

                <ActivityBar
                  rowData={activityRowData}
                  visibility={rowModes[rowIndex] === 1 ? 'visible' : 'hidden'}
                  onActivitySelect={(activity) => {
                    const newSelectedActivityIDs = [...selectedActivityIDs]
                    newSelectedActivityIDs[rowIndex] = activity
                    setSelectedActivityIDs(newSelectedActivityIDs)
                  }}
                />
              </Box>

              {rowModes[rowIndex] === 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: '8px',
                    position: 'relative',
                    marginBottom: '12px',
                    marginLeft: '8px',
                  }}
                >
                  {locationRowData.map(
                    (
                      locationItem: TimelineTabLocationData,
                      listIndex: number,
                    ) => (
                      <Box
                        key={`${
                          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          listIndex
                        }`}
                        sx={{ width: '170px', height: '230px' }}
                      >
                        <ImageGroup
                          sortType={1}
                          images={locationItem.images}
                          title={locationItem.images[0].location}
                        />
                      </Box>
                    ),
                  )}
                </Box>
              )}

              {rowModes[rowIndex] === 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: '8px',
                    position: 'relative',
                    marginBottom: '12px',
                    marginLeft: '8px',
                  }}
                >
                  <Box
                      display="flex"
                      flexDirection="row"
                      flexWrap="wrap"
                      gap="8px"
                    >
                      {filteredActivityData.map(
                        (
                          activityItem: TimelineTabActivityData,
                          listIndex: number,
                        ) => (
                          <Box
                            key={`${
                              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                              listIndex
                            }`}
                            sx={{ width: '170px', height: '230px' }}
                          >
                            <ImageGroup
                              images={activityItem.images}
                              title={activityItem.images[0].activity}
                              sortType={1}
                            />
                          </Box>
                        ),
                      )}
                    </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </CellMeasurer>
    )
  }

  useEffect(() => {
    setInHoldMode(false)
  }, [selectedDate])

  return (
    <Box
      sx={{
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 'calc(100% - 16px)',
          marginRight: 0,
          marginLeft: 0,
          paddingTop: '16px',
          paddingBottom: 0,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 0.75,
            mb: 1,
            ml: 4,
            mr: 1,
            p: 0.75,
            borderRadius: 1.5,
            bgcolor: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(2px)',
            border: '1px solid #e5e7eb',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#4b5563', fontWeight: 700 }}>
              Day navigator
            </Typography>
            <IconButton
              size="small"
              onClick={() => stepDay(-1)}
              disabled={dates.length === 0 || selectedDateIndex <= 0}
            >
              <ChevronLeftRoundedIcon fontSize="small" />
            </IconButton>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <Select
                value={selectedDate ?? ''}
                displayEmpty
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedDate(value ? String(value) : null)
                }}
              >
                {dates.map((date) => (
                  <MenuItem key={date} value={date}>
                    {date}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              size="small"
              onClick={() => stepDay(1)}
              disabled={dates.length === 0 || selectedDateIndex === -1 || selectedDateIndex >= dates.length - 1}
            >
              <ChevronRightRoundedIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ color: '#6b7280', ml: 'auto' }}>
              Alt + Left/Right
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: '#6b7280', flexShrink: 0 }}>
              Month
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                overflowX: 'auto',
                pb: 0.25,
                minWidth: 0,
                '&::-webkit-scrollbar': { height: '6px' },
              }}
            >
              {monthGroups.map((group) => {
                const isActive = selectedDate?.startsWith(group.key)
                return (
                  <Box
                    key={group.key}
                    component="button"
                    onClick={() => jumpToGroup(group.firstDate)}
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: isActive ? '#2563eb' : '#d1d5db',
                      backgroundColor: isActive ? '#dbeafe' : '#ffffff',
                      color: isActive ? '#1d4ed8' : '#374151',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {group.label}
                  </Box>
                )
              })}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: '#6b7280', flexShrink: 0 }}>
              Week
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                overflowX: 'auto',
                pb: 0.25,
                minWidth: 0,
                '&::-webkit-scrollbar': { height: '6px' },
              }}
            >
              {weekGroups.map((group) => {
                const groupEnd = dates[Math.min(group.firstIndex + 6, dates.length - 1)]
                const isActive = !!selectedDate && selectedDate >= group.firstDate && selectedDate <= groupEnd
                return (
                  <Box
                    key={group.key}
                    component="button"
                    onClick={() => jumpToGroup(group.firstDate)}
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: isActive ? '#7c3aed' : '#d1d5db',
                      backgroundColor: isActive ? '#ede9fe' : '#ffffff',
                      color: isActive ? '#6d28d9' : '#374151',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {group.label}
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>

        {inHoldMode && (
          <Box
            sx={{
              backgroundColor: 'white',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.95,
              width: '100%',
              height: '100%',
              zIndex: 20,
              paddingLeft: '0.7%',
            }}
            onClick={() => setInHoldMode(false)}
          >
            <KhangScrollBar dates={dates} setSelectedDate={setSelectedDate} />
          </Box>
        )}
        <Box
          sx={{
            backgroundColor: 'black',
            width: '6px',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: '0.7%',
            zIndex: 10,
            '&:hover': {
              cursor: 'pointer',
            },
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              width={width}
              height={height}
              ref={listRef}
              deferredMeasurementCache={cache}
              rowHeight={cache.rowHeight}
              rowRenderer={renderRow}
              rowCount={dates.length}
              overscanRowCount={3}
              scrollToAlignment="center"
              style={{ transition: 'transform ease-in-out 0.5s' }}
            />
          )}
        </AutoSizer>
      </Box>
    </Box>
  )
}

export default TimelineTab
