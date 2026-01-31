// COMBOSET 14.08.2025
const ComboSet = (function () {
  let PRODUCT_ID = 0;
  let VARIANT_ID = 0;
  let selectedProduct = {};

  const Base64 = {
    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode: function (input) {
      let output = "";
      let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      let i = 0;

      input = Base64._utf8_encode(input);

      while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }

        output = output +
          this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
          this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
      }

      return output;
    },

    // public method for decoding
    decode: function (input) {
      let output = "";
      let chr1, chr2, chr3;
      let enc1, enc2, enc3, enc4;
      let i = 0;

      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

      while (i < input.length) {
        enc1 = this._keyStr.indexOf(input.charAt(i++));
        enc2 = this._keyStr.indexOf(input.charAt(i++));
        enc3 = this._keyStr.indexOf(input.charAt(i++));
        enc4 = this._keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
          output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
          output = output + String.fromCharCode(chr3);
        }
      }

      output = Base64._utf8_decode(output);

      return output;
    },

    // private method for UTF-8 encoding
    _utf8_encode: function (string) {
      string = string.replace(/\r\n/g, "\n");
      let utftext = "";

      for (let n = 0; n < string.length; n++) {
        let c = string.charCodeAt(n);

        if (c < 128) {
          utftext += String.fromCharCode(c);
        }
        else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }

      return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode: function (utftext) {
      let string = "";
      let i = 0;
      let c = c1 = c2 = 0;

      while (i < utftext.length) {
        c = utftext.charCodeAt(i);

        if (c < 128) {//>
          string += String.fromCharCode(c);
          i++;
        }
        else if ((c > 191) && (c < 224)) {//>
          c2 = utftext.charCodeAt(i + 1);
          string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
          i += 2;
        }
        else {
          c2 = utftext.charCodeAt(i + 1);
          c3 = utftext.charCodeAt(i + 2);
          string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          i += 3;
        }
      }

      return string;
    }
  }

  function setUp(product_id) {
    PRODUCT_ID = parseInt(product_id);
  }

  function setVariant(variant_id) {
    VARIANT_ID = parseInt(variant_id);
  }

  function selectProductSet($checkbox) {
    //let $checkbox   = $(this);
    let is_checked = $checkbox.is(':checked');
    let set_id = $checkbox.data("set-id");
    let group_key = $checkbox.data("group-key");
    let product_id = (is_checked) ? $checkbox.data("product-id") : 0;

    addProductToSelected(set_id, group_key, product_id);
  }

  function addProductToSelected(set_id, group_key, product_id) {
    if (!selectedProduct.hasOwnProperty(set_id)) selectedProduct[set_id] = {};
    if (!selectedProduct[set_id].hasOwnProperty(group_key)) selectedProduct[set_id][group_key] = 0;

    selectedProduct[set_id][group_key] = product_id;
    console.log(JSON.stringify(selectedProduct, true, 4));
  }

  function removeProductOutSelected(set_id, group_key) {
    if (!selectedProduct[set_id][group_key]) return;

    delete selectedProduct[set_id][group_key];
    console.log(JSON.stringify(selectedProduct, true, 4));
  }

  function goToComboSetCheckout(set_id) {
    if (typeof selectedProduct[set_id] == 'undefined' || Object.values(selectedProduct[set_id]).length === 0) {
      alert("Chưa chọn sản phẩm !");
      return null;
    }

    let config = {
      id: PRODUCT_ID + "_" + VARIANT_ID,
      set_id: set_id,
      items: selectedProduct[set_id]
    }

    console.log(JSON.stringify(config, true, 4));
    // alert("Mua Combo sản phẩm thành công!");
    const url = "/comboset?config=" + Base64.encode(JSON.stringify(config));
    window.location = url;
  }

  return {
    setUp: setUp,
    setVariant: setVariant,
    addProduct: addProductToSelected,
    removeProduct: removeProductOutSelected,
    goToComboSetCheckout: goToComboSetCheckout
  }
})();