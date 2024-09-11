import { Box, Typography, SpeedDial, SpeedDialAction, ClickAwayListener } from "@mui/material";
import LoginIcon from '@mui/icons-material/Login';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import ClearIcon from "@mui/icons-material/Clear";
import PreviewIcon from "@mui/icons-material/Preview";
import { appActions, useAppDispatch, useAppSelector } from "../AppState";
import { toast } from "react-toastify";
import { CSVPreviewPopup } from "./Popup/CSVPreviewPopup";
import { useCallback } from "react";
import EvaluationBox from "./evaluationBox";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

export const CSVDownloadBox = () => {
    const csvImages = useAppSelector((state) => state.app.csvImages);
    const dispatch = useAppDispatch();

    const CSVPreviewPopupOpen = useAppSelector((state) => state.app.isCsvPreviewPopupOpen);
    const isVisible = useAppSelector((state) => state.app.isEvaluationBoxOpen);

    const toggleCSVPreviewPopup = useCallback(() => {
        const value = !CSVPreviewPopupOpen;
        dispatch(appActions.setCSVPreviewPopup(value))
      }, [CSVPreviewPopupOpen, dispatch])

    const toggleEvaluationBox = useCallback(() => {
        const value = !isVisible;
        dispatch(appActions.setEvaluationBox(value));
    }, [isVisible, dispatch]);

    const handleDownloadCSV = () => {
        if (csvImages.length > 0) {
            const csv = csvImages
                .map((image) => `${image.video_id}, ${image.frame_id}\n`)
                .join('');
            const hiddenElement = document.createElement('a');
            hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            hiddenElement.target = '_blank';
            hiddenElement.download = 'images.csv';
            hiddenElement.click();
        } else {
            toast.error('No images to download');
        }
    };

    const handleClearCSV = () => {
        dispatch(appActions.setCSVImages([]));
        toast.success('Cleared');
    };

    const handlePreviewCSV = () => {
        toggleCSVPreviewPopup();
    };

    const handleLogin = () => {
        toggleEvaluationBox();
    }

    return (
        <ClickAwayListener onClickAway={() => {
            dispatch(appActions.setCSVPreviewPopup(false))
            dispatch(appActions.setEvaluationBox(false))
        }}>
        <Box sx={{ 
            position: 'relative',
            // display: 'flex', 
            // flexDirection: 'column', 
            alignItems: 'center', 
            // padding: '9px', 
            zIndex: '9999', 
            width: '50px'
            }}>
            {/* <Typography
                variant="caption"
                sx={{ display: 'flex', fontSize: '11px', color: 'gray', opacity: '0.7', fontStyle: 'italic' }}
            >
                Shift click an image to add to csv lists
            </Typography> */}
            <SpeedDial
                ariaLabel="CSV actions"
                sx={{ 
                    position: 'absolute',
                    width: '100%',
                    marginTop: '-20px',
                }}
                icon={<MenuIcon/>} // This is the default SpeedDial icon, replace as needed
                direction="down"
            >
                <SpeedDialAction
                    icon={<FileDownloadIcon />}
                    tooltipTitle="Download CSV"
                    onClick={handleDownloadCSV}
                />
                <SpeedDialAction icon={<ClearIcon />} tooltipTitle="Clear CSV" onClick={handleClearCSV} />
                <SpeedDialAction icon={<PreviewIcon />} tooltipTitle="Preview CSV" onClick={handlePreviewCSV} />
                <SpeedDialAction icon={<LoginIcon />} tooltipTitle="Login" onClick={handleLogin} />
            </SpeedDial>

            <Box
            sx = {{
                position: 'absolute',
                right: '80px',
            }}
            >
            {CSVPreviewPopupOpen && <CSVPreviewPopup />}
            </Box>

            <Box
            sx = {{
                position: 'absolute',
                right: '100px',  
            }}
            >
            {isVisible && <EvaluationBox />}
            </Box>
            
            
        </Box>
        </ClickAwayListener>
    );
};
