/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'
import { initLocalStorage } from './lib/store.ts';

initLocalStorage();

const root = document.getElementById('root')

render(() => <App />, root!)
