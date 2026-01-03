import React from 'react';
import ReactDOM from 'react-dom/client';
import GithubOverlay from './GithubOverlay';
import css from '../index.css?inline';

const rootElement = document.createElement('div');
rootElement.id = 'git-voucher-root';
document.body.appendChild(rootElement);

const shadowRoot = rootElement.attachShadow({ mode: 'open' });

const style = document.createElement('style');
style.textContent = css;
shadowRoot.appendChild(style);

const root = ReactDOM.createRoot(shadowRoot);
root.render(
  <React.StrictMode>
    <GithubOverlay />
  </React.StrictMode>
);
