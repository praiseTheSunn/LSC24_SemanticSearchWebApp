import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import {
  appActions,
  useAppDispatch,
  useAppSelector,
  useLazySearchByImageQuery,
} from '../AppState'

const ImageInputBox = () => {
  const [imageSrc, setImageSrc] = useState<string | ArrayBuffer | undefined>(
    undefined,
  )
  const [isHover, setIsHover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image paste from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardItems = e.clipboardData.items
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i]
      if (item.type.startsWith('image')) {
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setImageSrc(e.target?.result as string | ArrayBuffer | undefined)
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  // Handle image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string | ArrayBuffer | undefined)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle image URL input
  const handleImageUrl = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      const url = (e.target as HTMLInputElement).value
      setImageSrc(url)
    }
  }

  const model = useAppSelector((state) => state.app.queryPayload.model)
  const dispatch = useAppDispatch()
  const [trigger, { data, error, isFetching }] = useLazySearchByImageQuery()
  // const fixBase64Padding = (base64: string): string => {
  //   let modifiedBase64 = base64;
  //   while (modifiedBase64.length % 4 !== 0) {
  //     modifiedBase64 += '=';
  //   }
  //   return modifiedBase64;
  // };

  // useEffect(() => {
  //   if (imageSrc) {
  //     let sendData = imageSrc;
  //     if (typeof imageSrc === 'string' && imageSrc.startsWith('data:image/')) {
  //       const [metadata, base64Data] = imageSrc.split(',');
  //       const fixedBase64Data = fixBase64Padding(base64Data);
  //       sendData = `${metadata},${fixedBase64Data}`;
  //     } else {
  //       console.error('imageSrc is not in the correct base64 format:', imageSrc);
  //     }
  //     trigger({image_base64: sendData, model});
  //   }
  // }, [imageSrc]);

  useEffect(() => {
    if (imageSrc) {
      trigger({ image_base64: imageSrc, model })
    }
  }, [imageSrc])

  useEffect(() => {
    if (isFetching) {
      dispatch(appActions.setLoadingPopUp('Fetching similar images...'))
    }

    if (error) {
      console.error('Error:', error)
      dispatch(appActions.setLoadingPopUp('Error: fetching result'))
    }

    if (data && !isFetching) {
      dispatch(appActions.setLoadingPopUp(''))
      dispatch(appActions.setAppImageData(data))
    }
  }, [isFetching, error, data])

  return (
    <Box
      sx={{
        width: '22%',
        height: '100%',
        maxWidth: 600,
        zIndex: 99,
        marginLeft: '20px',
      }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <Paper
        elevation={3}
        sx={{
          borderRadius: 1,
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          height: 'fit-content',
        }}
        onDoubleClick={() => setImageSrc(undefined)}
      >
        <Typography variant="caption">
          Search by Image{' '}
          <Typography
            variant="caption"
            sx={{
              fontSize: '11px',
              color: 'gray',
              opacity: '0.7',
              fontStyle: 'italic',
            }}
          >
            Double click to clear
          </Typography>
        </Typography>
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
            size="small"
            label="Enter image URL and press Enter"
            onKeyDown={handleImageUrl}
            inputProps={{
              style: {
                height: '35px',
                padding: '0 10px',
              },
            }}
          />
          <Box display="flex" alignItems="center">
            <Typography
              sx={{
                marginLeft: '10px',
                marginRight: '10px',
                verticalAlign: 'middle',
              }}
              variant="caption"
            >
              or
            </Typography>
          </Box>
          <IconButton
            color={!imageSrc ? 'primary' : 'success'}
            onClick={() => fileInputRef.current?.click()}
            sx={{ height: '35px', padding: '0' }}
          >
            <UploadFileIcon />
          </IconButton>
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
  )
}

export default ImageInputBox
