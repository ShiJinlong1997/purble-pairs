class ImgCard extends HTMLElement {
  constructor() {
    super();
    const shadowRoot: ShadowRoot = this.attachShadow({mode: 'open'});
    const templateEl = document.getElementById('cardTpl') as HTMLTemplateElement;
    const content: Node = templateEl.content.cloneNode(true);
    shadowRoot.append(content);
  }

  static get observedAttributes() {
    return ['id', 'front', 'type'];
  }


  attributeChangedCallback(attr: string, oldVal: unknown, newVal: unknown) {
    'front' == attr && this.handleFront(newVal);
  }
  
  get front() {
    return this.hasAttribute('front');
  }
  
  set front(val: unknown) {
    this.front = !!val;
  }

  get type() {
    return this.getAttribute('type') ?? '';
  }

  set type(val: string) {
    this.type = val;
  }
  
  handleFront(val: unknown): void {
    !!val
    ? this.setAttribute('front', '')
    : this.removeAttribute('front');
  }
}

export default ImgCard;
