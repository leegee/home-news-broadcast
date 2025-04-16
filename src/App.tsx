import './App.css'

// import { setupVideoControls } from './videoControls.js';
import { Ticker } from "./scrollingText.js";
// import { setupVideoDropArea } from "./videoDropHandler.js";

function App() {

  document.addEventListener('DOMContentLoaded', () => {
    // setupVideoControls({
    //     startCaptureButton: document.getElementById('start-capture'),
    //     toggleCaptureButton: document.getElementById('toggle-capture'),
    //     screenVideoElement: document.getElementById('capture-playback'),
    // });

    // setupVideoDropArea("body", "#video-thumbs", "#large-video");
  });

  return (
    <>
      <div id="large-video"></div>

      <aside id="control-layer">
        <div id="capture-controls">
          <button id="start-capture">Start Capture Broadcast</button>
          <button id="toggle-capture" style="display:none;">Hide Video Capture</button>
        </div>
        <div id="video-thumbs"></div>
        <video id="capture-playback" muted></video>
        <Ticker id="ticker">
          This text will smoothly scroll across the screen whilst you choose a video to play.
        </Ticker>
      </aside>
    </>
  )
}

export default App
