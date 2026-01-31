/**
 * File file requires BuildPC.js file. Custom display for each client
 * Dependency: window.BUILD_PRODUCT_TYPE
 */
var BuildPCVisual = function (_objBuildPC) {
  let open_product_info;
  let open_category_info;

  const objBuildPC = _objBuildPC;
  //const BUILD_PRODUCT_TYPE = (typeof window.BUILD_PRODUCT_TYPE !== 'undefined') ? window.BUILD_PRODUCT_TYPE : 'buildpc';
  const BUILD_PRODUCT_TYPE = objBuildPC.getBuildId();
  const ACTION_URL = "/ajax/get_json.php";
  const $layout_container = $("#js-buildpc-layout");
  const $modal_container = $("#js-modal-popup");
  const $summary_holder = $(".js-config-summary");

  // template
  const row_tpl = `
    <div class="item-drive">
      <p class="item-title">{{counter}}. {{name}}</p>
      <div class="item-drive-info js-item-drive-info" data-category_info='{{info}}'>
        <div id="js-selected-item-{{id}}" data-id="{{id}}" class="js-item-row"></div>
        <button class="js-open-selection open-selection" id="js-open-selection-{{id}}">
          <span class="open-selection-default"><i class="fa fa-plus"></i> Chọn {{name}}</span>
          <span class="open-selection-multi"><i class="fa fa-plus"></i> Chọn thêm</span>
        </button>
      </div>
    </div>
  `;

  const product_tpl = `
    <div class="contain-item-drive js-item-drive" data-category_id="{{category_id}}" data-item_id="{{id}}" data-product_id="{{productId}}" data-variant_id="{{variant_id}}" data-current_stock="20">
      <a target="_blank" href="{{url}}" class="item-img">{{image}}</a>

      <div class="item-text">
          <div class="item-left">
            <a href="{{url}}" target="_blank" class="item-name">{{name}}</a>
            <p>- Kho hàng: {{stock_status}}</p>
            {{sku}}
            {{variant_title}}
            {{warranty}}
            {{specialOffer}}
          </div>

          <div class="item-right">
            <div class="item-quantity-group">
              <b class="js-item-price">{{price}} đ</b>
              <span>x</span>
              <input type="number" class="js-item-quantity item-quantity" value="{{quantity}}" min="1" max="50" />
              <span>=</span>
              <b class="item-price js-item-total-price">{{price_sum}} đ</b>
            </div>

            <div class="item-button-group">
              <button type="button" title="Thay đổi" aria-label="Thay đổi" class="btn-action_seclect show-popup_select fa fa-edit js-edit-item"></button>
              <button type="button" title="Xóa sản phẩm" aria-label="Xóa sản phẩm" class="btn-action_seclect delete_select fa fa-trash remove-item js-remove-item"></button>
            </div>
          </div>
      </div>
    </div>
  `;

  const summary_tpl = `<span class="total-price-config">{{total_value}} đ</span><span>{{static_text}}</span>`;

  const loading_tpl = `<i class="buildpc-loading fa fa-spinner fa-spin"></i>`;

  // layout handle
  function showLayout() {
    // display layout container
    var html = category_config
      .map(function (item, index) {
        return translateTemplate(
          {
            counter: index + 1,
            id: item.id,
            name: item.name,
            info: JSON.stringify(item),
          },
          row_tpl
        );
      })
      .join("");
    $layout_container.html(html);

    // show summary
    displaySelectedConfigSummary();

    // remove previous listener if exist
    $layout_container.off("click");
    $layout_container.off("change");
    $modal_container.off("click");

    // layout listener on click
    $layout_container.on("click", function (e) {
      var $target = $(e.target);
      var $container = $target.closest(".js-item-drive-info");
      if ($container.length === 0) return;

      var category_info = $container.data("category_info");
      var category_id = category_info.id;

      // open category popup
      if ($target.hasClass("js-open-selection") || $target.parents(".js-open-selection").length) {
        showProductListToSelect(category_info);
        return true;
      }

      // edit product
      if ($target.hasClass("js-edit-item")) {
        var $product = $target.closest(".js-item-drive");
        var item_id = $product.data("item_id");
        var product_id = $product.data("product_id");
        var variant_id = $product.data("variant_id");

        open_product_info = {
          id: item_id,
          productId: product_id,
          variant_id: variant_id,
        };

        showProductListToSelect(category_info);
        return true;
      }

      // remove product
      if ($target.hasClass("js-remove-item")) {
        var $product = $target.closest(".js-item-drive");
        var item_id = $product.data("item_id");
        var product_id = $product.data("product_id");
        var variant_id = $product.data("variant_id");
        var product_holder = `.js-item-drive[data-product_id="${product_id}"][data-variant_id="${variant_id}"]`;

        const display_callback = function (category_id, item_id) {
          const category_exit = objBuildPC.getConfig()[category_id];
          const category_class = category_exit ? "" : "item-loaded item-multi-seletect";

          $("#js-selected-item-" + category_id)
            .closest(".js-item-drive-info")
            .removeClass(category_class)
            .find(product_holder)
            .remove();

          saveConfig();
        };

        objBuildPC.removeItem(category_id, item_id, display_callback);
        displaySelectedConfigSummary();

        return true;
      }
    });

    // layout product quantity change
    $layout_container.on("change", function (e) {
      var $target = $(e.target);
      var $product = $target.closest(".js-item-drive");
      var product_id = $product.data("product_id");
      var category_id = $product.data("category_id");

      // change product quantity
      if ($target.hasClass("js-item-quantity")) {
        var product_price = parseInt(parsePrice($product.find(".js-item-price").html()));
        var product_quantity = parseInt($product.find(".js-item-quantity").val());
        var new_quantity = product_quantity < 1 ? 1 : product_quantity;
        var new_price = new_quantity * product_price;

        objBuildPC.updateItem(category_id, product_id, "quantity", new_quantity);
        objBuildPC.updateItem(category_id, product_id, "price_sum", new_price);
        $product.find(".js-item-total-price").html(writeStringToPrice(new_price) + " đ");

        saveConfig();
        return true;
      }
    });

    // modal listener
    $modal_container.on("click", function (e) {
      var $target = $(e.target);
      var product_id = $target.data("id");

      // add product to config
      if ($target.hasClass("js-select-product")) {
        selectProduct(product_id);
        return;
      }

      // add product variant to config
      if ($target.hasClass("js-open-variant-popup")) {
        showVariant(product_id);
        return;
      }
    });
  }

  // load product selection
  function showProductListToSelect(category_info) {
    // startup
    $modal_container.html(loading_tpl);
    open_category_info = Object.assign({}, category_info);
    // send currently selected parts so we can narrow the related parts
    var current_selected_parts = []; // pc_part_id
    var current_config = objBuildPC.getConfig();
    for (var cat_id in current_config) {
      if (current_config.hasOwnProperty(cat_id) && current_config[cat_id].hasOwnProperty("items") && current_config[cat_id]["items"].length > 0) {
        var cat_parts = current_config[cat_id]["items"].map((item) => item.id + "-" + cat_id);
        current_selected_parts.push(cat_parts);
      }
    }

    var params = {
      action: "pcbuilder",
      action_type: "get-product-category",
      category_id: category_info.id,
      pc_part_id: current_selected_parts.join(","),
      sort: "order",
    };

    Hura.Ajax.get("pcbuilder", params).then(function (data) {
      renderAjaxData(data);

      if ($(".fancybox__container").length) return;
      Fancybox.show([{ src: "#js-modal-popup" }]);
    });
  }

  // render popup template
  function renderAjaxData(data) {
    // popup
    const html = Hura.Template.parse(buildPc_popup_tpl, data);
    Hura.Template.render("#js-modal-popup", html);
    // product list
    const productTpl = Hura.Template.parse(prodTpl, Object.values(data.product_list));
    Hura.Template.render("#js-holder-p_item", productTpl);
    // paging
    const paging_ = Hura.Template.parse(paging_item, data.paging_collection);
    Hura.Template.render(".js-paging", paging_);
    // filter brand
    if (typeof data.brand_filter_list != "undefined" && data.brand_filter_list != "") {
      const brand_filter = Hura.Template.parse(filter_tpl, Object.values(data.brand_filter_list));
      Hura.Template.render("#js-brand-filter", `<p class="filter-name">Hãng sản xuất</p><div class="filter-list-holder">${brand_filter}</div>`);
    }
    // filter price
    if (typeof data.price_filter_list != "undefined" && data.price_filter_list != "") {
      const price_filter = Hura.Template.parse(filter_tpl, data.price_filter_list);
      Hura.Template.render("#js-price-filter", `<p class="filter-name">Khoảng giá</p><div class="filter-list-holder">  ${price_filter} </div>`);
    }
    // filter attribute
    if (typeof data.attribute_filter_list != "undefined" && data.attribute_filter_list != "") {
      const attr_filter = Hura.Template.parse(filter_attribute, data.attribute_filter_list);
      Hura.Template.render("#js-attr-list", attr_filter);
    }
    // sort
    const sort_default = data.search_url.split("&sort=")[0] + "&sort=order";
    const sort_options = data.sort_by_collection
      .map(function (item) {
        const is_selected = item.key == data.sort_option ? "selected" : "";
        return `<option value="${item.url}" ${is_selected}>${item.name}</option>`;
      })
      .join("");
    const sort_html = '<option value="' + sort_default + '">Tùy chọn</option>' + sort_options;
    Hura.Template.render("#js-sort-holder", sort_html);
    // search
    const $input = $("#js-buildpc-search-keyword");
    $input.val(data.search_query);
    // close
    if ($(".js-modal-button-close").length) return;
    $modal_container.append(
      '<button data-fancybox-close="" class="f-button is-close-btn js-modal-button-close" title="Close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" tabindex="-1"><path d="M20 20L4 4m16 0L4 20"></path></svg></button>'
    );
  }

  // tim kiem popup
  function showProductSearch() {
    const $input = $("#js-buildpc-search-keyword");
    const search_query = $input.val();

    if (search_query.length < 2) {
      alert("Vui lòng nhập tối thiểu 2 ký tự để tìm kiếm sản phẩm!");
      return false;
    }

    const $form = $("#js-buildpc-search-form");
    const search_url = $form.attr("data-url");
    objBuildPCVisual.showProductFilter(search_url + "&q=" + encodeURIComponent(search_query));

    return false;
  }

  // loc kho hang theo tat ca
  function showAllProductFilter(filter_all_url) {
    $modal_container.html(loading_tpl);

    const filterAll = filter_all_url.split("&storeId");
    $.get(filterAll[0], {}, function (data) {
      $modal_container.html(data);
    });
  }

  // product filter
  function showProductFilter(filter_url) {
    if (filter_url === "") {
      return;
    }

    $modal_container.html(loading_tpl);
    Hura.Ajax.getUrl(filter_url).then(function (data) {
      renderAjaxData(data);
    });
  }

  // product filter clear
  function showProductFilterClear() {
    showProductListToSelect(open_category_info);
  }

  // buildpc promotion
  function checkPromotionByCondition(current_value, arr_category_list) {
    let url = "/ajax/get_json.php?action=promotion&action_type=condition";
    var params = {
      action: "promotion",
      action_type: "check",
      k: objBuildPC.build_id,
      value: current_value,
      category: arr_category_list.join("-"),
    };

    Hura.Ajax.get("pcbuilder", params).then(function (res) {
      if (res.status !== "success") {
        window["showUserBuildPCPromotion"]("", "");
        return;
      }

      if (typeof window["showUserBuildPCPromotion"] == "function") {
        window["showUserBuildPCPromotion"](res.data.promotion, res.data.title);
      } else {
        console.error("You need to define function showUserBuildPCPromotion(promotion_html, promotion_title) { alert(promotion_html) }");
      }
    });
  }

  // buildpc summary
  function getConfigSummary() {
    var pc_config = objBuildPC.getConfig();
    var total_value = 0,
      total_quantity = 0,
      total_item = 0;
    var static_text = " ";

    for (var category_id in pc_config) {
      if (pc_config.hasOwnProperty(category_id)) {
        pc_config[category_id].items.forEach((item) => {
          total_value += item.price * item.quantity;
          total_quantity += item.quantity;
          total_item += 1;
        });
      }
    }

    return {
      total_value,
      total_quantity,
      total_item,
      static_text,
    };
  }

  // display total value & items
  function displaySelectedConfigSummary() {
    var summary = getConfigSummary();

    if ($summary_holder) {
      $summary_holder.html(
        translateTemplate(
          {
            total_value: writeStringToPrice(summary.total_value),
            total_quantity: summary.total_quantity,
            total_item: summary.total_item,
            static_text: summary.static_text,
          },
          summary_tpl
        )
      );
    }
    // show promotion
    checkPromotionByCondition(summary.total_value, Object.keys(objBuildPC.getConfig()));
  }

  // show currently selected config
  function showSelectedConfig() {
    $.get(
      ACTION_URL,
      {
        action: "pcbuilder",
        action_type: "get-summary",
        category_id: category_id,
      },
      function (data) {
        $modal_container.html(data);
      }
    );
  }

  // display product in buildpc page
  function displayProductInCategory(category_id) {
    const $holder = $("#js-selected-item-" + category_id);
    const category_info = $holder.closest(".js-item-drive-info").data("category_info");
    const category_class = category_info.multi_select ? "item-loaded item-multi-seletect" : "item-loaded";

    const products_list = objBuildPC.getConfig()[category_id].items;
    const products_tpl = products_list.map((product_info) =>
      translateTemplate(
        {
          id: product_info.id,
          productId: product_info.productId,
          category_id: category_id,
          image: `<img src="${product_info.image}">`,
          name: product_info.name,
          quantity: product_info.quantity,
          url: product_info.url,
          price: writeStringToPrice(product_info.price),
          price_sum: writeStringToPrice(Number(product_info.price) * Number(product_info.quantity)),
          sku: product_info.sku ? `<p>- Mã SP: <b style="color: #d91605">${product_info.sku}</b> </p>` : "",
          stock_status: product_info.stock > 0 ? '<b style="color: #00a400;">Còn hàng</b>' : '<b style="color: #ff0000;">Hết hàng</b>',
          warranty: product_info.warranty ? `<p>- Bảo hành: <b style="color: #d91605;">${product_info.warranty}</b> </p>` : "",
          variant_title: product_info.variant_title != "" ? `- Bạn chọn: <b style="color: #0c0cd0;">${product_info.variant_title}</b>` : "",
          variant_id: product_info.variant_id,
          specialOffer: specialOffer(product_info),
        },
        product_tpl
      )
    );

    $holder.html(products_tpl).closest(".js-item-drive-info").addClass(category_class);

    // get special offer html
    function specialOffer(product_info) {
      let offer_list = [];

      // Khuyến mãi
      if (product_info.specialOffer) {
        // 1. Khuyến mại riêng
        if (product_info.specialOffer.other) {
          offer_list.push(`<div class="item"> ${product_info.specialOffer.other[0].title} </div>`);
        }

        // 2. Khuyến mại theo sản phẩm
        // 2.1. Quà tặng
        if (product_info.specialOffer.gift) {
          var gift = product_info.specialOffer.gift;
          gift.forEach(function (item) {
            var url = item.url != "" ? `<a href="${item.url}" target="_blank">Xem chi tiết</a>` : "";
            offer_list.push(`<div class="item"><span>${item.title}</span> ${url}</div>`);
          });
        }
        // 2.2. Sản phẩm
        if (product_info.specialOffer.product) {
          var product = product_info.specialOffer.product;
          product.forEach(function (item) {
            var url = item.url != "" ? `<a href="${item.url}" target="_blank">Xem chi tiết</a>` : "";
            offer_list.push(`<div class="item"><span> ${item.title} </span> ${url}</div>`);
          });
        }
        // 2.3. Dịch vụ
        if (product_info.specialOffer.service) {
          var service = product_info.specialOffer.service;
          service.forEach(function (item) {
            var url = item.url != "" ? `<a href="${item.url}" target="_blank">Xem chi tiết</a>` : "";
            offer_list.push(`<div class="item"><span> ${item.title} </span> ${url}</div>`);
          });
        }
      }

      // Nhóm khuyến mại
      if (product_info.specialOfferGroup) {
        var offerGroup = Object.values(product_info.specialOfferGroup);

        offerGroup.forEach(function (item) {
          offer_list.push(`<div class="specialOfferGroup-container"><p class="group-title">` + item.title + `</p>`);
          Object.values(item.promotion).forEach(function (promotion) {
            var url = promotion.url != "" ? `<a href="${promotion.url}" target="_blank">Xem chi tiết</a>` : "";
            offer_list.push(`<div class="item"><span> ${promotion.title} </span> ${url}</div>`);
          });
          offer_list.push(`</div>`);
        });
      }

      if (offer_list.length > 0) {
        return `
          <div class="p-offer-container">
            <p class="box-title" onclick="$(this).parents('.p-offer-container').toggleClass('active');">Khuyến mãi của sản phẩm</p>
            <div class="offer-list-group">${offer_list.join("")}</div>
          </div>
        `;
      }

      return "";
    }
  }

  // select product to buildpc list
  function selectProduct(product_id) {
    const category_info = open_category_info;

    // check if category has same product, return display
    if (objBuildPC.isItemInCategory(category_info.id, product_id)) {
      hideModal();
      return false;
    }

    Hura.Ajax.get("product", { action_type: "basic-info", id: product_id }).then(function (product_info) {
      const item_info = {
        id: product_info.id, // product_info.id + '_' + 0,
        productId: product_info.productId,
        name: product_info.productName,
        url: product_info.productUrl,
        image: product_info.productImage.large,
        sku: product_info.productSKU,
        description: product_info.productSummary,
        warranty: product_info.warranty,
        stock: product_info.quantity,
        quantity: 1,
        price: parseInt(product_info.price),
        price_sum: parseInt(product_info.price),
        variant_id: 0,
        variant_title: "",
        note: "",
        specialOffer: product_info.specialOffer ? product_info.specialOffer : "",
        specialOfferGroup: product_info.specialOfferGroup ? product_info.specialOfferGroup : "",
      };

      addProductToList(category_info, item_info);
    });
  }

  // product variant popup
  let open_variant_product_info;
  const $variant_popup = $("#js-popup-select-variant-container");
  const $variant_product = $("#js-popup-select-variant-product");
  const $variant_container = $("#js-popup-select-variant-holder");

  function showVariant(product_id) {
    Hura.Ajax.get("product", { action_type: "basic-info", id: product_id }).then(function (product_info) {
      open_variant_product_info = product_info;

      $variant_popup.show();
      $variant_product.html(_productHTML());
      $variant_container.html(product_info.variant_built);

      Hura.Variant.start({ auto_select: true });
      Hura.Variant.registerMiddleWare("ON_VARIANT_SELECTED", function (variant_info) {
        $(".variant-option-label").each(function () {
          const key = $(this).parents("tr").attr("data-key");
          const label = variant_info.attribute[key];
          $(this).find(".js-variant-label").html(label);
        });

        const product_image = open_variant_product_info.productImage.large;
        const variant_image = variant_info.image && variant_info.image !== "0" ? variant_info.image.replace("75_", "250_") : product_image;
        const variant_price = variant_info.price > 0 ? writeStringToPrice(variant_info.price) + "đ" : "Liên hệ";

        $("#js-popup-product-item-price").html(variant_price);
        $("#js-popup-product-item-picture").attr("src", variant_image);
      });

      // product variant setup
      _setupVariant();

      // product variant handle
      function _setupVariant() {
        $(".js-variant-option-value").each(function () {
          const key = $(this).attr("data-key");
          const value = $(this).attr("data-value");
          const info = product_info.variant_option[key].values.filter(function (item) {
            return item.label === value;
          })[0];
          const code = info.code;
          const image = info.image;

          // change option title
          $(this).attr("title", value);
          // change if option has [data-image] = [background image] || Prioritize
          if (image) {
            $(this)
              .addClass("js-variant-image")
              .css("background-image", "url(" + image + ")");
            return;
          }
          // change if option has [data-code] = [background color]
          if (code) {
            $(this).addClass("js-variant-color").css("background", code);
            return;
          }
        });

        $(".variant-option-label").each(function () {
          $(this).append(': <b class="js-variant-label" style="margin-left: 8px;color: #b80000;"></b>');
        });

        $(".js-variant-option-value").click(function () {
          $(this).parents("td").find(".js-variant-option-value").removeClass("selected");
          $(this).addClass("selected");
        });

        $(".js-variant-option-container .variant-option-value-box:first-child .js-variant-option-value").click();
      }

      // product info display
      function _productHTML() {
        var product_sku = product_info.productSKU != "" ? '<p class="ppi-sku"> <b>Mã SP: </b> ' + product_info.productSKU + "</p>" : "";
        var product_price = product_info.price > 0 ? writeStringToPrice(product_info.price) : "Liên hệ";

        return `
          <div class="popup-product-item">
            <a class="ppi-image" href="${product_info.productUrl}" target="_blank">
              <img class="ppi-picture" id="js-popup-product-item-picture" src="${product_info.productImage.large}" alt="${product_info.productName}" width="80" height="80" />
            </a>
            <div class="ppi-info">
              <a class="ppi-name" href="${product_info.productUrl}" target="_blank">${product_info.productName}</a>
              ${product_sku}
              <p class="ppi-price">
                Giá: <span id="js-popup-product-item-price">${product_price}</span>
              </p>
            </div>
          </div>
        `;
      }
    });
  }

  // select product variant to buildpc list
  function selectVariant() {
    const category_info = open_category_info;
    const product_info = open_variant_product_info;
    const variant_data = $variant_container.find('input[type="hidden"]').val();

    // check if variant exit
    if (variant_data === "") {
      return false;
    }

    const variant_info = typeof variant_data === "string" ? JSON.parse(variant_data) : variant_data;
    const variant_id = variant_info.id;
    const variant_price = variant_info.current_price;
    const variant_title = variant_info.label;
    const variant_stock = variant_info.quantity;
    // const variant_image = variant_info.image ? variant_info.image : product_info.productImage.large;

    // check if category has same product, return display
    const product_id = variant_info.product_id + "_" + variant_id;
    if (objBuildPC.isItemInCategory(category_info.id, product_id)) {
      hideModal();
      return false;
    }

    const item_info = {
      id: product_info.id + "_" + variant_id,
      productId: product_info.productId,
      name: product_info.productName,
      image: product_info.productImage.large,
      sku: product_info.productSKU,
      description: product_info.productSummary,
      url: product_info.productUrl,
      warranty: product_info.warranty,
      quantity: 1,
      stock: variant_stock,
      price: variant_price,
      price_sum: variant_price,
      variant_id: variant_id,
      variant_title: variant_title,
      note: "",
      specialOffer: product_info.specialOffer ? product_info.specialOffer : "",
      specialOfferGroup: product_info.specialOfferGroup ? product_info.specialOfferGroup : "",
    };

    addProductToList(category_info, item_info);
  }

  // add product to buildpc list
  function addProductToList(category_info, item_info) {
    const display_callback = function () {
      // show display
      displayProductInCategory(category_info.id);
      // and close modal and remove content
      hideModal();
      // then save
      saveConfig();
    };

    // replace product in category item list
    if (open_product_info) {
      objBuildPC.replaceItem(category_info.id, open_product_info.id, item_info, display_callback);
      return false;
    }

    // add product to category item list
    $(`#js-selected-item-${category_info.id}`).html("");
    objBuildPC.selectItem(category_info, item_info, display_callback);
  }

  // utilities
  function hideModal() {
    $variant_popup.hide();
    $variant_product.html("");
    $variant_container.html("");
    $modal_container.html("");
    open_product_info = undefined;
    Fancybox.close();
  }

  function saveConfig() {
    Hura.User.updateInfo(BUILD_PRODUCT_TYPE, objBuildPC.getConfig(), function (res) {
      if (res.status == "success") {
        Fancybox.close();
        displaySelectedConfigSummary();
      }
    });
  }

  function deleteSelectedConfig() {
    return objBuildPC.emptyConfig();
  }

  function translateTemplate(e, r) {
    var t,
      n = r;
    for (t in e) e.hasOwnProperty(t) && (n = n.replace(new RegExp("{{" + t + "}}", "g"), e[t]));
    return n;
  }

  function writeStringToPrice(e) {
    for (var r = (e = (e + "").replace(/\./g, "")).substr(0, e.length % 3), t = e.replace(r, ""), n = t.length / 3, a = "", p = 0; p < n; p++)
      (group_of_three = t.substr(3 * p, 3)), (a += group_of_three), p != n - 1 && (a += ".");
    return 0 < r.length ? ("" != a ? r + "." + a : r) : "" != a ? a : "";
  }

  function parsePrice(e) {
    return (e = (e + "").replace(/\./g, "")), parseInt(e.replace(/\,/g, ""));
  }

  // return
  return {
    showLayout: showLayout,
    showProductFilter: showProductFilter,
    showProductFilterClear: showProductFilterClear,
    showAllProductFilter: showAllProductFilter,
    showProductSearch: showProductSearch,
    showSelectedConfig: showSelectedConfig,
    deleteSelectedConfig: deleteSelectedConfig,
    displayProductInCategory: displayProductInCategory,
    displaySummary: displaySelectedConfigSummary,
    getConfigSummary: getConfigSummary,
    addProductToList: addProductToList,
    selectProduct: selectProduct,
    selectVariant: selectVariant,
  };
};
