import './App.css';
import { HashRouter, Route } from "@solidjs/router";
import BroadcastScreen from './views/BroadcastScreen.tsx';
import ControlScreen from './views/ControlScreen.tsx';
import PhoneJoin from "./views/PhoneJoin.tsx";

export default function App() {
  return (
    <HashRouter>
      <Route path="/" component={ControlScreen} />
      <Route path="/output" component={BroadcastScreen} />
      <Route path="/phone" component={PhoneJoin} />
    </HashRouter>
  );
}

