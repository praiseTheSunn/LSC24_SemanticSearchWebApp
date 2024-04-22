import './loadingPopup.css'


const LoadingPopup = () => {
    return (
        <div className='loading-popup'>
            <div className='loading-container'>
                <div class="lds-grid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                Please wait...
            </div>
        </div>
    );
};

export default LoadingPopup;