import { toast } from 'react-toastify'

export const displayResponseToast = (result: any) => {
  // console.log('KIS result:', result) // In ra response khi có dữ liệu

  if (result.error) {
    // console.error('Error from KIS:', result.error); // In ra lỗi nếu có
    toast.error(`Submission FAILED - ERROR ${result.error.data.description}`, {
      position: 'bottom-right',
      autoClose: 2000,
    })
  }

  if (result.data) {
    if (result.data.status === true && result.data.submission === 'CORRECT') {
      toast.success('Submission CORRECT', {
        position: 'bottom-right',
        autoClose: 2000,
      })
    } else if (
      result.data.status === true &&
      result.data.submission === 'WRONG'
    ) {
      console.log('KIS result:', result.data.description) // In ra response khi có dữ liệu
      toast.error(`Submission WRONG ${result.data.description}`, {
        position: 'bottom-right',
        autoClose: 2000,
      })
    } else {
      toast.error(`Submission FAILED ${result.data.description}`, {
        position: 'bottom-right',
        autoClose: 2000,
      })
    }
  }
}
