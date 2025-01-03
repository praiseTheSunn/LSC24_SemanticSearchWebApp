import { Box } from '@mui/material'
import { MVKImages } from '../../data/MVKImages'
import { FixedSizeGrid as Grid } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { pad } from 'lodash'
import { Margin } from '@mui/icons-material'
import bodyPartToIndex from '../../data/JointMapping'


// Create a DictionaryPopup component to show the images by grid view. Given that the images is from MVKImages, which is 1 cell 1 image.

const DictionaryPopup = () => {
    const columnCount = 5
    const rowCount = Math.ceil(MVKImages.length / columnCount)
    const cellHeight = 150
    const cellWidth = 200
    const columnWidth = 200
    const rowHeight = 200

    const Cell = ({ columnIndex, rowIndex, style }: {
        columnIndex: number
        rowIndex: number
        style: React.CSSProperties
    }) => {
        const index = rowIndex * columnCount + columnIndex
        if (index >= MVKImages.length) return null

        const data = MVKImages[index]
        return (
            <Box sx={{
                ...style,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'white',
                // margin: '100px',
            }}>
                {/* <img src={data.source} alt={data.name} style={{ width: '80%', alignItems: 'center', justifyContent: 'center', display: 'flex' }} /> */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        overflow: 'hidden',
                        borderRadius: '6px',
                        boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
                        margin: '5px',
                        backgroundColor: 'lightgray',
                    }}
                >
                    <img src={data.source} alt={data.name} style={{ width: '80%' }} />
                </Box>
                <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '20%', fontSize: '18px', fontWeight: 'bold' }}>
                    {data.name}
                </Box>
            </Box>
        )
    }

    return (
        <Box sx={{
            zIndex: '99999',
            position: 'fixed',
            width: '80%',
            height: '90%',
            top: '5%',
            left: '10%',
            backgroundColor: 'rgb(255, 255, 255)',
            display: 'inline-block',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            borderRadius: '6px',
            boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
        }}>
            <Box sx={{
                position: 'flex',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <h1 style={{marginTop: '15px', marginBottom: '-3    px'}}>Dictionary</h1>
            </Box>
            <AutoSizer>
                {({ height, width }) => {
                    const columnWidth = width / columnCount - 1.5
                    const rowHeight = cellHeight + 10 // Making rows square by setting row height equal to column width
                    const rowCount = Math.ceil(MVKImages.length / columnCount)

                    return (
                        <Grid
                            columnCount={columnCount}
                            columnWidth={columnWidth}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={rowHeight}
                            width={width}
                            overscanRowCount={7}
                            style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}
                        >
                            {Cell}
                        </Grid>
                    )
                }}
            </AutoSizer>
        </Box>
    )

}

export default DictionaryPopup