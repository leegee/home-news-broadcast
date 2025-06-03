/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'
import { initUiStorage } from './lib/stores/ui.ts';
import { initPlaylistStorage } from './lib/stores/playlist.ts';

initUiStorage();
initPlaylistStorage();

const root = document.getElementById('root')

render(() => <App />, root!)
