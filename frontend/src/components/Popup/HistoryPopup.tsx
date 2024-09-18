import { Box, Divider, Typography } from '@mui/material'
import {
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  List,
} from 'react-virtualized'
import type { MeasuredCellParent } from 'react-virtualized/dist/es/CellMeasurer'
import {
  appActions,
  useAppDispatch,
  useAppSelector,
  useLazyGetImagesQuery,
} from '../../AppState'
import type { SearchTermType } from '../../types/search'

const HistoryPopup = ({
  setSearchTerms,
  setDisplayedFilters,
}: {
  setSearchTerms: Dispatch<SetStateAction<SearchTermType[]>>
  setDisplayedFilters: Dispatch<SetStateAction<SearchTermType[]>>
}) => {
  const history = useAppSelector((state) => state.app.queryHistory)
  const cache = useMemo(
    () =>
      new CellMeasurerCache({
        fixedWidth: true,
        defaultHeight: 30,
      }),
    [],
  )

  const listRef = useRef<List | null>(null)

  const recomputeRowHeights = useCallback(() => {
    cache.clearAll()
    if (listRef.current) {
      listRef.current.recomputeRowHeights()
    }
  }, [])

  useEffect(() => {
    recomputeRowHeights()
  }, [history, recomputeRowHeights])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToRow(history.length - 1)
      // console.log('scrolling to row', history.length - 1)
    }
  }, [history])

  const [trigger, { data, isFetching, error }] = useLazyGetImagesQuery()
  const queryPayload = useAppSelector((state) => state.app.queryPayload)
  const dispatch = useAppDispatch()
  const setQueryPayload = (payload: any) =>
    dispatch(appActions.setQueryPayload(payload))

  const handleHistoryClick = (index: number) => {
    const historyItem = history[index]
    const [query, ...filters] = historyItem.query.split(' | ')
    const parsedQuery = query.split(': ')[1]

    setQueryPayload({
      parsedQuery,
      mode: queryPayload.mode,
      model: queryPayload.model,
    })
    setDisplayedFilters(
      historyItem.query.split(' | ').map((filter) => ({
        category: filter.split(': ')[0],
        value: filter.split(': ')[1],
        status: 1,
      })),
    )

    trigger({
      text_query: parsedQuery,
      mode: queryPayload.mode,
      model: queryPayload.model,
    }).then(() => {
      setSearchTerms(
        filters.map((filter) => ({
          category: filter.split(': ')[0],
          value: filter.split(': ')[1],
          status: 1,
        })),
      )
    })
  }

  useEffect(() => {
    if (isFetching) {
      dispatch(appActions.setLoadingPopUp('Loading history...'))
    }

    if (error) {
      console.error('Error:', error)
      dispatch(appActions.setLoadingPopUp('Error: fetching result'))
    }

    if (data && !isFetching) {
      dispatch(appActions.setLoadingPopUp(''))
      dispatch(appActions.setAppImageData(data))
      dispatch(appActions.setCacheData(data))
    }
  }, [isFetching, error, data])

  const rowRenderer = ({
    key,
    index,
    style,
    parent,
  }: {
    key: any
    index: number
    style: CSSProperties
    parent: MeasuredCellParent
  }) => {
    const newIndex = history.length - 1 - index
    const item = history[newIndex]
    return (
      <CellMeasurer
        key={key}
        cache={cache}
        parent={parent}
        index={newIndex}
        style={style}
      >
        {({ registerChild }) => (
          <Box
            ref={registerChild}
            sx={{
              ...style,
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
            }}
            onClick={() => handleHistoryClick(newIndex)}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                marginBottom: '10px',
                marginTop: '10px',
                paddingLeft: '10px',
                paddingRight: '10px',
              }}
            >
              <Box sx={{ flex: 1 }}>{item.time}</Box>
              <Box
                sx={{ flex: 4, display: 'flex', justifyContent: 'flex-end' }}
              >
                {item.query}
              </Box>
            </Box>
            <Divider />
          </Box>
        )}
      </CellMeasurer>
    )
  }

  return (
    <Box
      id="HistoryPopup"
      sx={{
        position: 'absolute',
        left: '10px',
        top: '0',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        zIndex: 20000,
        borderRadius: '6px',
        boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
        height: '500px',
        width: '500px',
        overflow: 'hidden',
        border: '1px solid black',
        paddingTop: '8px',
        paddingBottom: '8px',
      }}
    >
      <Typography paddingLeft="8px" paddingRight="8px" variant="h6">
        History
      </Typography>
      <Box sx={{ height: '100%' }}>
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              width={width}
              height={height}
              ref={listRef}
              deferredMeasurementCache={cache}
              rowHeight={cache.rowHeight}
              rowRenderer={rowRenderer}
              rowCount={history.length}
              overscanRowCount={3}
              scrollToAlignment="end"
              style={{ transition: 'transform ease-in-out 0.5s' }}
            />
          )}
        </AutoSizer>
      </Box>
    </Box>
  )
}

export default HistoryPopup
