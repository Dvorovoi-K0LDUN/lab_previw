const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; font-family: Arial, sans-serif; }
    .card { padding: 16px; border: 1px solid #ccc; border-radius: 8px; margin: 10px 0; }
    a { color: #1769aa; }
    p { margin: 8px 0 0; }
  </style>
  <div class="card">
    <a part="link"></a>
    <p>Название: <span part="title"></span></p>
    <p>Заголовок: <span part="heading"></span></p>
    <p id="message"></p>
  </div>
`;

class PagePreview extends HTMLElement {
  static observedAttributes = ['src'];

  constructor() {
    super();
    this.requestId = 0;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(template.content.cloneNode(true));
    this.link = this.shadowRoot.querySelector('[part="link"]');
    this.titleText = this.shadowRoot.querySelector('[part="title"]');
    this.headingText = this.shadowRoot.querySelector('[part="heading"]');
    this.message = this.shadowRoot.querySelector('#message');
  }

  connectedCallback() {
    this.started = true;
    this.load();
  }

  disconnectedCallback() {
    this.started = false;
    this.requestId++;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.started) {
      this.load();
    }
  }

  async load() {
    const id = ++this.requestId;
    this.dataset.status = 'loading';
    this.titleText.textContent = '';
    this.headingText.textContent = '';
    this.message.textContent = '';

    const src = this.getAttribute('src');
    if (!src) {
      this.link.removeAttribute('href');
      this.link.textContent = 'Адрес не указан';
      this.dataset.status = 'error';
      this.message.textContent = 'Укажите src';
      return;
    }

    let url;
    try {
      url = new URL(src, document.baseURI);
    } catch {
      this.link.removeAttribute('href');
      this.link.textContent = 'Неверный адрес';
      this.dataset.status = 'error';
      this.message.textContent = 'Неверный адрес страницы';
      return;
    }

    this.link.href = url.href;
    this.link.textContent = url.href;

    try {
      const response = await fetch(url.href);
      if (!response.ok) throw new Error('HTTP error');
      const html = await response.text();
      if (!this.isConnected || id !== this.requestId) return;

      const page = new DOMParser().parseFromString(html, 'text/html');
      const title = page.title.trim();
      const heading = page.querySelector('h1')?.textContent.trim() || '';

      this.titleText.textContent = title || 'Название отсутствует';
      this.headingText.textContent = heading || 'Заголовок отсутствует';
      this.link.textContent = title || url.href;
      this.dataset.status = 'ready';
    } catch {
      if (!this.isConnected || id !== this.requestId) return;
      this.dataset.status = 'error';
      this.message.textContent = 'Не удалось загрузить страницу';
    }
  }
}

customElements.define('page-preview', PagePreview);
