import './App.css';
import Routers from './Routers/Routers';
import { SelectedImagesProvider } from './contexts/selectedImageContext';
import { NeighborPopupProvider, useNeighborPopup } from './contexts/neighborPopupContext';
import NeighborPopup from './components/Popup/neighborPopup';
import { createPortal } from 'react-dom';

function App() {
  return (
    <SelectedImagesProvider>
      <NeighborPopupProvider>
        <Routers />
        <PopupPortal />
      </NeighborPopupProvider>
    </SelectedImagesProvider>
    
  );
}

const PopupPortal = () => {
  const { isPopupOpen, popupImage, closePopup } = useNeighborPopup();

  return (
    <>
      {isPopupOpen && createPortal(
        <NeighborPopup viewImage={popupImage} onClose={closePopup} />,
        document.body
      )}
    </>
  );
};

export default App;
