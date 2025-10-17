$(document).ready(function () {
  // GLOBAL CALL
  globalHandle();

  // PAGE CALL
  homepageHandle();
  categoryHandle();
  productDetailHandle();
});

//
function globalHandle() {}

//
function homepageHandle() {}

//
function categoryHandle() {}

//
function productDetailHandle() {}

let galleryThumbs = new Swiper(".gallery-thumbs", {
  spaceBetween: 4,
  slidesPerView: 4,
  slideToClickedSlide: true,
  freeMode: true,
  watchSlidesProgress: true,
  centerInsufficientSlides: true,
  breakpoints: {
    577: {
      slidesPerView: 6,
    },
  },
});

let galleryTop = new Swiper(".gallery-top", {
  spaceBetween: 0,
  slidesPerView: 1,
  speed: 1000,
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
    pauseOnMouseEnter: "true",
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
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

$('[data-fancybox="gallery"]').fancybox({
  thumbs: {
    autoStart: true,
  },
});
