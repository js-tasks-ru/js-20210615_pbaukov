import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  element;
  subElements = {};
  defaultFormData = {
    title: '',
    description: '',
    quantity: 1,
    subcategory: '',
    status: 1,
    images: [],
    price: 100,
    discount: 0
  }

  onSubmit = event => {
    event.preventDefault();
    this.save();
  }

  uploadImage = () => {
    const fileInput = document.createElement('input');

    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async () => {
      const [file] = fileInput.files;
      if (file) {
        const formData = new FormData();
        const { uploadImage, imageListContainer} = this.subElements;

        formData.append('image', file);
        console.log(formData);

        uploadImage.classList.add('is-loading');
        uploadImage.disabled = true;

        const result = await fetchJson('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
          },
          body: formData,
          referrer: ''
        });

        imageListContainer.append(this.getImageItem(result.data.link, file.name));

        uploadImage.classList.remove('is-loading');
        uploadImage.disabled = false;

        fileInput.remove();
      }
    };

    fileInput.hidden = true; // for IE
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  constructor (productId) {
    this.productId = productId;
  }

  template() {
    return `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input required="" type="text" id="title" name="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required="" class="form-control" id="description" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>

            <div data-element="imageListContainer"></div>
            <button type="button" id="uploadImage" name="uploadImage" class="button-primary-outline" data-element="uploadImage">
                <span>Загрузить</span>
            </button>
          </div>
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            ${this.getCategoriesSelect()}
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required="" type="number" id="price" name="price" class="form-control" placeholder="${this.defaultFormData.price}">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required="" type="number" id="discount" name="discount" class="form-control" placeholder="${this.defaultFormData.discount}">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required="" type="number" class="form-control" id="quantity" name="quantity" placeholder="${this.defaultFormData.quantity}">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" id="status" name="status">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" id="save" name="save" class="button-primary-outline" onsubmit="onSubmit()">
              ${this.productId ? 'Сохранить' : 'Добавить'} товар
            </button>
          </div>
        </form>
      </div>
    `
  }

  getCategoriesSelect() {
    const wrapper = document.createElement('div');

    wrapper.innerHTML = `<select class="form-control" id="subcategory" name="subcategory">
        ${this.getCategoriesOptions()}
    </select>`;

    return wrapper.innerHTML;
  }

  getCategoriesOptions() {
    return this.categories.map(category => {
      return category.subcategories.map(subcategory => `<option value="${subcategory.id}">${category.title} > ${subcategory.title}</option>`).join('');
    }).join();
  }

  createImagesList() {
    const { imageListContainer } = this.subElements;
    const { images } = this.formData;

    const items = images.map(({url, source}) => imageListContainer.append(this.getImageItem(url, source)));
  }

  getImageItem(url, name) {
   const wrapper = document.createElement('div');
   wrapper.innerHTML = `<li class="products-edit__imagelist-item sortable-list__item">
        <span>
          <img src="icon-grab.svg" data-grab-handle="" alt="grab">
          <img class="sortable-table__cell-img" alt="${escapeHtml(name)}" src="${escapeHtml(url)}">
          <span>${escapeHtml(name)}</span>
        </span>
        <button type="button">
          <img src="icon-trash.svg" data-delete-handle alt="delete">
        </button>
      </li>
    `;
   return wrapper;
  }

  async render () {
    const _categories = this.loadCategoriesList();
    const _product = this.productId ? this.loadProductData(this.productId) : [this.defaultFormData];

    const [categories, productResponse] = await Promise.all([_categories, _product]);
    const [product] = productResponse;

    this.formData = product;
    this.categories = categories;

    this.renderForm();

    if (this.formData) {
      this.setFormData();
      this.createImagesList();
      this.initEventListeners();
    }

    return this.element;
  }

  renderForm() {
    const element = document.createElement('div');

    element.innerHTML = this.formData ? this.template() : this.getEmptyTemplate();

    this.element = element.firstElementChild;

    this.subElements = this.getSubElements(this.element);
  }

  initEventListeners() {
    const { productForm, uploadImage} = this.subElements;

    productForm.addEventListener('submit', this.onSubmit);
    uploadImage.addEventListener('click', this.uploadImage);
  }

  getEmptyTemplate() {
    return `<div><h1 class="page-title">Страница не найдена</h1><p>Извините, данный товар отсутствует</p></div>`
  }

  async save() {
    const product = this.getFormData();
    const result = await fetchJson(`${BACKEND_URL}/api/rest/products`, {
      method: this.productId ? 'PATCH' : 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    })

    this.dispatchEvent(result.id);
  }

  getFormData() {
    const { imageListContainer, productForm } = this.subElements;
    const excludedFields = ['images'];
    const formatToNumber = ['price', 'quantity', 'discount', 'status'];
    const fields = Object.keys(this.defaultFormData).filter(item => !excludedFields.includes(item));
    const getValue = field => productForm.querySelector(`[name=${field}]`);
    const values = {};

    for (const field of fields) {
      const value = getValue(field).value;

      values[field] = formatToNumber.includes(field) ? parseInt(value, 10) : value;
    }

    const imagesHTMLCollection = imageListContainer.querySelectorAll('.sortable-table__cell-img');

    values.images = [];
    values.id = this.productId;

    for (const image of imagesHTMLCollection) {
      values.images.push({
        url: image.src,
        source: image.alt
      });
    }

    return values;
  }

  dispatchEvent(id) {
    const event = this.productId ? new CustomEvent('product-updated', {detail: id}) : new CustomEvent('product-saved');
    this.element.dispatchEvent(event);
  }

  setFormData() {
    const { productForm } = this.subElements;
    const excludedFields = ['images'];
    const fields = Object.keys(this.defaultFormData).filter(item => !excludedFields.includes(item));

    fields.forEach(item => {
      const element = productForm.querySelector(`[name="${item}"]`);
      element.value = this.formData[item] || this.defaultFormData[item];
    });
  }

  loadProductData(productId) {
    return fetchJson(`${BACKEND_URL}/api/rest/products?id=${productId}`);
  }

  loadCategoriesList() {
    return fetchJson(`${BACKEND_URL}/api/rest/categories?_sort=weight&_refs=subcategory`);
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
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}
