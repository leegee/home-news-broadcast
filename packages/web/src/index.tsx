/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App'
import { initUiStorage } from './stores/ui';
import { initPlaylistStorage } from './stores/playlist';

initUiStorage();
initPlaylistStorage();

const root = document.getElementById('root')

render(() => <App />, root!)
