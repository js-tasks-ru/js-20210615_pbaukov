import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';

export default class SortableTable {
  element;
  subElements = {};
  data = [];
  loading = false;
  step = 20;
  start = 1;
  end = this.start + this.step;

  constructor(headersConfig, {
    url = '',
    isSortLocally = false,
    sorted =  {
      id: headersConfig.find(item => item.sortable).id,
      order: 'asc'
    }
  } = {}) {
    this.headerConfig = headersConfig;
    this.isSortLocally = isSortLocally;
    this.url = new URL(BACKEND_URL + url);
    this.sorted = sorted;

    this.render();
  }

  onWindowScroll = async() => {
    const { bottom } = this.element.getBoundingClientRect();
    const { id, order } = this.sorted;

    if (bottom < document.documentElement.clientHeight && !this.loading && !this.isSortLocally) {
      this.start = this.end;
      this.end = this.start + this.step;

      this.loading = true;

      const data = await this.loadData(id, order, this.start, this.end);
      this.update(data);

      this.loading = false;
    }
  }

  onSortClick = event => {
    const column = event.target.closest('[data-sortable="true"]');
    const toggleOrder = order => {
      const orders = {
        asc: 'desc',
        desc: 'asc'
      }

      return orders[order];
    }

    if (column) {
      const { id, order } = column.dataset;
      const newOrder = toggleOrder(order);
      this.sorted = {
        id,
        order: newOrder
      }
      const sortedData = this.sort(id, newOrder);
      const arrow = column.querySelector('.sortable-table__sort-arrow');

      column.dataset.order = newOrder;

      if (!arrow) {
        column.append(this.subElements.arrow);
      }
    }
  }

  addRows(data) {
    this.data = data;

    this.subElements.body.innerHTML = this.getTableRows(data);
  }

  update(data) {
    const rows = document.createElement('div');

    this.data = [...this.data, ...data];
    rows.innerHTML = this.getTableRows(data);

    this.subElements.body.append(...rows.childNodes)
  }

  getTableHeader() {
    return `<div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.headerConfig.map(item => this.getHeaderRow(item)).join('')}
    </div>`;
  }

  getHeaderRow({id, title, sortable}) {
    return `<div class="sortable-table__cell" data-id="${id}" data-order=${this.sorted.order} data-sortable="${sortable}">
        <span>${title}</span>
        ${this.getHeaderSortingArrow(id)}
    </div>`;
  }

  getHeaderSortingArrow(id) {
    const isOrderExist = this.sorted.id === id ? this.sorted.id : null;

    return isOrderExist
      ? `<span data-element="arrow" class="sortable-table__sort-arrow">
           <span class="sort-arrow"></span>
         </span>`
      : '';
  }

  getBody(data) {
    return `<div data-element="body" class="sortable-table__body">
        ${this.getTableRows(data)}
    </div>`;
  }

  getTableRows(data) {
    return data.map(item => {
      return `
        <a href="/products/${item.id}" class="sortable-table__row">
            ${this.getRow(item)}
        </a>
      `;
    }).join('');
  }

  getRow(item) {
    const cells = this.headerConfig.map(({id, template}) => {
      return {id, template};
    })
    return cells.map(({id, template}) => {
      return template
        ? template(item[id])
        : `<div class="sortable-table__cell">${item[id]}</div>`
    }).join('');
  }

  getTable() {
    return `<div class="sortable-table">
        ${this.getTableHeader()}
        ${this.getBody(this.data)}
      </div>`
  }

  async render() {
    const {id, order} = this.sorted;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTable();
    const element = wrapper.firstElementChild;
    this.element = element;
    this.subElements = this.getSubElements(element);

    const data = await this.loadData(id, order, this.start, this.end);

    this.renderRows(data);
    this.initEventListeners();
  }

  async loadData(id, order, start = this.start, end = this.end) {
    this.url.searchParams.set('_sort', id);
    this.url.searchParams.set('_order', order);
    this.url.searchParams.set('_start', start);
    this.url.searchParams.set('_end', end);

    this.element.classList.add('sortable-table_loading');

    const data = await fetchJson(this.url);

    this.element.classList.remove('sortable-table_loading');

    return data;
  }

  initEventListeners() {
    this.subElements.header.addEventListener('pointerdown', this.onSortClick);
    document.addEventListener('scroll', this.onWindowScroll);
  }

  sort(field, order) {
    const allColumns = this.element.querySelectorAll('.sortable-table__cell[data-id]');
    const currentColumn = this.element.querySelector(`.sortable-table__cell[data-id="${field}"]`);

    allColumns.forEach(column => {
      column.dataset.order = '';
    })

    currentColumn.dataset.order = order;

    if (this.isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      this.sortOnServer(field, order);
    }
  }

  sortData(id, order) {
    const arr = [...this.data];
    const column = this.headerConfig.find(item => item.id === id);
    const { sortType, customSorting } = column;
    const directions = {
      asc: 1,
      desc: -1
    };
    const direction = order === 'asc' ? 1 : -1;

    return arr.sort((a, b) => {
      switch (sortType) {
      case 'number':
        return direction * (a[id] - b[id]);
      case 'string':
        return direction * a[id].localeCompare(b[id], ['ru', 'en']);
      case 'custom':
        return direction * customSorting(a, b);
      default:
        return direction * (a[id] - b[id])
      }
    })
  }

  getSubElements(element) {
    const result = {};
    const elements = element.querySelectorAll('[data-element]');

    for (const subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }

    return result;
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
    document.removeEventListener('scroll', this.onWindowScroll)
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }

  sortOnClient (id, order) {
    const sortedData = this.sortData(id, order);
    this.subElements.body.innerHTML = this.getTableRows(sortedData);
  }

  async sortOnServer (id, order) {
    const start = 1;
    const end = start + this.step;
    const data = await this.loadData(id, order, start, end);

    this.renderRows(data)
  }

  renderRows(data) {
    if (data.length) {
      this.element.classList.remove('sortable-table_empty');
      this.addRows(data);
    } else {

    }
  }
}
