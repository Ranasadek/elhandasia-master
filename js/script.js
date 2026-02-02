/* ===================== 1. NAVIGATION & ACTIVE LINKS ===================== */
const links = document.querySelectorAll(".nav-item");

links.forEach(link => {
    link.addEventListener("mouseenter", function () {
        links.forEach(l => l.classList.remove("active"));
    });

    link.addEventListener("click", function () {
        links.forEach(l => l.classList.remove("active"));
        this.classList.add("active");
    });
});

/* ===================== 2. MAIN NAV (SECOND NAV) ===================== */
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    
    const adminLink = document.getElementById('admin-dash-link');
    const accountIcon = document.getElementById('userAccountIcon');
    const wishlistLink = document.getElementById('wishlist-link');

    if (token) {
        try {
            const payload = JSON.parse(window.atob(token.split('.')[1]));
            const userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;

            if (userRole === "Admin") {
                if (adminLink) adminLink.style.setProperty('display', 'flex', 'important');
                if (accountIcon) accountIcon.style.display = 'none';
                if (wishlistLink) wishlistLink.style.display = 'none';
            } 
            else if (userRole === "User") {
                if (accountIcon) accountIcon.style.setProperty('display', 'flex', 'important');
                if (wishlistLink) wishlistLink.style.setProperty('display', 'flex', 'important');
                if (adminLink) adminLink.style.display = 'none';
                
                // --- السطر اللي ناقص هنا ---
                // استدعاء دالة الرقم فوراً عشان تظهر مع الريفرش
                if (typeof updateWishlistBadge === "function") {
                    updateWishlistBadge();
                }
            }
        } catch (e) {
            console.error("Token error", e);
        }
    } else {
        if (wishlistLink) wishlistLink.style.display = 'none'; 
    }
});
/* ===================== 3. FLOATING HEADER & SCROLL LOGIC ===================== */
document.addEventListener('DOMContentLoaded', function () {
    const getStartedBtn = document.querySelector('.get-started');
    const header = document.querySelector('.elhandasia-header'); 
    const navbar = document.querySelector('.navbar'); 
    const target = document.querySelector('.section3'); 
  
    if (!navbar || !target) {
        console.warn('Missing required elements: .navbar or .section3');
    }
  
    const NAV_HIDDEN_TOP = '-90px'; 
    const NAV_VISIBLE_TOP = '0';   
  
    if (navbar && !navbar.style.top) {
        navbar.style.top = NAV_HIDDEN_TOP;
        navbar.style.transition = 'top 0.25s ease';
    }
  
    function showFloatingHeader() {
        if (!header) return;
        if (!header.classList.contains('visible')) {
            header.classList.add('visible');
            setTimeout(() => {
                const h = header.offsetHeight || 0;
                document.documentElement.style.setProperty('--elheader-height', h + 'px');
                document.body.classList.add('header-shown');
            }, 50);
        }
        if (navbar) navbar.style.top = NAV_HIDDEN_TOP;
    }
  
    function hideFloatingHeader() {
        if (!header) return;
        if (header.classList.contains('visible')) {
            header.classList.remove('visible');
            setTimeout(() => {
                document.body.classList.remove('header-shown');
                document.documentElement.style.setProperty('--elheader-height', '0px');
            }, 220);
        }
        if (navbar) navbar.style.top = NAV_VISIBLE_TOP;
    }
  
    if (navbar && target) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                navbar.style.top = entry.isIntersecting ? NAV_VISIBLE_TOP : NAV_HIDDEN_TOP;
            });
        }, { threshold: 0.04, rootMargin: '0px 0px -8% 0px' });
        io.observe(target);
    }
  
    if (getStartedBtn && target) {
        getStartedBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (header && !header.classList.contains('visible')) header.classList.add('visible');
            const targetTop = target.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: targetTop - (header?.offsetHeight || 0), behavior: 'smooth' });
        });
    }
  
    function onScrollCheck() {
        if (!header || !navbar || !target) return;
        const scrollY = window.scrollY;
        const targetTop = target.getBoundingClientRect().top + window.scrollY;
        if (scrollY + header.offsetHeight + 10 >= targetTop) showFloatingHeader();
        else hideFloatingHeader();
    }
  
    window.addEventListener('scroll', onScrollCheck, { passive: true });
});

