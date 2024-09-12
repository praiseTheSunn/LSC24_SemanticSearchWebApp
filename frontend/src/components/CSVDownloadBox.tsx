import { Box, SpeedDial, SpeedDialAction, ClickAwayListener, Popover, SpeedDialIcon, Snackbar } from "@mui/material";
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

    const toggleCSVPreviewPopup = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorElCSV(CSVPreviewPopupOpen ? null : event.currentTarget);
    }, [CSVPreviewPopupOpen]);

    const toggleEvaluationBox = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorElEvaluation(isVisible ? null : event.currentTarget);
    }, [isVisible]);

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

    const handlePreviewCSV = (event: React.MouseEvent<HTMLElement>) => {
        toggleCSVPreviewPopup(event);
    };

    const handlePreviewCSVOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElCSV(event.currentTarget);
    }

    const handlePreviewCSVClose = () => {
        console.log('close')
        setAnchorElCSV(null);
    }

    const handleLogin = (event: React.MouseEvent<HTMLElement>) => {
        toggleEvaluationBox(event);
    };

    const handleLoginOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElEvaluation(event.currentTarget);
    }

    const handleLoginClose = () => {
        setAnchorElEvaluation(null);
    }

    return (
        <ClickAwayListener onClickAway={() => {
            // setAnchorElCSV(null);
            // setAnchorElEvaluation(null);
            setSpeedDialOpen(false)
        }}>
            <Box sx={{ 
                position: 'relative',
                alignItems: 'center', 
                zIndex: '9999', 
                width: '50px'
            }}>
                <SpeedDial
                    ariaLabel="CSV actions"
                    sx={{ 
                        position: 'absolute',
                        width: '100%',
                        marginTop: '-20px',
                    }}
                    // icon={<MenuIcon />}
                    icon={<SpeedDialIcon />}
                    direction="down"
                    open={speedDialOpen}
                    // onOpen={() => setSpeedDialOpen(true)}
                    onMouseEnter={() => setSpeedDialOpen(true)}
                    onMouseLeave={() => {
                        // setSpeedDialOpen(false)
                        // handlePreviewCSVClose()
                    }}
                    // onClick={() => setSpeedDialOpen(!speedDialOpen)}
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
        </ClickAwayListener>
    );
};
