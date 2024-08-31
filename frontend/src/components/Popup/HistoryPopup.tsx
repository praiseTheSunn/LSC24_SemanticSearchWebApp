import { Box, Divider, Typography } from "@mui/material";
import { useAppSelector } from "../../AppState";
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from "react-virtualized";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef } from "react";
import type { MeasuredCellParent } from "react-virtualized/dist/es/CellMeasurer";
import { time } from "console";

const HistoryPopup = () => {

  // const history = useAppSelector(state => state.app.queryHistory);
  const history = [
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test querytest querytest querytest querytest querytest querytest querytest querytest query'},
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test query'},
    {time  : '10:10:10', query: 'test query'},
  ];
  const cache = useMemo(() => new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 30
  }), [])

  const listRef = useRef<List | null>(null);

  const recomputeRowHeights = useCallback(() => {
    cache.clearAll();
    if(listRef.current){
      console.log('recomputeRowHeights', listRef.current);
      listRef.current.recomputeRowHeights();
    }
  }, []);

  useEffect(() => {
    recomputeRowHeights();
  }, [history, recomputeRowHeights]);

  const rowRenderer = ({ key, index, style, parent }: { key: any, index: number, style: CSSProperties, parent: MeasuredCellParent }) => {
    const item = history[index];
    return (
      <CellMeasurer
        key={key}
        cache={cache}
        parent={parent}
        columnIndex={0}
        rowIndex={index}
      >
        {({registerChild}) => (
          <Box ref={registerChild} sx={{...style, display: 'flex', flexDirection: 'column', cursor: 'pointer'}}>
            <Box  sx={{ display: 'flex', flexDirection: 'row', marginBottom: '10px', marginTop: '10px', paddingLeft: '10px', paddingRight: '10px'}}>
              <Box sx={{flex: 1}}>{item.time}</Box>
              <Box sx={{flex: 4, display: 'flex', justifyContent: 'flex-end'}}>{item.query}</Box>
            </Box>
            <Divider />
          </Box>
        )}
      </CellMeasurer>
    );
  };
  
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
        zIndex: 10000,
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
      <Typography paddingLeft="8px" paddingRight="8px" variant="h6">History</Typography>
      <Box sx={{height: '100%'}}>
        <AutoSizer>
          {( {height, width} : {height: number, width: number}) => (
            <List
              width={width}
              height={height}
              ref={listRef}
              deferredMeasurementCache={cache}
              rowHeight={cache.rowHeight}
              rowRenderer={rowRenderer}
              rowCount={history.length}
              overscanRowCount={3}
              scrollToAlignment="center"
              style={{ transition: 'transform ease-in-out 0.5s' }}
            />
          )}
        </AutoSizer>
      </Box>
    </Box>
  );
};

export default HistoryPopup;
