import { Popup } from 'react-leaflet';
import './App.css';
import Routers from './Routers/Routers';
import { EvaluationContext, EvaluationContextProvider } from './contexts/EvaluationContext';
import { SelectedImagesProvider } from './contexts/selectedImageContext';
import { PopUpProvider } from './contexts/popUpContext';

function App() {
  return (
    <PopUpProvider>
    <EvaluationContextProvider>
    <SelectedImagesProvider>
      <Routers />
    </SelectedImagesProvider>
    </EvaluationContextProvider>
    </PopUpProvider>
  );
}

export default App;
