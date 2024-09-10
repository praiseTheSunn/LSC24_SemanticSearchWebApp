import { Box, Button, Typography } from "@mui/material";
import { appActions, useAppDispatch, useAppSelector } from "../AppState";
import { toast } from "react-toastify";
import { CSVPreviewPopup } from "./Popup/CSVPreviewPopup";

export const CSVDownloadBox = () => {
    const csvImages = useAppSelector((state) => state.app.csvImages);
    const dispatch = useAppDispatch()

    const CSVPreviewPopupOpen = useAppSelector((state) => state.app.csvPreviewPopupOpen)

    return (
    <Box
    sx={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '9px'}} >
        {/* <Text>Shift click an image to add to csv lists</Text> */}
        <Typography variant="caption" sx={{display: 'flex', fontSize: '11px', color: 'gray', opacity: '0.7', fontStyle: 'italic'}}>Shift click an image to add to csv lists</Typography>
        <Box
        sx = {{border: '1px solid #636262', borderRadius: '5px', display: 'flex', flexDirection: 'row'}}
        >
            <Button
            sx = {{whiteSpace: 'nowrap'}}
            onClick={() => {
                // creating a csv file
                if (csvImages.length > 0) {
                    const csv = csvImages.map((image) => {
                    return `${image.video_id}, ${image.frame_id}\n`
                    }).join('');
                    const hiddenElement = document.createElement('a');
                    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
                    hiddenElement.target = '_blank';
                    hiddenElement.download = 'images.csv';
                    hiddenElement.click();
                }
                else {
                    // alert('No images to download')
                    toast.error('No images to download')
                }
            }}
            >
            Download CSV
            </Button>
            <Button
            sx = {{}}
            onClick={() => {
                // clear csvImages
                dispatch(appActions.setCSVImages([]))
                // alert('Cleared')
                toast.success('Cleared')
            }}
            >
            Clear
            </Button>
            <Button
            onClick={() => {
                console.log('Preview clicked')
                console.log(CSVPreviewPopupOpen)
                dispatch(appActions.toggleCSVPreviewPopup())
            }
            }
            >
                Preview
            </Button>
            
        </Box>
        {CSVPreviewPopupOpen && <CSVPreviewPopup />}
      </Box>
    )
}