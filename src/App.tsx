import './App.css';
import Ticker from './components/Ticker';
import Banner from './components/Banner.tsx';
import ControlScreen from './views/ControlScreen.tsx';

function App() {
  return (
    <ControlScreen>
      <Banner />
      <Ticker />
    </ControlScreen>
  );
}

export default App;
