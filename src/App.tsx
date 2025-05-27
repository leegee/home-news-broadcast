import { createSignal } from 'solid-js';
import './App.css';
import CaptureControls from './components/CaptureControls';
import Ticker from './components/Ticker';
import Banner from './components/Banner.tsx';
import VideoDropPlayer from './components/VideoDropPlayer';

function App() {
  const [screenVideoRef, setScreenVideoRef] = createSignal<HTMLVideoElement>();

  return (
    <>
      <VideoDropPlayer>
        <Banner />
        <Ticker />
        <CaptureControls screenVideoRef={screenVideoRef()} />
      </VideoDropPlayer>


      <aside>
        <video
          ref={setScreenVideoRef}
          class="capture-playback-video"
          muted
        ></video>
      </aside>
    </>
  );
}

export default App;
