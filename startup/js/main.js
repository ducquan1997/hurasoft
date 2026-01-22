// READY FUNCTION
$(document).ready(function () {
  globalHandle();

  homepageHandle();
  categoryHandle();
  productDetailHandle();
});

// GLOBAL
function globalHandle() {}

// HOMEPAGE
function homepageHandle() {}

// CATEGORY
function categoryHandle() {}

// PRODUCT DETAIL
function productDetailHandle() {}

function galleryThumbs() {
  const $targets = $('.detail-gallery [data-fancybox]');

  if (window.screen.availWidth > 768) {
    $targets.fancybox({ thumbs: { autoStart: true } });
    return;
  }

  const target_onclick = $targets.attr('onclick');
  const target_onclick_new = target_onclick ? target_onclick + ';galleryThumbsNote();' : 'galleryThumbsNote();';
  $targets.attr('onclick', target_onclick_new);
}

function galleryThumbsNote() {
  setTimeout(function () {
    $(".fancybox-stage").append(`<p style="position: absolute;bottom: 15px;font-size: 14px;text-align: center;color: #fff;width: 100%">Vuốt lên trên hoặc xuống dưới để đóng</p>`);
  }, 100)
}

let galleryThumbs = new Swiper(".gallery-thumbs", {
  spaceBetween: 10,
  slidesPerView: 4,
  slideToClickedSlide: true,
  freeMode: true,
  watchSlidesProgress: true,
  centerInsufficientSlides: true,
  observer: true,
  breakpoints: {
    768: {
      slidesPerView: 5,
      spaceBetween: 12,
    },
    1620: {
      slidesPerView: 6,
      spaceBetween: 12,
    },
  },
});

let galleryTop = new Swiper(".gallery-top", {
  spaceBetween: 12,
  slidesPerView: 1,
  rewind: true,
  speed: 1000,
  observer: true,
  navigation: {
    nextEl: ".gallery-top .swiper-button-next",
    prevEl: ".gallery-top .swiper-button-prev",
  },
  thumbs: {
    swiper: galleryThumbs,
  },
  // AUTO SILDED AT FISRT AND END
  on: {
    slideChange: function () {
      let activeIndex = this.activeIndex + 1;

      let activeSlide = document.querySelector(`.gallery-thumbs .swiper-slide:nth-child(${activeIndex})`);
      let nextSlide = document.querySelector(`.gallery-thumbs .swiper-slide:nth-child(${activeIndex + 1})`);
      let prevSlide = document.querySelector(`.gallery-thumbs .swiper-slide:nth-child(${activeIndex - 1})`);

      if (nextSlide && !nextSlide.classList.contains("swiper-slide-visible")) {
        this.thumbs.swiper.slideNext();
      } else if (prevSlide && !prevSlide.classList.contains("swiper-slide-visible")) {
        this.thumbs.swiper.slidePrev();
      }
    },
  },
});