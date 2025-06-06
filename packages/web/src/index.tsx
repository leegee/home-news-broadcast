/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App'
import { initUiStorage } from './lib/stores/ui';
import { initPlaylistStorage } from './lib/stores/playlist';

initUiStorage();
initPlaylistStorage();

const root = document.getElementById('root')

render(() => <App />, root!)
