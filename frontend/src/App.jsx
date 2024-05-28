import './App.css';
import Routers from './Routers/Routers';
import { SelectedImagesProvider } from './contexts/selectedImageContext';
import { NeighborPopupProvider, useNeighborPopup } from './contexts/neighborPopupContext';
import { SinglePopupProvider, useSinglePopup } from './contexts/singlePopupContext';
import NeighborPopup from './components/Popup/neighborPopup';
import SinglePopup from './components/Popup/singlePopup';
import { createPortal } from 'react-dom';

function App() {
  return (
    <SelectedImagesProvider>
      <SinglePopupProvider>
        <NeighborPopupProvider>
          <Routers />
          <PopupPortal />
        </NeighborPopupProvider>
      </SinglePopupProvider>
    </SelectedImagesProvider>
    
  );
}

const PopupPortal = () => {
  const { isPopupOpen, popupImage, closePopup } = useNeighborPopup();
  const { isSinglePopupOpen, singlePopupImage, closeSinglePopup } = useSinglePopup();

  return (
    <>
      <>
        {isSinglePopupOpen && createPortal(
          <SinglePopup viewImage={singlePopupImage} onClose={closeSinglePopup} />,
          document.body
        )}
      </>
      {isPopupOpen && createPortal(
        <NeighborPopup viewImage={popupImage} onClose={closePopup} />,
        document.body
      )}
    </>
    
  );
};

export default App;
