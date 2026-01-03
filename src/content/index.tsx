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

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        const menu = node.classList.contains('js-slash-command-menu') 
          ? node 
          : node.querySelector('.js-slash-command-menu');

        if (menu) {
          tryInject(menu as HTMLElement, 0);
        }
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });

function tryInject(menu: HTMLElement, attempts: number) {
  const list = menu.querySelector('.js-slash-command-menu-items');
  const hasItems = list && list.querySelectorAll('.SelectMenu-item').length > 0;

  if (hasItems) {
    injectGitVoucherCommand(menu, list as HTMLElement);
  } else if (attempts < 5) {
    setTimeout(() => tryInject(menu, attempts + 1), 100);
  }
}

function injectGitVoucherCommand(menu: HTMLElement, list: HTMLElement) {
  if (menu.querySelector('#slash-command-item-gitvoucher')) return;

  const li = document.createElement('li');
  li.id = 'slash-command-item-gitvoucher';
  li.className = 'SelectMenu-item d-block slash-command-menu-item';
  li.setAttribute('role', 'option');
  li.setAttribute('aria-selected', 'false');
  li.style.borderLeft = '4px solid #2ea44f';
  li.style.background = 'rgba(46, 164, 79, 0.1)';
  li.style.cursor = 'pointer';

  li.innerHTML = `
    <h5>
      Git Voucher 
      <span class="Label Label--success" style="margin-left: 8px">NEW</span>
    </h5>
    <span class="command-description">Send crypto to a contributor</span>
  `;

  list.prepend(li);

  const activate = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    insertVoucherCommand();
    menu.remove();
  };

  li.addEventListener('mousedown', activate, { capture: true });
  li.addEventListener('click', activate, { capture: true });
}

function insertVoucherCommand() {
  let textarea = document.activeElement as HTMLTextAreaElement;

  if (!textarea || textarea.tagName !== 'TEXTAREA') {
    textarea = document.querySelector('.comment-form-textarea[aria-label="Comment body"]') as HTMLTextAreaElement;
  }
  
  if (!textarea) return;

  const start = textarea.selectionStart;
  const val = textarea.value;
  
  const slashIndex = val.lastIndexOf('/', start);
  const safeStart = slashIndex !== -1 ? slashIndex : start;

  const textBefore = val.slice(0, safeStart);
  const textAfter = val.slice(start);
  const template = `/pay @username 10 "Reason"`;
  
  const newValue = textBefore + template + textAfter;

  const proto = window.HTMLTextAreaElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  
  if (nativeSetter) {
    nativeSetter.call(textarea, newValue);
  } else {
    textarea.value = newValue;
  }

  textarea.dispatchEvent(new Event('input', { bubbles: true }));

  textarea.focus();
  
  setTimeout(() => {
    const newStart = textBefore.length + 6;
    const newEnd = newStart + 9;
    textarea.setSelectionRange(newStart, newEnd);
  }, 0);
}
