import './App.css';
import { HashRouter, Route } from "@solidjs/router";
import BroadcastScreen from './views/BroadcastScreen';
import ControlScreen from './views/ControlScreen';
import PhoneScreen from "./views/PhoneScreen";

export default function App() {
  return (
    <HashRouter>
      <Route path="/" component={ControlScreen} />
      <Route path="/output" component={BroadcastScreen} />
      <Route path="/phone" component={PhoneScreen} />
    </HashRouter>
  );
}

