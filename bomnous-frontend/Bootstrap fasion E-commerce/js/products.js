const productsData = [
  {
    ProductId: "P1",
    title: "Women",
    name: "Colorful Pattern Dress",
    category: "women",
    tag: "trending",
    image: "image/product-1-1.jpg",
    imageHover: "image/product-1-2.jpg",
    price: "$238.85",
    lessprice: "$245.8",
    off: "10%"
  },
  {
    ProductId: "P2",
    title: "Women",
    name: "Floral Summer Dress",
    category: "women",
    tag: "editors",
    image: "image/product-2-1.jpg",
    imageHover: "image/product-2-2.jpg",
    price: "$199.99",
    lessprice: "$249.99",
    off: "20%"
  },
  {
    ProductId: "P3",
    title: "Men",
    name: "Slim Fit Shirt",
    category: "men",
    tag: "just-dropped",
    image: "image/product-3-1.jpg",
    imageHover: "image/product-3-2.jpg",
    price: "$149.99",
    lessprice: "$189.99",
    off: "15%"
  },
  {
    ProductId: "P4",
    title: "Children",
    name: "Kids Winter Jacket",
    category: "children",
    tag: "trending",
    image: "image/product-4-1.jpg",
    imageHover: "image/product-4-2.jpg",
    price: "$129.99",
    lessprice: "$159.99",
    off: "18%"
  },
  {
    ProductId: "P5",
    title: "Accessories",
    name: "Leather Handbag",
    category: "accessories",
    tag: "editors",
    image: "image/product-5-1.jpg",
    imageHover: "image/product-5-2.jpg",
    price: "$179.99",
    lessprice: "$199.99",
    off: "10%"
  }
];

document.addEventListener("DOMContentLoaded", function () {

  const productWrap = document.querySelector(".product-wrap");

  function renderProducts(filterType, filterValue) {
    productWrap.innerHTML = "";

    let filteredProducts;

    if (filterValue === "all") {
      filteredProducts = productsData;
    } else {
      filteredProducts = productsData.filter(product =>
        product[filterType] === filterValue
      );
    }

    filteredProducts.forEach(product => {
      productWrap.innerHTML += `
        <div class="col-md-4 col-lg-3 mb-4">
          <div class="product-item p-3 rounded-4">

            <div class="product-image position-relative overflow-hidden rounded-4">
              <img src="${product.image}" class="img-fluid main-img">
              <img src="${product.imageHover}" class="img-fluid hover-img">
              <span class="badge bg-dark position-absolute top-0 start-0 m-2">
                ${product.off}
              </span>
            </div>

            <div class="mt-3">
              <small class="text-muted">${product.title}</small>
              <h6 class="mt-1">${product.name}</h6>

              <div class="d-flex align-items-center gap-2">
                <span class="fw-bold">${product.price}</span>
                <small class="text-muted text-decoration-line-through">
                  ${product.lessprice}
                </small>
              </div>
            </div>

          </div>
        </div>
      `;
    });
  }

  // CATEGORY buttons
  document.querySelectorAll(".btn-category").forEach(button => {
    button.addEventListener("click", function () {

      document.querySelectorAll(".btn-category")
        .forEach(btn => btn.classList.remove("active"));

      this.classList.add("active");

      renderProducts("category", this.dataset.filter);
    });
  });

  // TAG buttons (Trending, Editors, etc.)
  document.querySelectorAll(".btn-tag").forEach(button => {
    button.addEventListener("click", function () {

      document.querySelectorAll(".btn-tag")
        .forEach(btn => btn.classList.remove("active"));

      this.classList.add("active");

      renderProducts("tag", this.dataset.filter);
    });
  });

  // Default load
  renderProducts("category", "all");

});



// const productsData = [
//     {
//       ProductId: "P1",
//       title: "Clothing",
//       name: "Colorful Pattern Shirts",
//       image: "image/product-1-1.jpg",
//       imageHover: "image/product-1-2.jpg",
//       price: "$238.85",
//       lessprice: "$245.8",
//       off: "90%"
//     },
//     {
//       ProductId: "P2",
//       title: "Clothing",
//       name: "Fish Print Patched T-shirt",
//       image: "image/product-2-1.jpg",
//       imageHover: "image/product-2-2.jpg",
//       price: "$199.99",
//       lessprice: "$249.99",
//       off: "20%"
//     },
//     {
//       ProductId: "P3",
//       title: "Clothing",
//       name: "Vintage Floral Print Dress",
//       image: "image/product-3-1.jpg",
//       imageHover: "image/product-3-2.jpg",
//       price: "$299.99",
//       lessprice: "$349.99",
//       off: "15%"
//     },
//     {
//       ProductId: "P4",
//       title: "Clothing",
//       name: "Stripe Circle Print T-Shirt",
//       image: "image/product-4-1.jpg",
//       imageHover: "image/product-4-2.jpg",
//       price: "$149.99",
//       lessprice: "$189.99",
//       off: "20%"
//     },
//     {
//       ProductId: "P5",
//       title: "Clothing",
//       name: "Casual Cotton T-Shirt",
//       image: "image/product-5-1.jpg",
//       imageHover: "image/product-5-2.jpg",
//       price: "$129.99",
//       lessprice: "$159.99",
//       off: "18%"
//     },
//     {
//       ProductId: "P6",
//       title: "Clothing",
//       name: "Printed Summer Top",
//       image: "image/product-6-1.jpg",
//       imageHover: "image/product-6-2.jpg",
//       price: "$179.99",
//       lessprice: "$199.99",
//       off: "10%"
//     },
//     {
//       ProductId: "P7",
//       title: "Clothing",
//       name: "Slim Fit Jeans",
//       image: "image/product-7-1.jpg",
//       imageHover: "image/product-7-2.jpg",
//       price: "$249.99",
//       lessprice: "$299.99",
//       off: "17%"
//     },
//     {
//       ProductId: "P8",
//       title: "Clothing",
//       name: "Denim Jacket",
//       image: "image/product-8-1.jpg",
//       imageHover: "image/product-8-2.jpg",
//       price: "$349.99",
//       lessprice: "$399.99",
//       off: "12%"
//     },
//     {
//       ProductId: "P9",
//       title: "Clothing",
//       name: "Casual Sneakers",
//       image: "image/product-9-1.jpg",
//       imageHover: "image/product-9-2.jpg",
//       price: "$99.99",
//       lessprice: "$129.99",
//       off: "23%"
//     },
//     {
//       ProductId: "P10",
//       title: "Clothing",
//       name: "stylish pents",
//       image: "image/product-10-1.jpg",
//       imageHover: "image/product-10-2.jpg",
//       price: "$399.99",
//       lessprice: "$449.99",
//       off: "11%"
//     },
//     {
//       ProductId: "P11",
//       title: "Clothing",
//       name: "Cotten T-shirt",
//       image: "image/product-11-1.jpg",
//       imageHover: "image/product-11-2.jpg",
//       price: "$399.99",
//       lessprice: "$449.99",
//       off: "11%"
//     },
//     {
//       ProductId: "P12",
//       title: "Clothing",
//       name: "Stylis pent",
//       image: "image/product-12-1.jpg",
//       imageHover: "image/product-12-2.jpg",
//       price: "$399.99",
//       lessprice: "$449.99",
//       off: "11%"
//     },
//   ];
  