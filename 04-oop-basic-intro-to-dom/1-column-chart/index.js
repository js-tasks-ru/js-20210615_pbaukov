export default class ColumnChart {
  element; // we need this to, for example, remove
  formatHeading;
  chartHeight = 50;

  constructor({
    data = [],
    value = 0,
    label = '',
    link = '',
    formatHeading = function(value) { return value; }
  } = {}) {
    this.data = data;
    this.label = label;
    this.link = link;
    this.value = value;
    this.formatHeading = formatHeading;
    this.render();
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;

    if (this.data.length) {
      this.element.classList.remove('column-chart_loading');
    }
  }

  get template() {
    return `
      <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.getLink()}
        </div>
        <div class="column-chart__container">
          <div class="column-chart__header">
            ${this.formatHeading(this.value)}
          </div>
          <div class="column-chart__chart">
            ${this.getBody(this.data)}
          </div>
        </div>
      </div>
    `;
  }

  getBody(data) {
    const maxValue = Math.max(...data);

    return data.map(value => {
      const onePoint = this.chartHeight / maxValue;
      const percent = (value / maxValue * 100).toFixed(0);

      return `<div style="--value: ${Math.floor(value * onePoint)}" data-tooltip="${percent}%"></div>`;
    }).join('');
  }

  getLink() {
    return this.link ? `<a class="column-chart__link" href="${this.link}">View all</a>` : '';
  }

  update(bodyData) {
    // Not sure why we need this method, but there is a test...
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
