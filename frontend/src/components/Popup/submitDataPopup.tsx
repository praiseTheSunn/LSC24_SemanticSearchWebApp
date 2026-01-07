import {
  Box,
  Button,
  ClickAwayListener,
  TextField,
  Typography,
} from '@mui/material'
import type React from 'react'
import { useCallback, useState } from 'react'
import { toast } from 'react-toastify'
import { appActions, useAppDispatch, useAppSelector } from '../../AppState'
import { useSubmitQuestionAnsweringMutation } from '../../AppState'
import { ImageRecord } from '../../types/image'
import { displayResponseToast } from '../../utils/evaluation/displayResponseToast'
import { convertTimeToMs } from '../../config/transformResponse'

// Định nghĩa props cho component nếu cần
interface SubmitDataPopupProps {
  onClose: () => void
}

const SubmitDataPopup: React.FC<SubmitDataPopupProps> = () => {
  const [answer, setAnswer] = useState<string>('')

  const evaluationId = localStorage.getItem('evaluationId')
  const sessionId = localStorage.getItem('sessionId')
  const viewImage = useAppSelector((state) => state.app.SubmitData)

  const [triggerQA, resultQA] = useSubmitQuestionAnsweringMutation()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    console.log('Submitted:', answer)
    console.log('src', viewImage?.img_link)

    const text = `QA-${answer}-${viewImage?.video_id}-${convertTimeToMs(viewImage?.time)}`

    if (!evaluationId || !sessionId || answer === '') {
      toast.error('No EvaluationID or SessionID or Answer is null', {
        position: 'bottom-right',
        autoClose: 5000,
        closeOnClick: true,
      })
      return
    }

    const resultQA = await triggerQA({
      evaluation_id: evaluationId,
      session: sessionId,
      text: text,
    })
    displayResponseToast(resultQA)
  }

  const dispatch = useAppDispatch()

  const closeSubmitPopup = useCallback(() => {
    dispatch(appActions.setSubmitData(null))
  }, [dispatch])

  return (
    <Box
      className="submit-popup"
      sx={{
        zIndex: '99999',
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        backgroundColor: 'rgba(110, 110, 110, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box sx={popupStyles}>
        <ClickAwayListener onClickAway={closeSubmitPopup}>
          <Box sx={contentStyles}>
            {/* Hàng trên cùng chứa tiêu đề */}
            <Box sx={headerStyles}>
              <Typography variant="h5" component="h1">
                <strong>Submit Data</strong>
              </Typography>
            </Box>

            {/* Hàng giữa chứa hình ảnh */}
            <Box sx={imageContainerStyles}>
              <img src={viewImage?.img_link} alt="View" style={imageStyles} />
            </Box>

            {/* Hàng chứa thông tin video ID và timestamp */}
            <Box sx={headerStyles}>
              <Typography variant="h6" component="h3">
                {viewImage?.video_id}
                &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                {convertTimeToMs(viewImage?.time)}
              </Typography>
            </Box>

            {/* Hàng dưới cùng chứa textfield và nút submit */}
            <Box sx={footerStyles}>
              <TextField
                fullWidth
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                label="Answer"
                variant="outlined"
                sx={inputStyles}
                onKeyDown={handleKeyDown}
              />
              <Button
                variant="contained"
                sx={buttonStyles}
                onClick={handleSubmit}
              >
                Submit
              </Button>
            </Box>
          </Box>
        </ClickAwayListener>
      </Box>
    </Box>
  )
}

// Các style cho popup và nội dung
const popupStyles = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 10000,
}

const contentStyles = {
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  width: '400px',
  maxWidth: '90%',
}

const headerStyles = {
  textAlign: 'center',
  fontWeight: 'bold',
}

const imageContainerStyles = {
  textAlign: 'center',
  marginBottom: '10px',
}

const imageStyles = {
  width: '100%',
  height: 'auto',
  borderRadius: '8px',
}

const footerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '20px',
}

const inputStyles = {
  marginRight: '10px',
}

const buttonStyles = {
  padding: '10px',
  fontSize: '16px',
  backgroundColor: '#007bff',
  color: 'white',
}

export default SubmitDataPopup
