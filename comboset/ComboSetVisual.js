// COMBOSET VISUAL 01.01.2026
const ComboSetVisual = (function () {
  let ajaxParams = {}; // current category ajax params
  let defaultParams = {}; // default category ajax params

  const $modal = $('#js-pd-combo-popup-main');
  const $modalContent = $('#js-pd-combo-popup-main-content');
  const $modalProducts = $('#js-pd-combo-popup-list');
  const $modalSearch = $('#js-pd-combo-popup-search');
  const $modalSearchInput = $('#js-pd-combo-popup-search-input');
  const $modalSortButton = $(".js-pd-combo-popup-sort");
  const $modalViewMore = $('#js-pd-combo-popup-viewmore-btn');
  const $modalFilter = $('#js-pd-combo-popup-filter');
  const $modalFilterSeleted = $('#js-pd-combo-popup-selected');
  const modalFilterSeletedAll = ".js-pd-combo-popup-filter-all";
  const modalFilterSeletedContainer = ".js-pd-combo-popup-filter-container";
  const modalFilterButton = ".js-pd-combo-popup-filter-value";
  const modalPriceSlider = ".js-slider-range";
  const modalPriceSelected = ".js-slider-selected";

  // SETUP
  function _setUp(product_id) {
    if ($('#js-pd-combo').length === 0) return;

    ComboSet.setUp(product_id); // set new combo
    _slider(); // slider combo list
    _modalSearch(); // modal search handle 
  }

  function _slider() {
    const holder = "#js-swiper-comboset";
    
    new Swiper(holder, {
      slidesPerView: 2,
      spaceBetween: 10,
      rewind: true,
      speed: 1000,
      observer: true,
      navigation: {
        nextEl: holder + " .swiper-button-next",
        prevEl: holder + " .swiper-button-prev",
      },
      breakpoints: {
        576: {
          slidesPerView: 3,
          spaceBetween: 12,
        },
        1600: {
          slidesPerView: 4,
        }
      },
    });
  }

  function _checkout(comboset_id) {
    ComboSet.goToComboSetCheckout(comboset_id); // go buy comboset page
  }

  function _removeProduct(_this) {
    const $product = $(_this).closest(".js-pd-combo-popup-product");
    const holder = $(_this).closest(".js-pd-combo-list")[0];

    const comboset_id = $product.data('comboset-id');
    const category_id = $product.data('category-id');
    const category_item = categories_database[comboset_id][category_id];
    const category_title = category_item && category_item.title ? category_item.title : "Danh mục";
    const category_image = category_item && category_item.image ? category_item.image : "https://placehold.co/250x250?text=No+Image";

    // replace category default
    const html = `
      <div class="pd-combo-item js-pd-combo-item" data-comboset-id="${comboset_id}" data-category-id="${category_id}">
        <div class="pd-combo-item-top">
          <div class="pd-combo-item-image">
            <p class="pd-combo-item-picture">
              <img class="pd-combo-item-thumbs" src="${category_image}" alt="${category_title}" width="250" height="250">
            </p>
          </div>
          <h3 class="pd-combo-item-title">${category_title}</h3>
        </div>

        <div class="pd-combo-item-bottom">
          <button class="pd-combo-item-btn" type="button" onclick="ComboSetVisual.categoryOpen('${comboset_id}', '${category_id}');">
            Chọn sản phẩm
          </button>
        </div>
      </div>
    `;
    $product.replaceWith(html);

    ComboSet.removeProduct(comboset_id, category_id); // remove product
    _calcPriceTotal(holder); // calc again total price
  }

  function _selectProduct(_this) {
    const $product = $(_this).closest(".js-pd-combo-popup-product");
    const comboset_id = $product.data('comboset-id');
    const category_id = $product.data('category-id');
    const product_id = $product.data('product-id');

    ComboSet.addProduct(comboset_id, category_id, product_id); // add product

    // replace product selected
    const html = $product[0].outerHTML;
    const holder = `#js-pd-combo-template .js-pd-combo-item[data-comboset-id="${comboset_id}"][data-category-id="${category_id}"]`;
    $(holder).replaceWith(html);

    _modalClose(); // close modal
    _calcPriceTotal(holder); // calc again total price
  }

  function _calcPriceTotal(holder) {
    const $container = $(holder).closest(".js-pd-combo-container");
    const $products = $container.find(".js-pd-combo-popup-product");
    const $price = $container.find(".js-pd-combo-total-price-combo");
    const $price_off = $container.find(".js-pd-combo-total-price-off");

    const price_main = parseInt($("#js-pd-combo-product-main-price").val());
    const price_products = $products.length ? $products.toArray().map((item) => parseInt($(item).data("product-price"))).reduce((acc, curr) => acc + curr, 0) : 0;
    const price_products_off = $products.length ? $products.toArray().map((item) => parseInt($(item).data("product-priceoff"))).reduce((acc, curr) => acc + curr, 0) : 0;
    const price_total = price_main + price_products;

    $price.html(formatCurrency(price_total) + "đ");
    $price_off.html(formatCurrency(price_products_off) + "đ");
  }

  function _calcPriceVariant(variant_info) {
    ComboSet.setVariant(variant_info.id); // set VARIANT_ID

    $("#js-pd-combo-product-main-price").val(variant_info.sale_price); // set product main price = variant price
    $("#js-pd-combo-template .js-pd-combo-list").each(function () {
      _calcPriceTotal(this); // calc combo total price 
    })
  }

  async function _categoryOpen(comboset_id, category_id) {
    // reset default when open new category
    $modalFilterSeleted.html(""); // clear filter selected
    $modalSortButton.removeClass("active"); // clear sort
    $modalSearchInput.removeClass("active").val(""); // clear search input 
    $modalProducts.html('<div class="pd-combo-loader"></div>'); // loading wait

    // [start price range] category open
    const priceMax = categories_database[comboset_id][category_id].max.replaceAll(".", "");
    const priceMin = categories_database[comboset_id][category_id].min.replaceAll(".", "");
    const priceMaxObj = priceMax ? { "max": priceMax } : {};
    const priceMinObj = priceMin ? { "min": priceMin } : {};

    // Ajax
    defaultParams = { action_type: "comboset-product", combo_id: comboset_id, category_id: category_id, show: 30, page: 1 }; // category ajax params default
    ajaxParams = { ...defaultParams, ...priceMaxObj, ...priceMinObj }; // category ajax params width filter [start price range]

    const response = await Hura.Ajax.get("pcmarket", ajaxParams);
    const loadMore = response.total > parseInt(response.number_per_page) * parseInt(response.page);
    // console.log('ajaxParams', ajaxParams, 'response', response);

    _modalProductRender(response.item_list, loadMore); // products list render
    _modalFilter(response.filter_options); // filters popup render
    _modalPriceSlider(priceMax, priceMin); // filter price range init
    _modalOpen(); // modal open
  }

  // MODAL
  function _modalOpen() {
    $modal.fadeIn();
    $('body').css('overflow', 'hidden');
    document.getElementById("js-pd-combo-popup-main-content").scrollIntoView({ behavior: 'instant' }); // scroll top modal
  }

  function _modalClose() {
    $modal.hide();
    $('body').css('overflow', 'auto');
  }

  // MODAL SEARCH
  function _modalSearch() {
    // form serach submit handle
    $modalSearch.on("submit", function () {
      const search_query = $modalSearchInput.val().trim();
      if (search_query === "") {
        $modalSearchInput.removeClass("active");
        return;
      }

      $modalSearchInput.addClass("active").attr({ "data-id": search_query, "data-name": search_query }); // set input search active and new search query
      _modalFilterSelectSubmit(); // modal filter render new
    })
  }

  function _modalSearchClear() {
    $modalSearchInput.removeClass("active").val("");
  }

  // MODAL FILTER
  function _modalFilter(filters) {
    const html = `
      <div class="pd-combo-popup-filter__list">
        ${_filterGroup()}
        ${_filterPrice()}
        ${_filterBrand()}
        ${_filterAttribute()}
      </div>
    `;
    $modalFilter.html(html);

    // filter group all popup
    function _filterGroup() {
      return `
        <div class="pd-combo-popup-filter__item">
          <button class="pd-combo-popup-filter__item-btn js-pd-combo-filter-popup-btn" type="button" data-group="Bộ lọc" onclick="ComboSetVisual.modalFilterOpen(this);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="15" height="15" fill="#000000">
              <path d="M96 128C83.1 128 71.4 135.8 66.4 147.8C61.4 159.8 64.2 173.5 73.4 182.6L256 365.3L256 480C256 488.5 259.4 496.6 265.4 502.6L329.4 566.6C338.6 575.8 352.3 578.5 364.3 573.5C376.3 568.5 384 556.9 384 544L384 365.3L566.6 182.7C575.8 173.5 578.5 159.8 573.5 147.8C568.5 135.8 556.9 128 544 128L96 128z" />
            </svg>
            Bộ lọc
            <span class="pd-combo-popup-filter__item-btn-selected js-pd-combo-filter-popup-amount">0</span>
          </button>

          <div class="pd-combo-popup-filter__popup js-pd-combo-filter-popup">
            <div class="pd-combo-popup-filter__popup-bg js-pd-combo-filter-popup-bg" onclick="ComboSetVisual.modalFilterClose(this);"></div>
            <div class="pd-combo-popup-filter__popup-content type-2 js-pd-combo-filter-popup-content js-pd-combo-popup-filter-container">
              <h4 class="pd-combo-popup-filter__popup-title type-3">
                <b>Bộ lọc</b>
                <button class="pd-combo-popup-filter__popup-close" type="button" onclick="ComboSetVisual.modalFilterClose(this);">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="15" height="15" fill="#4a5565">
                    <path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"></path>
                  </svg>
                </button>
              </h4>

              <div class="pd-combo-popup-filter__popup-wrapper">
                ${_filterPrice('content') + _filterBrand('content') + _filterAttribute('content')}
              </div>

              <div class="pd-combo-popup-filter__popup-filter-bar">
                <button class="pd-combo-popup-filter__popup-filter-btn btn-clear" type="button" onclick="ComboSetVisual.modalFilterSelectClear(this);">
                  Xóa tất cả
                </button>
                <button class="pd-combo-popup-filter__popup-filter-btn btn-submit" type="button" onclick="ComboSetVisual.modalFilterSelectSubmit(this);">
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // filter brand
    function _filterBrand(option) {
      if (filters.brand.length === 0) return "";
      return _filterPopup(filters.brand, 'brand', 'Thương hiệu', option);
    }

    // filter price
    function _filterPrice(option) {
      if (priceDatabase.length === 0) return "";
      return _filterPopup(priceDatabase, 'price', 'Giá', option);
    }

    // filter attribute
    function _filterAttribute(option) {
      if (filters.attribute.length === 0) return "";

      return filters.attribute.map((item) => {
        return _filterPopup(item.value_list, "filter", item.name, option);
      }).join("");
    }

    // filter display
    function _filterPopup(data, type, title, option) {
      const isPriceSlider = title === "Giá";
      const onlyContent = option === "content";
      const elementType = onlyContent ? "type-2" : "";

      const listValues = data.map((item) => `
        <button class="pd-combo-popup-filter__popup-filter-item js-pd-combo-popup-filter-value" type="button" data-id="${item.id}" data-key="${type}" data-title="${title}" data-name="${item.name}" onclick="ComboSetVisual.modalFilterSelect(this);">
          ${item.name}
        </button>
      `).join(""); // list button [filter item value] in popup

      const closeButton = onlyContent ? "" : `
        <button class="pd-combo-popup-filter__popup-close" type="button" onclick="ComboSetVisual.modalFilterClose(this);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="15" height="15" fill="#4a5565">
            <path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
          </svg>
        </button>
      `; // close popup button

      const clearButton = isPriceSlider ? "" : `
        <button class="pd-combo-popup-filter__popup-filter-btn btn-clear" type="button" onclick="ComboSetVisual.modalFilterSelectClear(this);">
          Xóa tất cả
        </button>
      `; // clear popup button

      const bottomBox = onlyContent ? "" : `
        <div class="pd-combo-popup-filter__popup-filter-bar">
          ${clearButton}

          <button class="pd-combo-popup-filter__popup-filter-btn btn-submit" type="button" onclick="ComboSetVisual.modalFilterSelectSubmit(this);">
            Áp dụng
          </button>
        </div>
      `; // bottom div in popup

      const selectAllButton = isPriceSlider ? "" : `
        <button class="pd-combo-popup-filter__popup-filter-all js-pd-combo-popup-filter-all" type="button" data-state="0" onclick="ComboSetVisual.modalFilterSelectAll(this, '${type}');">
          Chọn tất cả
        </button>
      `; // select all button

      const priceSlider = !isPriceSlider ? "" : `
        <div class="pd-combo-popup-filter__popup-filter-price"> 
          <p class="ui-price-note">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#51a2ff">   
              <path d="M384 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L398.4 160C393.2 185.8 375.5 207.1 352 217.3L352 512L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L128 576C110.3 576 96 561.7 96 544C96 526.3 110.3 512 128 512L288 512L288 217.3C264.5 207 246.8 185.7 241.6 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L256 96C270.6 76.6 293.8 64 320 64C346.2 64 369.4 76.6 384 96zM439.6 384L584.4 384L512 259.8L439.6 384zM512 480C449.1 480 396.8 446 386 401.1C383.4 390.1 387 378.8 392.7 369L487.9 205.8C492.9 197.2 502.1 192 512 192C521.9 192 531.1 197.3 536.1 205.8L631.3 369C637 378.8 640.6 390.1 638 401.1C627.2 445.9 574.9 480 512 480zM126.8 259.8L54.4 384L199.3 384L126.8 259.8zM.9 401.1C-1.7 390.1 1.9 378.8 7.6 369L102.8 205.8C107.8 197.2 117 192 126.9 192C136.8 192 146 197.3 151 205.8L246.2 369C251.9 378.8 255.5 390.1 252.9 401.1C242.1 445.9 189.8 480 126.9 480C64 480 11.7 446 .9 401.1z"/>
            </svg>
            Hoặc chọn mức giá phù hợp với bạn
          </p>

          <div class="ui-price-wrapper">
            <div class="ui-price-child">
              <input type="text" class="ui-price-input js-input-min-price-filter js-input-price-filter min" value="0">
              <input type="hidden" class="ui-price-input js-input-min-price-filter-temp" value="">
              <div class="ui-price-currency">₫</div>
            </div>
            <div class="ui-price-line"></div>
            <div class="ui-price-child">
              <input type="text" class="ui-price-input js-input-max-price-filter js-input-price-filter max" value="0">
              <input type="hidden" class="ui-price-input js-input-max-price-filter-temp" value="">
              <div class="ui-price-currency">₫</div>
            </div>
          </div>

          <div class="ui-price-slider js-slider-range"></div>
          
          <div class="ui-price-selected js-slider-selected" style="display: none;">
            <p style="text-align: center;margin-top: 16px;">
              Đang chọn: 
              <b><span class="js-selected-min-price-filter">0</span></b> - 
              <b><span class="js-selected-max-price-filter">0</span> ₫</b>
            </p>
          </div>
        </div>
      `; // price slider div

      const poupContent = `
        <h4 class="pd-combo-popup-filter__popup-title ${elementType}">
          <b>${title}</b> ${closeButton}
        </h4>

        <div class="pd-combo-popup-filter__popup-filter js-pd-combo-popup-filter-container">
          <div class="pd-combo-popup-filter__popup-filter-bar ${elementType}">
            ${selectAllButton}
          </div>

          <div class="pd-combo-popup-filter__popup-filter-main">
            ${listValues}
          </div>

          ${priceSlider}

          ${bottomBox}
        </div>
      `; // main content in popup

      if (onlyContent) {
        return `<div class="pd-combo-popup-filter__popup-float">${poupContent}</div>`;
      } // return only content for create filter group popup [Bộ lọc]

      return `
        <div class="pd-combo-popup-filter__item">
          <button class="pd-combo-popup-filter__item-btn js-pd-combo-filter-popup-btn" data-group="${title}" type="button" onclick="ComboSetVisual.modalFilterOpen(this);">
            <span>${title}</span>
            <span class="pd-combo-popup-filter__item-btn-selected js-pd-combo-filter-popup-amount">0</span>
          </button>

          <div class="pd-combo-popup-filter__popup js-pd-combo-filter-popup">
            <div class="pd-combo-popup-filter__popup-bg js-pd-combo-filter-popup-bg" onclick="ComboSetVisual.modalFilterClose(this);"></div>
            <div class="pd-combo-popup-filter__popup-content js-pd-combo-filter-popup-content">
              ${poupContent}
            </div>
          </div>
        </div>
      `; // return [filter item] with [button] = open popup, [popup] = show all [filter item value]
    }
  }

  function _modalFilterOpen(_this) {
    const $popup = $(_this).next('.js-pd-combo-filter-popup');
    const popupBgHeight = $modalContent.outerHeight();

    $popup.show().find('.js-pd-combo-filter-popup-content').fadeIn(); // display popup
    $popup.find('.js-pd-combo-filter-popup-bg').css('height', popupBgHeight); // fix popup background fixed height
    $modal.css('overflow', 'hidden');

    _modalFilterSelectedReactive(); // re-addclass 'active' to [selected filter item value]
  }

  function _modalFilterClose(_this) {
    $(_this).closest('.js-pd-combo-filter-popup').hide().find('.js-pd-combo-filter-popup-content').hide();
    $modal.css('overflow', 'auto');
  }

  function _modalFilterReset() {
    ajaxParams = defaultParams;

    _modalSearchClear(); // remove filter search query
    _modalFilterSelectedReactive(); // re-addclass 'active' to [selected filter item value]
    _modalFilterSelectSubmit(); // modal filter render new
  }

  function _modalFilterSelect(_this, active) {
    const id = $(_this).data("id");
    const key = $(_this).data("key");
    const $targets = $(modalFilterButton + `[data-key="${key}"][data-id="${id}"]`);

    // price filter item value click
    if (key === "price") {
      $targets.closest(modalFilterSeletedContainer).find(modalFilterButton).removeClass("selected");
      $targets.toggleClass('selected');

      const priceRange = $targets.data("id").split("-");
      const priceMax = priceRange.length === 1 ? parseInt(priceRange[0]) : parseInt(priceRange[1]);
      const priceMin = priceRange.length === 1 ? 0 : parseInt(priceRange[0]);

      _modalPriceSliderMove(priceMin, priceMax); // set new price filter range
      return;
    }

    // normal filter item value click
    if (active === "remove") $targets.removeClass('active');
    else if (active === "add") $targets.addClass('active');
    else $targets.toggleClass('active');
  }

  function _modalFilterSelectAll(_this, type) {
    const state = $(_this).attr("data-state");
    const $values = $(_this).closest(modalFilterSeletedContainer).find(modalFilterButton);

    if (state === "1") { // remove all [selected filter item value]
      _selectLoop('remove');
      $(_this).attr("data-state", "0").html("Chọn tất cả");
    } else {
      _selectLoop('add'); // select all [filter item value]
      $(_this).attr("data-state", "1").html("Bỏ chọn tất cả");
    }

    // loop per group filter item value
    function _selectLoop(action) {
      $values.each(function () {
        _modalFilterSelect(this, action);
      })
    }
  }

  function _modalFilterSelectClear(_this) {
    const allButtons = $(_this).closest(modalFilterSeletedContainer).find(modalFilterSeletedAll);

    allButtons.each(function () {
      $(this).attr("data-state", "1");
      _modalFilterSelectAll(this);
    })
  }

  function _modalFilterSelectSubmit(_this) {
    // create new ajax params by [selected filter item value] element has class '.js-pd-combo-popup-filter-value.active'
    const selected = modalFilterButton + '.active';
    const selectedData = $(selected).toArray().map((item) => {
      return {
        id: $(item).attr("data-id"),
        key: $(item).attr("data-key"),
        title: $(item).attr("data-title"),
        name: $(item).attr("data-name")
      };
    }); // all [selected filter item value] data 

    const selectedUnique = selectedData.filter((obj, index, self) => index === self.findIndex((o) => o.key === obj.key && o.id === obj.id)); // remove duplicate [selected filter item value]
    const selectedGroupIds = selectedUnique.reduce((accumulator, currentItem) => {
      const key = currentItem.key;
      if (!accumulator[key]) accumulator[key] = "";
      accumulator[key] = accumulator[key] ? accumulator[key].concat("-", currentItem.id) : currentItem.id;
      return accumulator;
    }, {}); // create group [selected filter ajax params] object

    ajaxParams = { ...defaultParams, ...selectedGroupIds, page: 1 };
    _modalProductLoad(); // render new filtered product list
    _modalFilterSelected(selectedUnique); // render new [selected filter item value]
    _modalFilterClose(_this); // close modal
  }

  function _modalFilterSelected(filters) {
    _modalFilterSelectedCalc({}); // remove highlight [selected filter group]

    if (filters.length === 0) {
      $modalFilterSeleted.html("");
      return;
    }

    const selectedGroupName = filters.reduce((accumulator, currentItem) => {
      const title = currentItem.title;
      if (!accumulator[title]) {
        accumulator[title] = { key: [], title: title, list: "", ids: [] };
      }
      accumulator[title].list = accumulator[title].list ? accumulator[title].list.concat(", ", currentItem.name) : currentItem.name;
      accumulator[title].ids.push(currentItem.id);
      accumulator[title].key.push(currentItem.key);
      return accumulator;
    }, {}); // create [selected filter group] obj

    const selectedGroupData = Object.values(selectedGroupName); // create [selected filter group] array
    const selectedGroupClear = selectedGroupData.length > 1 ? '<button type="button" onclick="ComboSetVisual.modalFilterReset();" style="color: #2b7fff;">Xóa tất cả</button>' : ''; // filter clear all
    const selectedGroupHTML = selectedGroupData.map((item) => {
      const itemKey = [...new Set(item.key)].join("-"); // remove duplicate same key
      const itemList = item.title === "Giá" ? item.ids.map((item) => parseInt(item)).sort((a, b) => a - b).map((item) => formatCurrency(item) + "đ").join(" - ") : item.list; // group [selected filter item value] name

      return `
        <button class="pd-combo-popup-selected__item js-filter-selected" type="button" data-key="${itemKey}" data-ids="${item.ids.join('-')}" onclick="ComboSetVisual.modalFilterSelectedRemove(this);">
          <b>${item.title}:</b>
          <span class="pd-combo-popup-selected__item-name">${itemList}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="10" height="10" fill="#4a5565">
            <path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
          </svg>
        </button>
      `;
    }).join("");

    $modalFilterSeleted.html(selectedGroupHTML + selectedGroupClear); // render new [selected filter group] display
    _modalFilterSelectedCalc(selectedGroupName); // highlight [selected filter group]
  }

  function _modalFilterSelectedCalc(filters) {
    const groupHolder = ".js-pd-combo-filter-popup-btn";
    const groupTotal = Object.keys(filters).length;

    if (groupTotal === 0) {
      $(groupHolder).removeClass("active");
      return;
    }

    const groupMain = { "title": "Bộ lọc", "ids": [...Array(groupTotal).keys()] };
    const groupList = [...Object.values(filters), groupMain];
    groupList.forEach(function (item) {
      const title = item.title;
      const total = item.title === "Giá" ? 1 : item.ids.length;
      $(groupHolder + `[data-group="${title}"]`).addClass("active").find(".js-pd-combo-filter-popup-amount").html(total);
    })
  }

  function _modalFilterSelectedReactive() {
    $(modalPriceSelected).hide(); // hide [price selected slider] note
    $(modalFilterButton).removeClass("active").removeClass("selected"); // remove class 'active' all [filter item value]

    // check filter ajax params exit
    const currentFilter = ajaxParams["filter"] ? ajaxParams["filter"].split("-") : [];
    const currentBrand = ajaxParams["brand"] ? ajaxParams["brand"].split("-") : [];
    const currentSearch = ajaxParams["q"] ? ajaxParams["q"] : "";
    const currentPrice = ajaxParams["price"] ? ajaxParams["price"].split("-") : [];
    const currentPriceMax = ajaxParams["max"] ? ajaxParams["max"] : "";
    const currentPriceMin = ajaxParams["min"] ? ajaxParams["min"] : "";

    // re-addclass 'active' [selected filter item value]
    if (currentPrice.length) currentPrice.forEach((id) => $(modalFilterButton + `[data-key="price"][data-id="${id}"]`).addClass("active"));
    if (currentFilter.length) currentFilter.forEach((id) => $(modalFilterButton + `[data-key="filter"][data-id="${id}"]`).addClass("active"));
    if (currentBrand.length) currentBrand.forEach((id) => $(modalFilterButton + `[data-key="brand"][data-id="${id}"]`).addClass("active"));
    if (currentSearch) $(modalFilterButton + `[data-key="q"]`).addClass("active");
    if (currentPriceMax) $(modalFilterButton + `[data-key="max"]`).addClass("active");
    if (currentPriceMin) $(modalFilterButton + `[data-key="min"]`).addClass("active");

    // re-active price slider
    if (currentPriceMax || currentPriceMin) {
      $(modalPriceSelected).show();

      const defaultPriceMax = currentPriceMax ? currentPriceMax : priceDataMax;
      const defaultPriceMin = currentPriceMin ? currentPriceMin : 0;
      _modalPriceSliderMove(defaultPriceMin, defaultPriceMax);
    }

    // reset [button select all] ("Chọn tất cả")
    $(modalFilterSeletedAll).each(function() {
    const totalValue = $(this).closest(modalFilterSeletedContainer).find(modalFilterButton).length;
    const totalSelected = $(this).closest(modalFilterSeletedContainer).find(modalFilterButton + ".active").length;
    
    if (totalValue === totalSelected) {
      $(this).html('Bỏ chọn tất cả').attr("data-state", "1");
      return;
    }

    $(this).html('Chọn tất cả').attr("data-state", "0");
    }); 
  }

  function _modalFilterSelectedRemove(_this) {
    const ids = $(_this).attr("data-ids").split("-");
    const keys = $(_this).attr("data-key").split("-");

    // remove class 'active' and value of [remove filter item value]
    keys.forEach((key) => {
      const selected = ajaxParams[key].split("-");
      const rest = selected.filter((item) => !ids.filter((id) => id === item).length).join("-");
      ajaxParams = { ...ajaxParams, [key]: rest, page: 1 };

      if (key === "q") _modalSearchClear(); // remove filter search query
    })

    _modalFilterSelectedReactive(); // re-addclass 'active' to [selected filter item value]
    _modalFilterSelectSubmit(); // modal filter render new
  }

  // MODAL PRODUCTS
  function _modalProductRender(item_list, loadMore) {
    let html = '<b style="grid-column: span 6;font-size: 18px;text-align: center;color: red;padding: 24px 0;">Không tìm thấy sản phẩm phù hợp...<br/>Vui lòng chọn thêm bộ lọc mới hoặc xóa bỏ bớt bộ lọc hiện tại.</b>';

    if (item_list.length > 0) {
      html = item_list.map((item) => {
        const marketPrice = item.marketPrice ? item.marketPrice : item.sale_rules.normal_price; // if no market-price, replace normal-price
        const price = item.price; // price combo
        const priceOff = marketPrice > price ? Math.ceil((marketPrice - price) * 100 / marketPrice) : 0; // discount percent
        const priceDiscount = marketPrice > price ? marketPrice - price : 0; // discount number

        return `
          <div class="pd-combo-popup-product js-pd-combo-popup-product js-pd-combo-item" data-comboset-id="${ajaxParams.combo_id}" data-category-id="${ajaxParams.category_id}" data-product-id="${item.id}" data-product-price="${price}" data-product-priceoff="${priceDiscount}"> 
            <div class="pd-combo-popup-product__check template-display">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#4ADE80"></circle><path d="M7 12L10 15L17 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <a class="pd-combo-popup-product__image" href="${item.productUrl}" target="_blank" rel="noopener noreferrer">
              <p class="pd-combo-popup-product__picture">
                <img src="${item.productImage.large}" alt="${item.productName}" width="250" height="250">
              </p>
            </a>
            <a href="${item.productUrl}" target="_blank" rel="noopener noreferrer">
              <h4 class="pd-combo-popup-product__name" title="${item.productName}">${item.productName}</h4>
            </a>
            <div class="pd-combo-popup-product__price">
              <p class="pd-combo-popup-product__price-wrapper">
                <del class="pd-combo-popup-product__price-market">
                  ${marketPrice > price ? formatCurrency(marketPrice) + 'đ' : ''}
                </del>
                ${marketPrice > price ? '<span class="pd-combo-popup-product__price-off">-' + priceOff + '%</span>' : ''}
              </p>
              <p class="pd-combo-popup-product__price-sale">
                ${price > 0 ? formatCurrency(price) + 'đ' : 'Liên hệ'}
              </p>
              <p class="pd-combo-popup-product__price-discount">
                ${marketPrice > price ? 'Giảm ' + formatCurrency(priceDiscount) + 'đ' : ''}
              </p>
            </div>
            <div class="pd-combo-popup-product__wrapper popup-display">
              <a class="pd-combo-popup-product__btn btn-view" href="${item.productUrl}" target="_blank" rel="noopener noreferrer">
                Chi tiết
              </a>
              <button class="pd-combo-popup-product__btn btn-select" type="button" onclick="ComboSetVisual.selectProduct(this);">
                Chọn
              </button>
            </div>
            <div class="pd-combo-popup-product__wrapper template-display">
              <button class="pd-combo-popup-product__btn btn-view type-2 btn-cancel" type="button" onclick="ComboSetVisual.removeProduct(this);">
                Xóa
              </button>
              <button class="pd-combo-popup-product__btn btn-select type-2 btn-again" type="button" onclick="ComboSetVisual.categoryOpen('${ajaxParams.combo_id}', '${ajaxParams.category_id}');">
                Sản phẩm khác
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    ajaxParams.page === 1 ? $modalProducts.html(html) : $modalProducts.append(html); // [page=1] = html, [page=+2] = append
    loadMore ? $modalViewMore.show() : $modalViewMore.hide(); // next page: [exit] = display , [no exit] = hide [button 'Xem thêm']
  }

  function _modalProductMore() {
    const pageNew = parseInt(ajaxParams["page"]) + 1; // next page = current page + 1
    ajaxParams = { ...ajaxParams, page: pageNew };
    _modalProductLoad(); // render product list next page
  }

  function _modalProductSort(_this, sort) {
    $modalSortButton.removeClass("active");
    $(_this).addClass("active");

    ajaxParams = { ...ajaxParams, page: 1, sort: sort };
    defaultParams = { ...defaultParams, sort: sort };
    _modalProductLoad(); // render product list width sort
  }

  function _modalProductLoad() {
    if (ajaxParams['page'] === 1) {
    $modalProducts.html('<div class="pd-combo-loader"></div>'); // loading wait
    document.getElementById("js-pd-combo-popup-main-content").scrollIntoView({ behavior: 'instant' }); // scroll top modal
    }

    Hura.Ajax.get("pcmarket", ajaxParams).then(function (response) {
      // console.log('ajaxParams', ajaxParams, 'response', response);

      const loadMore = response.total > parseInt(response.number_per_page) * parseInt(response.page); // next page exit? 
      _modalProductRender(response.item_list, loadMore); // render product list
    });
  }

  // MODAL PRICE SLIDER
  function _modalPriceSlider(priceMax, priceMin) {
    const default_max = priceDataMax;
    const default_min = 0;
    const current_max = priceMax ? parseInt(priceMax) : default_max;
    const current_min = priceMin ? parseInt(priceMin) : default_min;

    _modalPriceSliderMove(current_min, current_max); // price slider handle while drag
    _modalPriceSliderInput(current_min, current_max); // price input handle

    var options = {
      range: true,
      min: default_min,
      max: default_max,
      values: [current_min, current_max],
      step: 100000,
      slide: function (event, ui) {
        var min = current_min, max = current_max;
        _modalPriceSliderMove(ui.values[0], ui.values[1]);
      },
    }, min, max;

    $(modalPriceSlider).slider(options);

    // display [price filter] while category modal open
    const priceFilter = [];
    if (priceMax) priceFilter.push({ id: priceMax, name: priceMax, key: "max", title: "Giá" });
    if (priceMin) priceFilter.push({ id: priceMin, name: priceMin, key: "min", title: "Giá" });
    _modalFilterSelected(priceFilter);
  }

  function _modalPriceSliderInput() {
    $('.js-input-price-filter').on('change', function () {
      const inputValue = $(this).val().split('.').join('');
      let minValue = $('.js-input-min-price-filter-temp').val();
      let maxValue = $('.js-input-max-price-filter-temp').val();

      if ($(this).hasClass('min')) minValue = inputValue;
      else maxValue = inputValue;

      _modalPriceSliderMove(minValue, maxValue); // price slider handle while set new max, min price filter input
    })
  }

  function _modalPriceSliderMove(min, max) {
    const minValue = parseInt(min) ? parseInt(min) : 0;
    const maxValue = parseInt(max) ? parseInt(max) : priceDataMax;
    const priceMin = minValue > maxValue ? maxValue : minValue;
    const priceMax = minValue > maxValue ? minValue : maxValue;

    $('.js-input-min-price-filter-temp').val(priceMin);
    $('.js-input-max-price-filter-temp').val(priceMax);
    $('.js-input-min-price-filter').val(formatCurrency(priceMin));
    $('.js-input-max-price-filter').val(formatCurrency(priceMax));
    $('.js-selected-min-price-filter').html(formatCurrency(priceMin));
    $('.js-selected-max-price-filter').html(formatCurrency(priceMax));

    _modalPriceSliderFilter(priceMin, priceMax); // set new value [filter price item value]
  }

  function _modalPriceSliderFilter(priceMin, priceMax) {
    $("#js-pd-combo-popup-filter-price-min").addClass("active").attr({ "data-id": priceMin, "data-name": priceMin, "data-title": "Giá" }); // select filter price max
    $("#js-pd-combo-popup-filter-price-max").addClass("active").attr({ "data-id": priceMax, "data-name": priceMax, "data-title": "Giá" }); // select filter price max

    $(modalPriceSelected).show();
    if ($(modalPriceSlider).hasClass("ui-slider")) $(modalPriceSlider).slider("values", [priceMin, priceMax]); // set new [positon price] of [drag button] in [price slider]
  }

  // HANDLE
  return {
    setUp: _setUp,
    checkout: _checkout,
    categoryOpen: _categoryOpen,
    removeProduct: _removeProduct,
    selectProduct: _selectProduct,
    calcPriceVariant: _calcPriceVariant,
    modalClose: _modalClose,
    modalSort: _modalProductSort,
    modalProductMore: _modalProductMore,
    modalFilterOpen: _modalFilterOpen,
    modalFilterClose: _modalFilterClose,
    modalFilterReset: _modalFilterReset,
    modalFilterSelect: _modalFilterSelect,
    modalFilterSelectedRemove: _modalFilterSelectedRemove,
    modalFilterSelectAll: _modalFilterSelectAll,
    modalFilterSelectClear: _modalFilterSelectClear,
    modalFilterSelectSubmit: _modalFilterSelectSubmit,
  }
})();