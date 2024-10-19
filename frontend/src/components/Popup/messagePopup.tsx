import {
  Box,
  Button,
  List,
  ListItem,
  Paper,
  Popover,
  Typography,
} from '@mui/material'
import { forwardRef, useCallback, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { appActions, useAppDispatch, useAppSelector } from '../../AppState'
import { ObjectPosIcon } from '../../assets'
import type { FilterTagType, SearchTermType } from '../../types/search'
import FilterTag from '../Filter/filterTag'
import ObjectPositionPopup from './ObjectPositionPopup'
import { FilterCategories } from '../../data/FilterCategory'

interface MessagePopupProps {
  displayedFilters: FilterTagType[]
  setDisplayedFilters: Dispatch<SetStateAction<FilterTagType[]>>
  setSearchTerms: Dispatch<SetStateAction<SearchTermType[]>>
}

// Forward ref to the root element
const MessagePopup = forwardRef<HTMLDivElement, MessagePopupProps>(
  ({ displayedFilters, setDisplayedFilters, setSearchTerms }, ref) => {
    const dispatch = useAppDispatch()
    const queryPayload = useAppSelector((state) => state.app.queryPayload)
    const setQuery = useCallback(
      (value: string) => {
        const newQueryPayload = { ...queryPayload, query: value }
        dispatch(appActions.setQueryPayload(newQueryPayload))
      },
      [dispatch, queryPayload],
    )

    const handleClearAll = () => {
      setDisplayedFilters([])
      setSearchTerms([])
      setQuery('')
      console.log(queryPayload.dataset)
    }

    const showPopup = useAppSelector((state) => state.app.isMessagePopUpOpen)

    const onIconClick = (index: number, category: string, value: any) => {
      const updatedFilters = displayedFilters.map((filter: any, i: number) => {
        if (i === index) {
          const currentStatus = filter.status
          if (currentStatus === 1) {
            setSearchTerms((prevState: SearchTermType[]) =>
              prevState.filter(
                (term: any) =>
                  term.value !== value || term.category !== category,
              ),
            )
          } else {
            setSearchTerms((prevState: SearchTermType[]) => [
              ...prevState,
              { category, value },
            ])
          }
          return { ...filter, status: currentStatus === 1 ? 0 : 1 }
        }
        return filter
      })
      setDisplayedFilters(updatedFilters)
    }

    const showObjPosPopup = useAppSelector(
      (state) => state.app.isObjPosPopUpOpen,
    )
    const setObjectPosPopup = useCallback(
      (value: boolean) => {
        dispatch(appActions.setObjPosPopUp(value))
      },
      [dispatch],
    )
    const anchorElement = useRef<HTMLDivElement | null>(null)

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      // setAnchorEl(anchorEl ? null : event.currentTarget);
      setObjectPosPopup(!showObjPosPopup)
    }

    return (
      <Paper
        ref={ref} // Forward the ref to the root element
        elevation={3}
        sx={{
          backgroundColor: 'rgb(206, 232, 255)',
          maxHeight: showPopup ? '400px' : '0px',
          width: showPopup ? '300px' : '0px',
          minHeight: showPopup ? '250px' : '0px',
          position: 'absolute',
          overflow: 'auto',
          top: '30px',
          zIndex: '200',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <Box
          zIndex="9999"
          sx={{
            width: '100%',
            position: 'sticky',
            top: 0,
            backgroundColor: 'rgb(206, 232, 255)',
          }}
        >
          <Button
            size="small"
            variant="text"
            onClick={handleClearAll}
            sx={{ textAlign: 'left' }}
          >
            Clear
          </Button>
          <Box
            sx={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              flexWrap: 'nowrap',
              alignItems: 'center',
              width: 'fit-content',
              top: '3px',
              right: '10px',
            }}
          >
            <Box
              component="img"
              src={ObjectPosIcon}
              alt="object_pos_icon"
              onClick={handleClick}
              sx={{
                marginLeft: '3px',
                marginTop: '2px',
                cursor: 'pointer',
                position: 'relative',
                width: '2rem',
                height: '2rem',
              }}
              title="Object Position Search"
              aria-describedby="objpospopup"
              ref={anchorElement}
            />

            <Popover
              id="objpospopup"
              open={showObjPosPopup}
              anchorEl={anchorElement.current}
              anchorOrigin={{
                vertical: 'center',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'center',
                horizontal: 'left',
              }}
              onClose={() => setObjectPosPopup(false)}
              slotProps={{
                paper: {
                  sx: {
                    minHeight: '250px',
                    minWidth: '470px',
                    width: 'fit-content',
                    height: 'fit-content',
                    maxWidth: '610px',
                    zIndex: 10005,
                    overflow: 'visible',
                  },
                },
              }}
            >
              <ObjectPositionPopup />
            </Popover>
          </Box>
        </Box>
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          flexWrap="wrap"
          alignContent="center"
        >
          <List>
            {displayedFilters
              .map((filter, index) => (
                <ListItem
                  key={`${filter.category}-${filter.value}-${index}`}
                  disableGutters
                  disablePadding
                >
                  <FilterTag
                    filter={filter}
                    index={index}
                    onIconClick={onIconClick}
                  />
                </ListItem>
              ))
              .reverse()}
          </List>
          <Paper
            elevation={1}
            sx={{
              backgroundColor: 'white',
              width: '80%',
              height: 'auto',
              borderRadius: '7px',
              p: 2,
              mt: 1,
              mb: 1,
            }}
          >
            <Typography variant="body2" component="div">
            {Object.values(FilterCategories).map((cat) => (
              <span key={cat.category}>
                {cat.display}
                <br />
              </span>
            ))}
          </Typography>
          </Paper>
        </Box>
      </Paper>
    )
  },
)

export default MessagePopup