/* ===================== 4. MOBILE MENUS (THE FIX) ===================== */
document.addEventListener('DOMContentLoaded', () => {
    // إصلاح التلات شرط الأساسية (Hamburger)
    const hamburger = document.getElementById('hamburger');
    const mobileNavLinks = document.getElementById('nav-links');
    
    if (hamburger && mobileNavLinks) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileNavLinks.classList.toggle('show');
        });
    }

    // إصلاح أيقونة القائمة الجانبية (Categories)
    const menuIcon = document.querySelector('.mobile-menu-icon');
    const categories = document.querySelector('.mobile-categories');

    if (menuIcon && categories) {
        menuIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            categories.classList.toggle('show');
        });
    }

    // إغلاق أي قائمة عند الضغط بره
    document.addEventListener('click', (e) => {
        if (mobileNavLinks && !mobileNavLinks.contains(e.target) && !hamburger.contains(e.target)) {
            mobileNavLinks.classList.remove('show');
        }
        if (categories && !categories.contains(e.target) && !menuIcon.contains(e.target)) {
            categories.classList.remove('show');
        }
    });
});
// //////////////////////////////////////////////////////////////////////////////////



/* ===================== 1. CONFIGURATION & INITIALIZATION ===================== */

if (typeof window.API_CONFIG_LOADED === 'undefined') {

  window.BASE_URL = "https://el-handasia.runasp.net";

  window.API_URL = window.BASE_URL + "/api/Home/GetHomePageData";

  window.FALLBACK_IMAGE = "img/laptop.jpg";

  window.API_CONFIG_LOADED = true;

}



let allProductsData = [];



document.addEventListener("DOMContentLoaded", () => {

  if (document.getElementById("slider") || document.querySelector(".containers")) {

      loadHome();

  }

 

  setupNavbar();

  setupMobileMenu();

  setupFloatingHeader();



});



/* دالة تحديث رقم الكارت في الهيدر */

function updateCartBadge() {

    const badge = document.getElementById("cart-count");

    if (!badge) return;

   

    let cart = JSON.parse(localStorage.getItem("shopping_cart")) || [];

    // حساب إجمالي الكمية (عدد القطع)

    let totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

   

    if (totalCount > 0) {

        badge.textContent = totalCount;

        badge.style.display = "block";

    } else {

        badge.style.display = "none";

    }

}



/* ===================== 2. API & DATA LOADING ===================== */

async function loadHome() {

  try {

      const response = await fetch(window.API_URL, {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({

              categoryIds: [1, 2, 3, 4, 5],

              productsPerSection: 30

          })

      });



      const data = await response.json();

      allProductsData = data.productSections.flatMap(section => section.products);

     

      setupSearch();

      fillProductSections(data.productSections);

      fillRecommendedSlider(data.productSections);

      fillBanners(data.banners);

      fillTrustedUsers(data.storeStats);

      setupHearts();



  } catch (error) {

      console.error("API ERROR:", error);

  }

}



/* ===================== 3. UI FILLERS ===================== */

