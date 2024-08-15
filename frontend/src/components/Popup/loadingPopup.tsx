import './loadingPopup.css'



const LoadingPopup = () => {
  return (
    <div className="loading-popup" style={{ zIndex: '99999' }}>
      <div className="loading-container">
      <span className="loader"/>
        Please wait...
      </div>
    </div>
  )
}

export default LoadingPopup
