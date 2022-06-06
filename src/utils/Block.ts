/* eslint-disable class-methods-use-this */
import EventBus from "./EventBus";

export enum EventsEnum {
  INIT = "init",
  FLOW_CDM = "flow:component-did-mount",
  FLOW_CDU = "flow:component-did-update",
  FLOW_RENDER = "flow:render",
}

// Нельзя создавать экземпляр данного класса
export default class Block {
  props: any;

  protected eventBus: () => EventBus;

  private _element: HTMLElement;

  private readonly _meta: {
    tagName: string;
    props: any;
  };

  /** JSDoc
   * @param {string} tagName
   * @param {Object} props
   *
   * @returns {void}
   */
  constructor(tagName = "div", props = {}) {
    const eventBus = new EventBus();
    this._meta = {
      tagName,
      props,
    };

    this.props = this._makePropsProxy(props);

    this.eventBus = () => eventBus;

    this._registerEvents(eventBus);
    eventBus.emit(EventsEnum.INIT);
  }

  private _registerEvents(eventBus: EventBus) {
    eventBus.on(EventsEnum.INIT, this.init.bind(this));
    eventBus.on(EventsEnum.FLOW_CDM, this._componentDidMount.bind(this));
    eventBus.on(EventsEnum.FLOW_CDU, this._componentDidUpdate.bind(this));
    eventBus.on(EventsEnum.FLOW_RENDER, this._render.bind(this));
  }

  private _addEvents(): void {
    if (this._element) {
      const { events = {} } = this.props;

      Object.keys(events).forEach((eventName) => {
        this._element.addEventListener(eventName, events[eventName]);
      });
    }
  }

  private _removeEvents(): void {
    if (this._element) {
      const { events = {} } = this.props;

      Object.keys(events).forEach((eventName) => {
        this._element.removeEventListener(eventName, events[eventName]);
      });
    }
  }

  private _createResources() {
    const { tagName } = this._meta;
    this._element = this._createDocumentElement(tagName);
  }

  init() {
    this._createResources();

    this.eventBus().emit(EventsEnum.FLOW_RENDER);
  }

  private _componentDidMount() {
    this.componentDidMount();
  }

  componentDidMount(oldProps?: any): void {
    console.log(oldProps);
  }

  dispatchComponentDidMount() {
    this.eventBus().emit(EventsEnum.FLOW_CDM);
  }

  private _componentDidUpdate(oldProps: any, newProps: any) {
    const response = this.componentDidUpdate(oldProps, newProps);
    if (!response) {
      return;
    }
    this._render();
  }

  componentDidUpdate(oldProps: any, newProps: any) {
    console.log(oldProps, newProps);
    return true;
  }

  setProps = (nextProps: any) => {
    if (!nextProps) {
      return;
    }

    Object.assign(this.props, nextProps);
  };

  get element() {
    return this._element;
  }

  _render() {
    const fragment = this.render();

    const newElement = fragment.firstElementChild as HTMLElement;

    if (this._element) {
      this._removeEvents();
      this._element.replaceWith(newElement);
    }

    this._element = newElement;

    this._addEvents();
  }

  protected render(): DocumentFragment {
    return new DocumentFragment();
  }

  getContent() {
    return this.element;
  }

  _makePropsProxy(props: any) {
    // Можно и так передать this
    // Такой способ больше не применяется с приходом ES6+
    const self = this;

    return new Proxy(props as unknown as object, {
      get(target: Record<string, unknown>, prop: string) {
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      },
      set(target: Record<string, unknown>, prop: string, value: unknown) {
        target[prop] = value;

        // Запускаем обновление компоненты
        // Плохой cloneDeep, в следующей итерации нужно заставлять добавлять cloneDeep им самим
        self.eventBus().emit(EventsEnum.FLOW_CDU, { ...target }, target);
        return true;
      },
      deleteProperty() {
        throw new Error("Нет доступа");
      },
    });
  }

  private _createDocumentElement(tagName: string) {
    // Можно сделать метод, который через фрагменты в цикле создаёт сразу несколько блоков
    return document.createElement(tagName);
  }

  show() {
    this.getContent().style.display = "block";
  }

  hide() {
    this.getContent().style.display = "none";
  }

  compile(template: any, context: any) {
    const fragment = this._createDocumentElement(
      "template"
    ) as HTMLTemplateElement;

    const htmlString = template;

    fragment.innerHTML = htmlString;

    return fragment.content;
  }
}