function fillProductSections(sections) {
    if (!Array.isArray(sections)) return;
  
    document.querySelectorAll(".containers").forEach(container => {
        const categoryId = container.dataset.id || container.dataset.categoryId;
        if (!categoryId) return;
  
        const section = sections.find(s => s.categoryId == categoryId);
        const grid = container.querySelector(".grid2");
        if (!grid) return;
  
        if (!section || !section.products?.length) {
            grid.innerHTML = "<p>No products available</p>";
        } else {
            const titleElement = container.querySelector("h1");
            if (titleElement && section.categoryName) {
                const iconUrl = fixImage(section.categoryImageUrl);
                
                // شيلنا الـ div اللي كان جوه الـ h1 عشان الحجم ميضربش
                titleElement.style.display = "flex";
                titleElement.style.alignItems = "center";
                titleElement.style.justifyContent = "space-between"; // عشان يزق الزرار لليمين
                titleElement.style.backgroundColor = "#ff6b00";
                titleElement.style.padding = "5px 15px"; // تقليل الـ padding عشان الحجم يصغر
                titleElement.style.color = "white";
                titleElement.style.fontSize = "20px"; // تصغير حجم الخط
                titleElement.style.borderRadius = "4px";
            
                titleElement.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${iconUrl}" 
                             style="width: 25px; height: 25px; object-fit: contain;" 
                             onerror="this.src='img/laptop-icon.png'"> 
                        <span>${section.categoryName}</span>
                    </div>
                    <a href="category.html?type=${section.categoryName}" 
                       style="color: white; text-decoration: none; font-size: 14px; font-weight: normal;">
                       Show More →
                    </a>
                `;
            }
            
            // التعديل هنا: استخدمنا .slice(0, 8) لعرض أول 8 منتجات فقط
            const limitedProducts = section.products.slice(0, 8);
            grid.innerHTML = limitedProducts.map(createCard).join("");
        }
    });
  }

function fillTrustedUsers(stats) {

  if (!stats) return;

  const num = document.querySelector(".trusted-plus");

  if (num) num.textContent = `+${stats.trustedUsers || 0}`;

  const u = document.getElementById("stat-users");

  const o = document.getElementById("stat-orders");

  const p = document.getElementById("stat-products");

  if(u) u.textContent = `+${(stats.trustedUsers || 0).toLocaleString()}`;

  if(o) o.textContent = `+${(stats.totalOrders || 0).toLocaleString()}`;

  if(p) p.textContent = (stats.totalProducts || 0).toLocaleString();

}



function fillBanners(banners) {

  if (!banners || banners.length === 0) return;

  const bannerElements = document.querySelectorAll('img[data-banner]');

  bannerElements.forEach(img => {

      const index = parseInt(img.dataset.banner);

      if (banners[index]) {

          img.src = fixImage(banners[index].imageUrl);

      } else {

          img.src = window.FALLBACK_IMAGE;

      }

  });

}



function fillRecommendedSlider(sections) {
    const slider = document.getElementById("slider");
    if (!slider || !sections) return;
  
    // التعديل هنا: slice(0, 8) يعني هيعرض 8 منتجات بس في السلايدر كله
    const products = sections.flatMap(s => s.products).slice(0, 8); 
    
    slider.innerHTML = "";
    
    // تقسيم الـ 8 منتجات لمجموعات (كل مجموعة 4 منتجات في سلايد واحد)
    for (let i = 0; i < products.length; i += 4) {
        const group = document.createElement("div");
        group.className = "slide-group";
        group.innerHTML = products.slice(i, i + 4).map(createCard).join("");
        slider.appendChild(group);
    }
  
    // إعادة ضبط الاندكس عشان ميبوظش الحركة بعد التعديل
    let index = 0;
    const next = document.getElementById("nextBtn");
    const prev = document.getElementById("prevBtn");
    
    if(next) next.onclick = () => {
        if (index < slider.children.length - 1) {
            index++;
            slider.style.transform = `translateX(-${index * 100}%)`;
        }
    };
    if(prev) prev.onclick = () => {
        if (index > 0) {
            index--;
            slider.style.transform = `translateX(-${index * 100}%)`;
        }
    };
  }


/* ===================== 4. CARD & IMAGE UTILS ===================== */

function createCard(product) {

  const isFav = localStorage.getItem("fav-" + product.id) === "true";

  const imageUrl = fixImage(product.mainImageUrl);

  const mySection = "cat-" + product.categoryId;

  const hasDiscount = product.price && product.displayPrice < product.price;

  const ratingValue = product.rating || 5.0;



  let cart = JSON.parse(localStorage.getItem("shopping_cart")) || [];

  const isAdded = cart.some(item => item.id == product.id);



  return `

  <div class="card">

      <div class="img-wrap">

          <a href="product-details.html?id=${product.id}&section=${mySection}">

              <img src="${imageUrl}" loading="lazy" onerror="this.src='${window.FALLBACK_IMAGE}'">

          </a>

          ${hasDiscount ? `<span class="discount-badge" style="position:absolute; top:10px; left:10px; background:red; color:white; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:bold; z-index:2;">SALE</span>` : ''}

          <button class="fav" data-id="${product.id}">

              <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isFav ? 'color:red' : ''}"></i>

          </button>

      </div>

      <div class="card-body">

          <a href="product-details.html?id=${product.id}&section=${mySection}" style="text-decoration:none; color:inherit;">

              <div class="title" style="font-weight:600; margin-bottom:5px; height: 40px; overflow: hidden;    font-size: 16px;">${product.name}</div>

          </a>

         

          <div class="rating" >


<span style="color: #FF6B00; font-size: 16px; font-weight: bold; ">In Stock</span>
          </div>



         <div class="price-box" >

              ${hasDiscount

                  ? `<span class="old-price" >${product.price} EGP</span>

                     <span class="new-price" >${product.displayPrice} EGP</span>`

                  : `<span class="price" >${product.displayPrice} EGP</span>`

              }

          </div>

<button class="btn add-to-cart"
        data-id="${product.id}"
        data-name="${product.name}"
        data-price="${product.displayPrice}"
        data-img="${imageUrl}"
        style="cursor:pointer; width: 100%; padding: 10px; border-radius: 5px; transition: all 0.3s;">
        Add to Cart
</button>

      </div>

  </div>`;

}



function fixImage(path) {

  if (!path) return window.FALLBACK_IMAGE;

  if (path.startsWith("http")) return path;

  return `${window.BASE_URL}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;

}



/* ===================== 5. SEARCH LOGIC ===================== */

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const categoryDropdown = document.getElementById('search-category');

    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        // الحصول على القسم المختار
        const selectedCat = categoryDropdown.options[categoryDropdown.selectedIndex].text;

        // حالة المسح: لو الخانة فضيت، اظهر الهوم واخفي نواتج البحث
        if (query === "") {
            document.getElementById('search-results-container').style.display = 'none';
            document.getElementById('all-home-sections').style.display = 'block';
            // إظهار باقي الـ containers الأصلية
            document.querySelectorAll('.containers:not(#search-results-container)').forEach(c => c.style.display = 'block');
            document.querySelectorAll('.section1, .section2, .section3, .section5, .section6, .section7, .section8').forEach(s => s.style.display = 'block');
            return;
        }

        // الفلترة من البيانات اللي جت من الـ API
        const filtered = allProductsData.filter(p => {
            const matchesName = p.name.toLowerCase().includes(query);
            const matchesCat = (selectedCat === "All Category") || (p.categoryName === selectedCat);
            return matchesName && matchesCat;
        });

        // تشغيل دالة العرض
        renderHomeSearchResults(filtered, query);
    });
}

