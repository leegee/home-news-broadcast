import './App.css';
import Ticker from './components/Ticker';
import Banner from './components/Banner.tsx';
import VideoDropPlayer from './components/VideoDropPlayer';

function App() {
  return (
    <VideoDropPlayer>
      <Banner />
      <Ticker />
    </VideoDropPlayer>
  );
}

export default App;
