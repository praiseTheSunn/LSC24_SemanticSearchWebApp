import { Box, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../AppState";
import AnImage from "../AnImage";


export const CSVPreviewPopup = () => {
    const csvImages = useAppSelector((state) => state.app.csvImages);
    const dispatch = useAppDispatch()
    
    return (
        // display all csvImages
        <Box
            sx = {{
                position: 'absolute',
                right: '10px',
                top: '100px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                zIndex: 20000,
                borderRadius: '6px',
                boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
                height: '500px',
                width: '300px',
                overflow: 'hidden',
                border: '1px solid black',
                paddingTop: '8px',
                paddingBottom: '8px',
                paddingLeft: '8px',
                paddingRight: '8px',
                alignItems: 'center',
                overflowY: "scroll",
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
        </Box>
    )
}