function renderHomeSearchResults(results, query) {
    // 1. إخفاء كل السكاشن
    const allHomeContent = document.getElementById('all-home-sections');
    if (allHomeContent) allHomeContent.style.display = 'none';
    
    document.querySelectorAll('.section1, .section2, .section3, .section5, .section6, .section7, .section8, .containers:not(#search-results-container)').forEach(s => {
        s.style.display = 'none';
    });

    // 2. إظهار حاوية البحث
    const resultsContainer = document.getElementById('search-results-container');
    const resultsGrid = document.getElementById('search-grid-main');
    const statusText = document.getElementById('search-status-text');

    if (resultsContainer && resultsGrid) {
        resultsContainer.style.display = 'block';
        statusText.textContent = `نتائج البحث عن: "${query}" (${results.length})`;

        if (results.length === 0) {
            resultsGrid.innerHTML = `<h3 style="grid-column:1/-1; text-align:center; padding:50px;">لا توجد منتجات مطابقة لهذا البحث</h3>`;
        } else {
            // استخدام دالة createCard اللي عندك في الكود أصلاً
            resultsGrid.innerHTML = results.map(createCard).join('');
        }
    }
}
/* ===================== 6. INTERACTIVITY & EVENTS ===================== */


function setupHearts() {
    document.addEventListener("click", async e => {
        const favBtn = e.target.closest(".fav");
        if (!favBtn) return;

        const icon = favBtn.querySelector("i");
        const productId = favBtn.dataset.id;
        const token = localStorage.getItem('token') || localStorage.getItem('userToken');

        if (!token) {
            alert("Please login first");
            window.location.href = "login.html";
            return;
        }

        const isCurrentlyFav = icon.classList.contains("fa-solid");
        
        // تبديل الـ UI فوراً
        icon.classList.toggle("fa-solid");
        icon.classList.toggle("fa-regular");
        icon.style.color = !isCurrentlyFav ? "red" : "";

        try {
            // لو كان محبوب (أحمر) ودستِ عليه، يبقى إحنا عاوزين "نمسحه"
            if (isCurrentlyFav) {
                const response = await fetch(`https://el-handasia.runasp.net/api/Favorites/${productId}`, {
                    method: 'DELETE', // نستخدم DELETE للحذف عشان نتجنب خطأ 400
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    localStorage.removeItem("fav-" + productId); // نمسحه من ذاكرة الهوم
                    console.log("Removed from server and local");
                }
            } else {
                // لو مكنش أحمر ودستِ عليه، يبقى "إضافة"
                const response = await fetch('https://el-handasia.runasp.net/api/Favorites', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productId: Number(productId) }) // التأكد إنه رقم
                });

                if (response.ok) {
                    localStorage.setItem("fav-" + productId, "true");
                }
            }
            
            if (typeof updateWishlistBadge === 'function') updateWishlistBadge();

        } catch (err) {
            console.error("API Error:", err);
            // لو حصل فشل نرجع الحالة القديمة
            icon.classList.toggle("fa-solid");
            icon.classList.toggle("fa-regular");
            icon.style.color = isCurrentlyFav ? "red" : "";
        }
    });
}

