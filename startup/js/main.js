// READY FUNCTION
$(document).ready(function () {
  globalHandle();

  homepageHandle();
  categoryHandle();
  productDetailHandle();
});

// GLOBAL
function globalHandle() {
  fancyboxHandle();
}

function fancyboxHandle() {
  Fancybox.bind("[data-fancybox]", {
    Carousel: {
      Toolbar: {
        display: {
          left: ["counter"],
          middle: ["zoomIn", "zoomOut", "toggle1to1", "rotateCCW", "rotateCW", "flipX", "flipY"],
          right: ["autoplay", "thumbs", "close"],
        },
      },
    }
  });
}

// HOMEPAGE
function homepageHandle() {
  
}

// CATEGORY
function categoryHandle() {
  
}

// PRODUCT DETAIL
function productDetailHandle() {
  
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