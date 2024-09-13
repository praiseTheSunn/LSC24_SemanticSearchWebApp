import { Box, SpeedDial, SpeedDialAction, ClickAwayListener, Popover, SpeedDialIcon, Snackbar, Backdrop } from "@mui/material";
import LoginIcon from '@mui/icons-material/Login';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ClearIcon from "@mui/icons-material/Clear";
import PreviewIcon from "@mui/icons-material/Preview";
import { appActions, useAppDispatch, useAppSelector } from "../AppState";
import { toast } from "react-toastify";
import { CSVPreviewPopup } from "./Popup/CSVPreviewPopup";
import { useCallback, useState } from "react";
import EvaluationBox from "./evaluationBox";
import MenuIcon from '@mui/icons-material/Menu';

export const CSVDownloadBox = () => {
    const csvImages = useAppSelector((state) => state.app.csvImages);
    const dispatch = useAppDispatch();

    const [anchorElCSV, setAnchorElCSV] = useState<HTMLElement | null>(null);
    const [anchorElEvaluation, setAnchorElEvaluation] = useState<HTMLElement | null>(null);
    const [speedDialOpen, setSpeedDialOpen] = useState(false); // New state for SpeedDial open
    const CSVPreviewPopupOpen = Boolean(anchorElCSV);
    const isVisible = Boolean(anchorElEvaluation);

    const handleDownloadCSV = () => {
        if (csvImages.length > 0) {
            const csv = csvImages
                .map((image) => `${image.video_id}, ${image.frame_id}\n`)
                .join('');
            const hiddenElement = document.createElement('a');
            hiddenElement.href = `data:text/csv;charset=utf-8,${encodeURI(csv)}`;
            hiddenElement.target = '_blank';
            hiddenElement.download = 'images.csv';
            hiddenElement.click();
        } else {
            toast.error('No images to download', {
                position: "bottom-left"
              });
              
            
        }
    };

    const handleClearCSV = () => {
        dispatch(appActions.setCSVImages([]));
        toast.success('Cleared', {
            position: "bottom-left"
        });
    };

    const handlePreviewCSVOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElCSV(event.currentTarget);
    }

    const handlePreviewCSVClose = () => {
        console.log('close')
        setAnchorElCSV(null);
    }

    const handleLoginOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElEvaluation(event.currentTarget);
    }

    const handleLoginClose = () => {
        setAnchorElEvaluation(null);
    }

    return (
        <Box sx={{ 
                position: 'relative',
                alignItems: 'flex-start', 
                width: '50px',
                height: "100%",
                display: 'flex',
            }}>
                <SpeedDial
                    ariaLabel="CSV actions"
                    sx={{ 
                        position: 'absolute',
                        zIndex: 10000
                    }}
                    icon={<SpeedDialIcon />}
                    direction="down"
                    open={speedDialOpen}
                    onMouseEnter={() => setSpeedDialOpen(true)}
                    onClick={() => setSpeedDialOpen(!speedDialOpen)}
                    FabProps={{ size: 'medium' }}
                    
                >
                    <SpeedDialAction
                        icon={<FileDownloadIcon />}
                        tooltipTitle="Download CSV"
                        onClick={handleDownloadCSV}
                    />
                    <SpeedDialAction icon={<ClearIcon />} tooltipTitle="Clear CSV" onClick={handleClearCSV} />
                    <SpeedDialAction icon={<PreviewIcon />} tooltipTitle="Preview CSV" onMouseEnter={handlePreviewCSVOpen} />
                    <SpeedDialAction icon={<LoginIcon />} tooltipTitle="Login" onMouseEnter={handleLoginOpen} />
                </SpeedDial>

                <Popover
                    open={CSVPreviewPopupOpen}
                    anchorEl={anchorElCSV}
                    onClose={handlePreviewCSVClose}
                    anchorOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'center',
                        horizontal: 'right',
                    }}
                >
                    <CSVPreviewPopup />
                </Popover>

                <Popover
                    open={isVisible}
                    anchorEl={anchorElEvaluation}
                    onClose={handleLoginClose}
                    anchorOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'center',
                        horizontal: 'right',
                    }}
                >
                    <EvaluationBox />
                </Popover>
            </Box>
    );
};