function setupCartListener() {
    document.addEventListener("click", e => {
        const cartBtn = e.target.closest(".add-to-cart");
        if (!cartBtn) return;
  
        // حفظ النص الأصلي والستايل الأصلي للزرار قبل التغيير
        const originalText = "Add to Cart"; // أو يمكنك استخدام cartBtn.textContent لو كان النص متغيراً
        const originalBg = ""; // الستايل الأصلي من ملف CSS
        const originalColor = "";
  
        const product = {
            id: cartBtn.dataset.id,
            name: cartBtn.dataset.name,
            price: cartBtn.dataset.price,
            img: cartBtn.dataset.img,
            quantity: 1
        };
  
        let cart = JSON.parse(localStorage.getItem("shopping_cart")) || [];
        const existing = cart.find(item => item.id === product.id);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push(product);
        }
  
        localStorage.setItem("shopping_cart", JSON.stringify(cart));
  
        // 1. تغيير شكل الزرار للحالة "تمت الإضافة"
        cartBtn.textContent = "Added! ✓";
        cartBtn.style.background = "#4CAF50";
        cartBtn.style.color = "white";
        cartBtn.disabled = true; // اختياري: منع الضغط المتكرر أثناء الأنيميشن
  
        // 2. تحديث الرقم في الهيدر
        updateCartBadge();
  
        // 3. العودة للحالة الأصلية بعد ثانية واحدة (1000 مللي ثانية)
        setTimeout(() => {
            cartBtn.textContent = originalText;
            cartBtn.style.background = originalBg;
            cartBtn.style.color = originalColor;
            cartBtn.disabled = false;
        }, 1000); 
 


      // تحديث الرقم في الهيدر فوراً بعد الإضافة

      updateCartBadge();

  });

}



function setupNavbar() {

  const links = document.querySelectorAll(".nav-item, .main-nav-menu a");

  links.forEach(link => {

      link.addEventListener("click", function() {

          if (this.getAttribute("href") && this.getAttribute("href").startsWith("#")) {

              links.forEach(l => l.classList.remove("active", "active-item"));

              this.classList.add("active", "active-item");

          }

      });

  });

}



function setupMobileMenu() {

  const hamburger = document.querySelector('.mobile-menu-icon'); // تعديل لاختيار الأيقونة الصحيحة

  const navLinks = document.getElementById('nav-links');

  if (hamburger && navLinks) {

      hamburger.onclick = () => navLinks.classList.toggle('show');

  }

}



function setupFloatingHeader() {

  const header = document.querySelector('.elhandasia-header');

  const navbar = document.querySelector('.navbar');

  const target = document.querySelector('.section3');



  if (!navbar || !target) return;



  window.addEventListener('scroll', () => {

      if (window.scrollY >= target.offsetTop - 100) {

          header?.classList.add('visible');

          navbar.style.top = '-90px';

      } else {

          header?.classList.remove('visible');

          navbar.style.top = '0';

      }

  }, { passive: true });

}

// ////////////////////////////////////////////////الكتيجري في الهوم///////////////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
    const categoryDropdown = document.getElementById('search-category');

    if (categoryDropdown) {
        categoryDropdown.addEventListener('change', function() {
            const selectedId = this.value;

            // 1. العودة للأعلى إذا اختار الكل
            if (selectedId === "0") {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            let targetSection = null;

            // 2. إذا اختار 5 (المقترحات) ابحث عن السلايدر
            if (selectedId === "5") {
                targetSection = document.getElementById('slider') || document.querySelector('.section2');
            } else {
                // 3. البحث عن الأقسام العادية (Laptops, Accessories, etc.)
                targetSection = document.querySelector(`.containers[data-id="${selectedId}"], .containers[data-category-id="${selectedId}"]`);
            }

            // 4. تنفيذ التمرير بذكاء (لأنه يحسب مكان الهيدر)
            if (targetSection) {
                const headerOffset = 100; // مسافة الأمان تحت الهيدر
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // غلق المنيو في الموبايل لو مفتوح
                const navLinks = document.getElementById('nav-links');
                if (navLinks) navLinks.classList.remove('show');
            }
        });
    }
});

////////////////////////////////الكتيجري في/////////////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", () => {
    // 1. كود القائمة المنسدلة (الذي قمنا به سابقاً)
    const categoryDropdown = document.getElementById('search-category');
    // ... (الكود السابق يعمل كما هو)

    // 2. كود قائمة الموبايل الجديدة
    const mobileCategories = document.querySelectorAll('#mobile-categories li');

    mobileCategories.forEach(item => {
        item.style.cursor = "pointer"; // لجعل السهم يظهر كيد عند الوقوف عليه
        
        item.addEventListener('click', function() {
            const selectedId = this.getAttribute('data-id');

            let targetSection = null;

            // إذا اختار 5 (المقترحات)
            if (selectedId === "5") {
                targetSection = document.getElementById('slider') || document.querySelector('.section2');
            } else {
                // البحث عن الأقسام العادية
                targetSection = document.querySelector(`.containers[data-id="${selectedId}"], .containers[data-category-id="${selectedId}"]`);
            }

            if (targetSection) {
                const headerOffset = 100; 
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // غلق قائمة الموبايل (Side Menu) بعد الضغط
                const navLinks = document.getElementById('nav-links');
                if (navLinks) navLinks.classList.remove('show');
                
                // إذا كان هناك Overlay خلف المنيو يغلق أيضاً
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) sidebar.classList.remove('show');
            }
        });
    });
});


