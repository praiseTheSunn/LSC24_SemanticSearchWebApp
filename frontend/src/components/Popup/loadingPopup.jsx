import './loadingPopup.css'

const LoadingPopup = () => {
  return (
    <div className="loading-popup" style={{ zIndex: '99999' }}>
      <div className="loading-container">
        <div className="lds-grid">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
        Please wait...
      </div>
    </div>
  )
}

export default LoadingPopup
