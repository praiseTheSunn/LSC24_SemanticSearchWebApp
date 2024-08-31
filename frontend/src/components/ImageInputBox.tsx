import { useState, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Stack,
  Paper,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const ImageInputBox = () => {
  const [imageSrc, setImageSrc] = useState<string | ArrayBuffer | undefined>(undefined);
  const [isHover, setIsHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image paste from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardItems = e.clipboardData.items;
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type.startsWith('image')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImageSrc(e.target?.result as string | ArrayBuffer | undefined);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Handle image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string | ArrayBuffer | undefined);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image URL input
  const handleImageUrl = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      const url = (e.target as HTMLInputElement).value;
      setImageSrc(url);
    }
  };


  return (
    <Box sx={{ width: '22%', height: '100%', maxWidth: 600, zIndex: 10001, marginLeft: '20px' }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <Paper elevation={3}
        sx={{
          borderRadius: 1,
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          height: 'fit-content',
        }}
      >
        <Typography variant="caption" >Search by Image</Typography>
        <Box
          component="div"
          onPaste={handlePaste}
          sx={{
            borderRadius: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <TextField
            variant="outlined"
            fullWidth
            sx={{ height: '35px' }}
            size='small'
            label="Enter image URL and press Enter"
            onKeyDown={handleImageUrl}
            inputProps={{
              style: {
                height: "35px",
                padding: "0 10px",
              },
            }}      
          />
          <Box display="flex" alignItems="center" >
            <Typography sx={{ marginLeft: '10px', marginRight: '10px', verticalAlign: 'middle' }} variant="caption" >or</Typography>
          </Box>
          <IconButton
            color={!imageSrc ? 'primary' : 'success'}
            onClick={() => fileInputRef.current?.click()}
            sx={{ height: '35px', padding: '0' }}
          ><UploadFileIcon /></IconButton>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
      </Paper>

      {imageSrc && isHover && (
        <Box
          sx={{
            marginTop: 2,
            textAlign: 'center',
            backgroundColor: '#f0f0f0',
            padding: 2,
            borderRadius: 1,
            
          }}
        >
          <img
            src={imageSrc as string}
            alt="Uploaded"
            style={{ maxWidth: '100%', maxHeight: '400px' }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ImageInputBox;