// ////////////////كارت التليفون//////////////////////////////////////////////////////////////////////////////////

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem("shopping_cart")) || [];
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    
    let userRole = "";
    if (token) {
        try {
            const payload = JSON.parse(window.atob(token.split('.')[1]));
            userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;
        } catch (e) { console.error("Token error:", e); }
    }

    const totalCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    // العناصر
    const mobileCartWrapper = document.querySelector('.mobile-search-icon'); 
    const desktopBadge = document.getElementById('cart-count');
    const mobileBadge = document.getElementById('cart-count-mobile');

    // فحص هل نحن في وضع التليفون (شاشة أصغر من 768px)
    const isMobile = window.innerWidth <= 768;

    if (userRole === "Admin") {
        // 1. لو أدمن وفي التليفون -> اخفي الأيقونة تماماً بقوة !important
        if (isMobile && mobileCartWrapper) {
            mobileCartWrapper.style.setProperty('display', 'none', 'important');
        } 
        
        // 2. لو أدمن وفي اللاب توب -> اظهر الرقم فوق السلة اللي في اليمين عادي
        if (!isMobile && desktopBadge) {
            updateBadgeUI(desktopBadge, totalCount);
        }
    } else {
        // لو يوزر عادي: اظهر كل حاجة حسب حجم الشاشة
        if (mobileCartWrapper) {
            mobileCartWrapper.style.display = isMobile ? "block" : "none";
        }
        
        if (desktopBadge) updateBadgeUI(desktopBadge, totalCount);
        if (mobileBadge) updateBadgeUI(mobileBadge, totalCount);
    }
}

function updateBadgeUI(badge, count) {
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = "flex";
        badge.style.visibility = "visible";
    } else {
        badge.style.display = "none";
    }
}

// تشغيل عند التحميل وعند تغيير حجم الشاشة لضمان الدقة
window.addEventListener('resize', updateCartBadge);
document.addEventListener("DOMContentLoaded", updateCartBadge);

// ////////////////////////ايفون الداش///////////////////////////////////////////////////////
function isUserLoggedIn() {
    return localStorage.getItem("token") !== null;
}





/* تشغيل الكود بعد تحميل الصفحة */


/* ===================== ADD TO CART (يتطلب لوجين فقط) ===================== */

function isUserLoggedIn() {
    return localStorage.getItem("token") !== null;
}
function addToCart(productId, productName, productPrice, productImage) {
    if (!isUserLoggedIn()) {
        alert("⚠️ لازم تعمل لوجين الأول!");
        window.location.href = "login.html";
        return;
    }

    // البحث عن كل أزرار المنتج (في السلايدر والشبكة)
    const buttons = document.querySelectorAll(`.add-to-cart[data-id="${productId}"]`);

    // 1. تحديد الدرجات اللونية
    const myOrange = "#FF6B00"; // الدرجة اللي طلبتيها
    const successGreen = "#28a745"; // اللون الأخضر للحالة الناجحة
    const originalText = "Add to Cart";

    // 2. تحديث الـ LocalStorage
    let cart = JSON.parse(localStorage.getItem("shopping_cart")) || [];
    const existingItem = cart.find(item => item.id == productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, name: productName, price: productPrice, img: productImage, quantity: 1 });
    }
    localStorage.setItem("shopping_cart", JSON.stringify(cart));

    // 3. التحول للون الأخضر وكلمة Added
    buttons.forEach(button => {
        button.textContent = "Added! ✓";
        button.style.backgroundColor = successGreen;
        button.style.pointerEvents = "none"; // تعطيل الزر مؤقتاً
    });

    // تحديث رقم الكارت في الهيدر
    updateCartBadge();

    // 4. العودة للدرجة البرتقالية #FF6B00 بعد ثانية واحدة
    setTimeout(() => {
        buttons.forEach(button => {
            button.textContent = originalText;
            button.style.backgroundColor = myOrange; // العودة للدرجة المطلوبة
            button.style.pointerEvents = "auto";
        });
    }, 1000); 
}
/* ===================== SETUP ADD TO CART BUTTONS ===================== */
function setupCartListener() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".add-to-cart");
        if (!btn) return;

        
        if (!isUserLoggedIn()) {
            alert("Please login first");
            window.location.href = "login.html";
            return;
        }

        const productId = btn.dataset.id;
        const productName = btn.dataset.name;
        const productPrice = btn.dataset.price;
        const productImage = btn.dataset.img;

        addToCart(productId, productName, productPrice, productImage);
    });
}


document.addEventListener("DOMContentLoaded", () => {
    setupCartListener();     // ← مهم جدًا عشان الأزرار تشتغل
    updateCartBadge();       // تحديث عدد الكارت في الهيدر

   
    setupNavbar();
    setupMobileMenu();
    // setupFloatingHeader(); 
});



