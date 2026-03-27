import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, IconButton, Paper, Typography } from '@mui/material'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import AnImage from '../../components/AnImage'
import type { MapCenter, MapCluster } from '../../components/geomanControl'

const CLUSTER_CARD_ROW_HEIGHT = 180
const CLUSTER_CARD_GRID_GAP = 8

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }

  return `${(meters / 1000).toFixed(2)} km`
}

const getDateTimeLabel = (img: { date?: string; time?: string }): string => {
  const date = img.date ?? ''
  const time = img.time ?? ''

  if (date && time) return `${date} ${time}`
  if (date) return date
  if (time) return time
  return 'Unknown time'
}

interface LocationTimelineProps {
  clusters: MapCluster[]
  mapCenter: MapCenter
}

const LocationTimeline: FC<LocationTimelineProps> = ({ clusters, mapCenter }) => {
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({})

  const sortedClusters = useMemo(
    () =>
      [...clusters].sort((a, b) => a.distanceToCenterMeters - b.distanceToCenterMeters),
    [clusters],
  )

  const toggleClusterExpanded = (clusterKey: string) => {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterKey]: !prev[clusterKey],
    }))
  }

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        pr: 1,
      }}
    >
      <Box sx={{ mb: 1.5, px: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
          Map center: {mapCenter.lat.toFixed(5)}, {mapCenter.lng.toFixed(5)}
        </Typography>
        <Typography variant="caption" sx={{ color: '#4b5563' }}>
          Clusters sorted by increasing distance to map center.
        </Typography>
      </Box>

      {sortedClusters.length === 0 && (
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            No geotagged images available for the current map filter.
          </Typography>
        </Paper>
      )}

      {sortedClusters.map((cluster) => {
        const images = [...cluster.images].sort((a, b) => {
          const dateA = `${a.date ?? ''} ${a.time ?? ''}`
          const dateB = `${b.date ?? ''} ${b.time ?? ''}`
          return dateA.localeCompare(dateB)
        })
        const isExpanded = expandedClusters[cluster.key] ?? false
        const shouldShowToggle = images.length > 1
        const collapsedMaxHeight = CLUSTER_CARD_ROW_HEIGHT * 2 + CLUSTER_CARD_GRID_GAP

        return (
          <Paper
            key={cluster.key}
            elevation={2}
            sx={{
              mb: 2,
              p: 1,
              borderRadius: 2,
              border: cluster.isClosestToCenter
                ? '2px solid #f59e0b'
                : '1px solid #e5e7eb',
              backgroundColor: cluster.isClosestToCenter ? '#fffbeb' : '#ffffff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
                gap: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: '#111827',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                title={cluster.locationLabel}
              >
                {cluster.isClosestToCenter ? '◎ ' : ''}
                {cluster.locationLabel}
              </Typography>
              <Typography variant="caption" sx={{ color: '#374151', flexShrink: 0 }}>
                {formatDistance(cluster.distanceToCenterMeters)}
              </Typography>
            </Box>

            {shouldShowToggle && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => toggleClusterExpanded(cluster.key)}
                  sx={{
                    color: '#374151',
                    display: 'inline-flex',
                    gap: 0.5,
                    borderRadius: 1,
                    px: 0.5,
                    py: 0.25,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </Typography>
                  <ExpandMoreIcon
                    sx={{
                      fontSize: 16,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </IconButton>
              </Box>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gridAutoRows: `${CLUSTER_CARD_ROW_HEIGHT}px`,
                gap: 1,
                overflow: isExpanded ? 'visible' : 'hidden',
                maxHeight: isExpanded ? 'none' : `${collapsedMaxHeight}px`,
                transition: 'max-height 0.2s ease',
              }}
            >
              {images.map((img) => (
                <Paper
                  key={`${cluster.key}-${img.record_id ?? img.img_link}`}
                  elevation={1}
                  sx={{
                    p: 0.5,
                    borderRadius: 1.5,
                    border: '1px solid #e5e7eb',
                    height: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <Box
                    sx={{
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 0.5,
                    }}
                  >
                    <AnImage
                      data={img}
                      isDisplayTooltip={false}
                      isZoomOnHover={false}
                      allowFeedback={false}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      color: '#374151',
                      fontWeight: 600,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                    title={getDateTimeLabel(img)}
                  >
                    {getDateTimeLabel(img)}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Paper>
        )
      })}
    </Box>
  )
}

export default LocationTimeline
