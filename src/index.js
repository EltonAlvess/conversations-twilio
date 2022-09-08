import { createRoot } from 'react-dom/client';
import './assets/style.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App tab="home" />);
// ReactDOM.createRoot(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
