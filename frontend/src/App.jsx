import './App.css';
import Routers from './Routers/Routers';
import { EvaluationContext, EvaluationContextProvider } from './contexts/EvaluationContext';
import { SelectedImagesProvider } from './contexts/selectedImageContext';

function App() {
  return (
    <EvaluationContextProvider>
    <SelectedImagesProvider>
      <Routers />
    </SelectedImagesProvider>
    </EvaluationContextProvider>
  );
}

export default App;
