import { Box, SpeedDial, SpeedDialAction, ClickAwayListener, Popover, SpeedDialIcon, Snackbar, Backdrop, Typography } from "@mui/material";
import LoginIcon from '@mui/icons-material/Login';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import PreviewIcon from "@mui/icons-material/Preview";
import { appActions, useAppDispatch, useAppSelector } from "../AppState";
import { toast } from "react-toastify";
import { CSVPreviewPopup } from "./Popup/CSVPreviewPopup";
import React, { useState } from "react";
import EvaluationBox from "./evaluationBox";
import ImageGrid from "../containers/similarity/image-grid";

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
        if (CSVPreviewPopupOpen) setAnchorElCSV(null);
    }

    const handleLoginOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElEvaluation(event.currentTarget);
    }

    const handleLoginClose = () => {
        setAnchorElEvaluation(null);
    }

    return (
        <React.Fragment>
            <ClickAwayListener onClickAway={() => {
                setSpeedDialOpen(false);
                handlePreviewCSVClose();
                handleLoginClose();
            }}>
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
                        icon={<SpeedDialIcon sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%"}} onClick={() => setSpeedDialOpen(!speedDialOpen)} />}
                        direction="down"
                        open={speedDialOpen}
                        onMouseEnter={() => setSpeedDialOpen(true)}
                        FabProps={{ size: 'medium' }}
                        
                    >
                        <SpeedDialAction
                            icon={<FileDownloadIcon />}
                            tooltipTitle="Download CSV"
                            onClick={handleDownloadCSV}
                        />
                        <SpeedDialAction icon={<DeleteForeverRoundedIcon />} tooltipTitle="Clear CSV" onClick={() => handleClearCSV()} />
                        <SpeedDialAction icon={<PreviewIcon />} tooltipTitle="Preview CSV" onClick={(e) => handlePreviewCSVOpen(e)} />
                        <SpeedDialAction icon={<LoginIcon />} tooltipTitle="Login" onClick={(e) => handleLoginOpen(e)} />
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
                        marginThreshold={20}
                        PaperProps={{sx: {minWidth: "200px", minHeight: "50px", display: "flex", flexDirection: "column", alignItems: "center"}}}
                    >
                      {csvImages.length === 0 ? <Typography>No images to preview</Typography> :
                        <ImageGrid style={{ width: '90dvw', minHeight: '60dvw'}} data={csvImages} />
                      }
                        
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
            {/* <Backdrop open={speedDialOpen} sx={(theme) => ({ zIndex: theme.zIndex.speedDial + 1 })} /> */}
        </React.Fragment>
    );
};
