import { toast } from 'react-toastify'

export const displayResponseToast = (resultKIS: any) => {
  console.log('KIS result:', resultKIS) // In ra response khi có dữ liệu

  if (resultKIS.error) {
    // console.error('Error from KIS:', resultKIS.error); // In ra lỗi nếu có
    toast.error(
      `Submission FAILED - ERROR ${resultKIS.error.data.description}`,
      {
        position: 'bottom-right',
        autoClose: 2000,
      },
    )
  }

  if (resultKIS.data) {
    console.log('KIS result:', resultKIS.data) // In ra response khi có dữ liệu
    if (
      resultKIS.data.status === true &&
      resultKIS.data.submission === 'CORRECT'
    ) {
      toast.success('Submission CORRECT', {
        position: 'bottom-right',
        autoClose: 2000,
      })
    } else if (
      resultKIS.data.status === true &&
      resultKIS.data.submission === 'WRONG'
    ) {
      toast.error(`Submission WRONG ${resultKIS.data.description}`, {
        position: 'bottom-right',
        autoClose: 2000,
      })
    } else {
      toast.error(`Submission FAILED ${resultKIS.data.description}`, {
        position: 'bottom-right',
        autoClose: 2000,
      })
    }
  }
}
