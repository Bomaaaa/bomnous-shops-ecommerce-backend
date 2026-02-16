
// Hero Slider
var heroSwiper = new Swiper('.heroSwiper', {
    slidePerView: 1,
    spaceBetween: 0,
    loop: true,
    // autoplay: {
    //     delay: 2000,
    // }
    // speed:1000,
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
});

function updateNavCounts() {
    
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    let wishlistCount = wishlist.length;
    let wishlistSpan = document.querySelector('.wishlist-span');
    if (wishlistSpan) {
      wishlistSpan.textContent = wishlistCount;
    }
    
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let uniqueCart = [];
    cart.forEach(item => {
      if (!uniqueCart.find(prod => prod.id == item.id)) {
        uniqueCart.push(item);
      }
    });
    let cartCount = uniqueCart.length;
    let cartSpan = document.querySelector('.cart-span');
    if (cartSpan) {
      cartSpan.textContent = cartCount;
    }
  }
  
  document.addEventListener("DOMContentLoaded", function() {
    updateNavCounts();
  });
  

// popular categories section
var popular_category_Swiper = new Swiper('.popular-categories-swiper', {
    slidesPerView: 6,
    spaceBetween: 20,
    breakpoints: {
        1200: {
            slidesPerView: 6,
        },
        1199: {
            slidesPerView: 5
        },
        767: {
            slidesPerView: 4
        },
        575: {
            slidesPerView: 3
        },
        425: {
            slidesPerView: 2
        },
        0: {
            slidesPerView: 1
        }
    }
});

// new-arrivals section
var new_arrivals_swiper = new Swiper('.new-arrivals-swiper', {
    slidesPerView: 5,
    spaceBetween: 20,
    loop: true,
    autoplay: true,
    breakpoints: {
        1400: {
            slidesPerView: 5,
        },
        1199: {
            slidesPerView: 4,
        },
        991: {
            slidesPerView: 3,
        },
        575: {
            slidesPerView: 2,
        },
        0: {
            slidesPerView: 1
        }
    }
});

// Brand swiper
var brandswiper = new Swiper('.brand-swiper', {
    slidesPerView: 5,
    spaceBetween: 20,
    loop: true,
    autoplay: true,
    breakpoints: {
        992: {
            slidesPerView: 5,
        },
        991: {
            slidesPerView: 4,
        },
        767: {
            slidesPerView: 3
        },
        575: {
            slidesPerView: 2
        },
        0: {
            slidesPerView: 1
        }
    }
});


// best sell swiepr
var sell_swiper = new Swiper('.best-sell-swiper', {
    slidesPerView: 3,
    spaceBetween: 20,
    breakpoints: {
        768:{
            slidesPerView: 3
        },
        767: {
            slidesPerView: 2
        },
        0: {
            slidesPerView: 1
        }
    }
})
    


