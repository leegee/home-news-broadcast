import { createSignal } from 'solid-js';
import './App.css';
import CaptureControls from './components/CaptureControls';
import Ticker from './components/Ticker';
import VideoDropPlayer from './components/VideoDropPlayer';

function App() {
  const [screenVideoRef, setScreenVideoRef] = createSignal<HTMLVideoElement>();

  return (
    <>
      <VideoDropPlayer>
        <CaptureControls screenVideoRef={screenVideoRef()} />
        <Ticker />
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