function setupFloatingHeader() {

  const header = document.querySelector('.elhandasia-header');

  const navbar = document.querySelector('.navbar');

  const target = document.querySelector('.section3');



  if (!navbar || !target) return;



  window.addEventListener('scroll', () => {

      if (window.scrollY >= target.offsetTop - 100) {

          header?.classList.add('visible');

          navbar.style.top = '-90px';

      } else {

          header?.classList.remove('visible');

          navbar.style.top = '0';

      }

  }, { passive: true });

};
/* ===================== حماية أيقونة الكارت فقط ===================== */
let cartAlertShown = false;

document.addEventListener("click", (e) => {
    // 1. تحديد كل أشكال أيقونة الكارت (السلة)
    const cartIcon = e.target.closest(
        '.cart, .cart-icon, .header-cart, .fa-shopping-cart, #cart-icon, a[href*="cart"]'
    );

    // 2. لو الضغطة مش على الكارت، اخرج من الدالة ومتمتعش أي حاجة تانية (زي تفاصيل المنتج)
    if (!cartIcon) return;

    // 3. لو الضغطة على الكارت والمستخدم مش مسجل دخول
    if (!isUserLoggedIn()) {
        e.preventDefault();
        e.stopPropagation();

        if (cartAlertShown) return;
        cartAlertShown = true;

        alert("Please login first");

        setTimeout(() => {
            window.location.href = "login.html";
            cartAlertShown = false; // إعادة تعيينها عشان لو رجع يحاول تاني
        }, 100);
    }
});

document.addEventListener("click", (e) => {

    // كل أشكال أيقونة الكارت الممكنة
    const cartIcon = e.target.closest(
        '.cart, .cart-icon, .header-cart, .fa-shopping-cart, #cart-icon, a[href*="cart"]'
    );

    if (!cartIcon) return;

    if (!isUserLoggedIn()) {
        e.preventDefault();
        e.stopPropagation();

        if (cartAlertShown) return;
        cartAlertShown = true;

        //alert("⚠️ You must log in first to access the cart.");

        setTimeout(() => {
            window.location.href = "login.html";
        }, 100);
    }
});

// ///////////////////////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', () => {
    // جلب التوكن
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    
    // جلب العناصر (تأكدي أن الـ ID مطابق للـ HTML عندك)
    const adminLink = document.getElementById('admin-dash-link');
    const accountIcon = document.getElementById('userAccountIcon');

    if (token) {
        try {
            // فك التوكن
            const payload = JSON.parse(window.atob(token.split('.')[1]));
            const userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;

            console.log("Current Role:", userRole); // عشان تتأكدي في الـ Console النوع إيه

            if (userRole === "Admin") {
                if (adminLink) adminLink.style.setProperty('display', 'flex', 'important');
                if (accountIcon) accountIcon.style.display = 'none';
            } 
            else if (userRole === "User") {
                if (accountIcon) accountIcon.style.setProperty('display', 'flex', 'important');
                if (adminLink) adminLink.style.display = 'none';
            }
        } catch (e) {
            console.error("Token error", e);
        }
    }
});
// /////////////////////////////////////////////القلب////////////////////////////////////////////////////////////
function updateWishlistBadge() {
    const wishlistBadge = document.getElementById("wishlist-count");
    const wishlistLink = document.getElementById("wishlist-link"); // أمسكي اللينك نفسه كمان
    
    if (!wishlistBadge) return;

    // 1. حساب عدد المنتجات من التخزين
    let favCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("fav-") && localStorage.getItem(key) === "true") {
            favCount++;
        }
    }

    // 2. فحص التوكن
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    let isUser = false;
    
    if (token) {
        try {
            const payload = JSON.parse(window.atob(token.split('.')[1]));
            const userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;
            // تأكدي أن كلمة User مطابقة تماماً لما في التوكن (مثلاً u كبيرة)
            if (userRole === "User") isUser = true;
        } catch (e) { console.error("Token error:", e); }
    }

    // 3. التحكم في الظهور (مهم جداً للريفرش)
    if (isUser) {
        // إظهار أيقونة المفضلة لليوزر دائماً
        if (wishlistLink) wishlistLink.style.setProperty('display', 'flex', 'important');
        
        // إظهار الرقم فقط لو أكبر من 0
        if (favCount > 0) {
            wishlistBadge.textContent = favCount;
            wishlistBadge.style.setProperty('display', 'flex', 'important');
            wishlistBadge.style.visibility = "visible";
        } else {
            wishlistBadge.style.display = "none";
        }
    } else {
        // إخفاء الأيقونة بالكامل لو مش يوزر (أدمن أو زائر)
        if (wishlistLink) wishlistLink.style.display = "none";
    }
}

