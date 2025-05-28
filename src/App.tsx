import './App.css';
import { HashRouter, Route } from "@solidjs/router";
import BroadcastScreen from './views/BroadcastScreen.tsx';
import ControlScreen from './views/ControlScreen.tsx';

function App() {
  return (
    <HashRouter>
      <Route path="/" component={ControlScreen} />
      <Route path="/output" component={BroadcastScreen} />
    </HashRouter>
  );
}

export default App;
