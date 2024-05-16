import './App.css';
import Routers from './Routers/Routers';
import { SelectedImagesProvider } from './contexts/selectedImageContext';

function App() {
  return (
    <SelectedImagesProvider>
      <Routers />
    </SelectedImagesProvider>
    
  );
}

export default App;