// ///////////////////////////////////////////////////////////////////////
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-categories');
const mobileLinks = document.querySelectorAll('#mobile-categories a');

// 1. لما نضغط على الثلاث شرط (فتح / قفل)
hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('show');
});

// 2. لما نضغط على أي لينك جوه القائمة (تقفل ونروح للقسم)
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('show');
    });
});






// /////////////////////////////////////////////////////////القلب //////////////////////////////////////////////////////////////////

async function addToFavorites(productId) {
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');
    
    if (!token) {
        alert("Please login first");
        return;
    }

    try {
        const response = await fetch('https://el-handasia.runasp.net/api/Favorites', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json' // إضافة التأكيد على قبول JSON
            },
            // الحل السحري: تحويل productId لرقم باستخدام Number()
            body: JSON.stringify({ 
                productId: Number(productId) 
            }) 
        });

        if (response.ok) {
            alert("Added to favorites successfully!");
            if (typeof updateWishlistBadge === 'function') updateWishlistBadge();
        } else {
            // لقراءة سبب الرفض بالتفصيل من السيرفر
            const errorData = await response.json();
            console.error("Server Response Error:", errorData);
            alert("Error: " + (errorData.title || "Request rejected by server"));
        }
    } catch (err) {
        console.error("Network or Syntax Error:", err);
    }
}

async function syncFavorites() {
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');
    if (!token) return;

    try {
        const res = await fetch("https://el-handasia.runasp.net/api/Favorites", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            const serverFavorites = await res.json();

            // 1. مسح كل حالات القلوب القديمة من الـ LocalStorage تماماً
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('fav-')) {
                    localStorage.removeItem(key);
                }
            });

            // 2. تخزين المنتجات اللي جاية من السيرفر حالياً فقط
            serverFavorites.forEach(item => {
                localStorage.setItem("fav-" + item.productId, "true");
            });

            // 3. تحديث شكل القلوب في الصفحة بناءً على البيانات الجديدة
            if (typeof updateHeartsUI === 'function') updateHeartsUI();
            
            console.log("Favorites synced with server. Old data cleared.");
        }
    } catch (err) {
        console.error("Sync Error:", err);
    }
}

// تشغيل المزامنة أول ما الصفحة تحمل
document.addEventListener("DOMContentLoaded", syncFavorites);



// /////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
    const BASE_URL = "https://el-handasia.runasp.net";
    const navWrappers = document.querySelectorAll(".nav-item-wrapper");

    // 1. تعريف "الخريطة" (Map): هنا بنربط رقم القسم (index) بمجموعة الـ IDs بتاعته
    // الميزة هنا إنك لو زودتي أي صنف جديد، بتضيفي الـ ID بتاعه هنا بس
    const categoryMapping = new Map([
        [0, [1, 2, 3, 4, 37, 38, 42, 43]],     // اللابتوب (كل الـ 8 لابتوبات)
        [1, [5, 6, 7, 8]],                     // البرنترات
        [2, [9, 10, 11, 12, 44, 45, 46]],     // الكمبيوتر (تلقائياً بياخد pppp ولالالا و ooo)
        [3, [13, 14, 15, 16]],                 // الإكسسوارات
        [4, [17, 18, 19, 20]],                 // Solutions
        [5, [21, 22, 23, 24]],                 // Smart Home
        [6, [25]]                              // General
    ]);

    navWrappers.forEach((wrapper, index) => {
        wrapper.addEventListener("mouseenter", async function () {
            const submenu = this.querySelector(".dropdown-menu");

            if (submenu.innerHTML !== "" && !submenu.innerHTML.includes("Loading")) return;

            try {
                submenu.innerHTML = '<li style="padding:10px; font-size:12px;">Loading...</li>';
                
                const response = await fetch(`${BASE_URL}/api/SubCategories`);
                const allData = await response.json();

                // 2. سحب الـ IDs المحددة للقسم الحالي من الـ Map
                const allowedIds = categoryMapping.get(index) || [];

                // 3. فلترة "اللكشة" بناءً على الـ Map (الـ Parsing الحقيقي)
                const filteredData = allData.filter(item => allowedIds.includes(item.id));

                if (filteredData.length > 0) {
                    // 4. استخدام map لعرض البيانات النهائية
                    submenu.innerHTML = filteredData.map(sub => `
                        <li><a href="category.html?subId=${sub.id}">${sub.name}</a></li>
                    `).join("");
                } else {
                    submenu.innerHTML = '<li style="padding:10px;">No items found</li>';
                }

            } catch (error) {
                console.error("Parsing Error:", error);
                submenu.innerHTML = '<li style="padding:10px;">Error loading data</li>';
            }
        });
    });
});