import { Box, Paper, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../AppState";
import AnImage from "../AnImage";


export const CSVPreviewPopup = () => {
    const csvImages = useAppSelector((state) => state.app.csvImages);
    const dispatch = useAppDispatch()
    
    return (
        // display all csvImages
        <Paper
        elevation={4}
            sx = {{
                maxHeight: '800px',
                width: '600px',
                position: 'relative',
                // right: '300px',
                // top: '300px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                zIndex: 20000,
                borderRadius: 2,

                overflow: 'hidden',
                // border: '1px solid black',
                // paddingTop: '8px',
                // paddingBottom: '8px',
                // paddingLeft: '8px',
                // paddingRight: '8px',
                alignItems: 'center',
                overflowY: "scroll",

                p: 2,
            }}
        >
            {csvImages.length === 0 && <Typography>No images to preview</Typography>}
            {csvImages.map((image) => {
                return (
                    <Box 
                        sx = {{
                            width: '100%',
                            marginBottom: '8px',
                        }}
                    key={image.img_link}>
                        {/* <Typography>{image.video_id}, {image.frame_id}</Typography> */}
                        <AnImage data={image} />
                    </Box>
                )
            })}
        </Paper>
    )
}