
function handleAuthUI() {
    // بنشوف هل الـ token موجود؟
    const token = localStorage.getItem("userToken");
    const loginBtn = document.getElementById("mainLoginBtn");

    if (token && loginBtn) {
        // لو التوكن موجود، بنخفي الزرار تماماً
        loginBtn.style.setProperty('display', 'none', 'important');
        console.log("User is logged in - Button hidden");
    } else {
        console.log("No token found - Button visible");
    }
}

// تشغيل الفحص أول ما الصفحة تحمل
window.addEventListener('load', handleAuthUI);
// تشغيل الفحص احتياطي لو حصل أي تغيير في الذاكرة
window.addEventListener('storage', handleAuthUI);









const API_URL = "https://el-handasia.runasp.net";
const WHATSAPP_NUMBER = "201018413535";
let currentProductData = null;
let searchTimeout = null;

// Fix image URLs
function fixImg(p) { 
    if (!p) return 'img/placeholder.jpg';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    if (p.startsWith('/')) return `${API_URL}${p}`;
    return `${API_URL}/${p.replace(/\\/g, '/')}`;
}

// Change quantity
function changeQty(v) {
    let q = document.getElementById('qty');
    if (q) {
        let val = parseInt(q.value) + v;
        if (val >= 1) q.value = val;
    }
}

// Swap main image
function swap(el) {
    const bigImg = document.getElementById('big-img');
    if (bigImg) bigImg.src = el.src;
    document.querySelectorAll('.thumbnails img').forEach(img => img.classList.remove('active'));
    el.classList.add('active');
}

// Check if user is logged in
function isUserLoggedIn() {
    const token = localStorage.getItem("token");
    return token !== null && token !== undefined && token !== '';
}

// Show login required message
function showLoginRequired(action) {
    if (typeof Swal === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
        script.onload = function() {
            showLoginRequired(action);
        };
        document.head.appendChild(script);
        return;
    }
    
    Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        html: `
            <div style="text-align: center;">
                <i class="fas fa-user-lock" style="font-size: 48px; color: #ff9800; margin: 20px 0;"></i>
                <p style="margin: 15px 0;">You need to login to <strong>${action}</strong></p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Go to Login',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.setItem('returnUrl', window.location.href);
            window.location.href = 'login.html';
        }
    });
}

// Load product data
async function loadProduct() {
    const id = new URLSearchParams(window.location.search).get('id') || 1;
    
    try {
        const res = await fetch(`${API_URL}/api/Products/${id}`);
        if (!res.ok) throw new Error("Product not found");
        const p = await res.json();
        currentProductData = p;
        
        displayMainProduct(p);
        
        if (p.relatedProducts && Array.isArray(p.relatedProducts) && p.relatedProducts.length > 0) {
            displayRelatedProducts(p.relatedProducts);
        } else {
            if (p.categoryId) {
                await loadRelatedProductsFromCategory(p.categoryId, id);
            } else {
                const relatedGrid = document.getElementById('related-products-grid');
                if (relatedGrid) {
                    relatedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No related products found for this item.</p>`;
                }
            }
        }
    } catch (e) { 
        console.error("Error loading product data:", e);
        document.getElementById('product-page').innerHTML = `<div style="text-align: center; padding: 50px;"><h3>Error: Product not found</h3></div>`;
    }
}

async function loadRelatedProductsFromCategory(categoryId, currentProductId) {
    try {
        const response = await fetch(`${API_URL}/api/categories/${categoryId}/products`);
        if (!response.ok) {
            console.warn('Could not load related products');
            const relatedGrid = document.getElementById('related-products-grid');
            if (relatedGrid) {
                relatedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Could not load related products.</p>`;
            }
            return;
        }
        
        const data = await response.json();
        
        let products = [];
        if (data.products && data.products.items && Array.isArray(data.products.items)) {
            products = data.products.items;
        } else if (Array.isArray(data)) {
            products = data;
        } else if (data.items && Array.isArray(data.items)) {
            products = data.items;
        } else {
            console.warn('Unexpected API response format:', data);
            const relatedGrid = document.getElementById('related-products-grid');
            if (relatedGrid) {
                relatedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No related products available.</p>`;
            }
            return;
        }
        
        const relatedProducts = products
            .filter(product => product.id != currentProductId && product.id != null)
            .slice(0, 6)
            .map(product => {
                const currentDate = new Date();
                const hasActiveDiscount = product.discountPrice && 
                                        product.discountStartDate && 
                                        product.discountEndDate &&
                                        new Date(product.discountStartDate) <= currentDate &&
                                        new Date(product.discountEndDate) >= currentDate;
                const displayPrice = hasActiveDiscount ? parseFloat(product.discountPrice) : parseFloat(product.price);
                
                return {
                    id: product.id,
                    name: product.name,
                    imageUrl: product.mainImageUrl || product.imageUrl,
                    price: parseFloat(product.price) || 0,
                    displayPrice: displayPrice.toFixed(2),
                    hasDiscount: hasActiveDiscount,
                    rating: product.rating || 4.5,
                    reviewCount: product.reviewCount || 0
                };
            });
        
        if (relatedProducts.length > 0) {
            displayRelatedProducts(relatedProducts);
        } else {
            const relatedGrid = document.getElementById('related-products-grid');
            if (relatedGrid) {
                relatedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No related products found for this item.</p>`;
            }
        }
    } catch (error) {
        console.error("Error loading related products:", error);
        const relatedGrid = document.getElementById('related-products-grid');
        if (relatedGrid) {
            relatedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Error loading related products.</p>`;
        }
    }
}

// Display main product
function displayMainProduct(p) {
    const originalPrice = parseFloat(p.price) || 0;
    const discountPrice = p.discountPrice ? parseFloat(p.discountPrice) : null;
    
    let hasDiscount = p.hasDiscount;
    if (hasDiscount === undefined && discountPrice) {
        const currentDate = new Date();
        hasDiscount = p.discountStartDate && 
                    p.discountEndDate &&
                    new Date(p.discountStartDate) <= currentDate &&
                    new Date(p.discountEndDate) >= currentDate &&
                    discountPrice < originalPrice;
    } else if (hasDiscount === undefined) {
        hasDiscount = discountPrice && discountPrice < originalPrice && originalPrice > 0;
    }
    
    const displayPrice = p.displayPrice ? parseFloat(p.displayPrice) : (hasDiscount && discountPrice ? discountPrice : originalPrice);
    
    let discountPercentage = p.discountPercentage;
    if (hasDiscount && !discountPercentage && discountPrice && originalPrice > 0) {
        discountPercentage = Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
    }

    let thumbs = `<img src="${fixImg(p.mainImageUrl)}" class="active" onclick="swap(this)">`;
    if (p.additionalImages && Array.isArray(p.additionalImages)) {
        p.additionalImages.forEach(img => { 
            thumbs += `<img src="${fixImg(img)}" onclick="swap(this)">`; 
        });
    }

    const list = p.description ? p.description.split('.').filter(t => t.trim()).map(t => `<li>${t.trim()}</li>`).join('') : 'No description available';

    let specRows = "";
    if (p.specifications && Array.isArray(p.specifications) && p.specifications.length > 0) {
        p.specifications.forEach(spec => {
            specRows += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: bold; background: #fafafa; color: #333; width: 30%;">${spec.specificationName || 'Specification'}</td>
                    <td style="padding: 12px; color: #666;">${spec.value || ''}</td>
                </tr>`;
        });
    }

    document.getElementById('product-page').innerHTML = `
        <div class="thumbnails" style="display: flex; flex-direction: column; align-items: center; gap: 10px; max-height: 500px; overflow-y: auto; width: 100px; padding: 10px;">${thumbs}</div>
        
        <div class="main-image-box">
            <img id="big-img" src="${fixImg(p.mainImageUrl)}">
            <div class="zoom-icon"><i class="fas fa-search-plus"></i></div>
        </div>

        <div class="product-details">
            <h1>${p.name}</h1>
            <div class="stars">
                <span style="color:#f1c40f">★★★★★</span> 
                <span style="color:#007185">4.5 (${p.reviewCount || 0} reviews)</span>
            </div>
            
            <div class="price-row">
                ${hasDiscount ? `
                    <span class="old-price">${parseFloat(p.price).toFixed(2)} EGP</span> 
                    <span class="discount-tag">-${discountPercentage}%</span>
                ` : ''}
                <div class="current-price">${parseFloat(displayPrice).toFixed(2)} <small style="font-size:16px">EGP</small></div>
            </div>

            <div class="qty-label">Quantity:</div>
            <div class="qty-selector">
                <div class="qty-controls">
                    <button onclick="changeQty(-1)">-</button>
                    <input type="text" id="qty" value="1" readonly>
                    <button onclick="changeQty(1)">+</button>
                </div>
                <span class="stock-status" style="color: #27ae60">
                    In Stock
                </span>
            </div>

      

        <div class="offer-card">
            <div>
                <h2>Exclusive Offer</h2>
                <p>Order now and get special discounts on accessories</p>
            </div>
            <button class="btn-shop" onclick="shopNow()">Shop Now</button>
        </div>

        <div class="description-box">
            <h3>Product Description</h3>
            <ul>${list}</ul>

            <div class="product-specs" style="margin-top: 30px;">
                <h3 style="margin-bottom: 15px;">Product details</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 14px;">
                    <tbody>
                        ${specRows || '<tr><td style="padding:15px; text-align:center;">No additional details available</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    updateButtonStyles();
    const mainImg = document.getElementById('big-img');
    const zoomBtn = document.querySelector('.zoom-icon');

    if (zoomBtn && mainImg) {
        zoomBtn.onclick = function() {
            mainImg.classList.toggle('is-zoomed');
            const icon = zoomBtn.querySelector('i');
            if (mainImg.classList.contains('is-zoomed')) {
                icon.classList.replace('fa-search-plus', 'fa-search-minus');
            } else {
                icon.classList.replace('fa-search-minus', 'fa-search-plus');
            }
        };

        mainImg.onclick = function() {
            if (this.classList.contains('is-zoomed')) {
                this.classList.remove('is-zoomed');
                zoomBtn.querySelector('i').classList.replace('fa-search-minus', 'fa-search-plus');
            }
        };
    }
}

// Display related products
function displayRelatedProducts(relatedProducts) {
    const relatedGrid = document.getElementById('related-products-grid');
    if (!relatedGrid) return;

    if (!relatedProducts || !Array.isArray(relatedProducts) || relatedProducts.length === 0) {
        relatedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No related products found for this item.</p>`;
        return;
    }

    let html = '';
    
    relatedProducts.forEach(item => {
        const displayPrice = item.displayPrice || item.price || 0;
        const imageUrl = item.imageUrl || item.mainImageUrl || '';
        const rating = item.rating || 4.5;
        const reviewCount = item.reviewCount || 0;
        
        html += `
            <div class="card" onclick="window.location.href='product-details.html?id=${item.id}'" style="cursor:pointer">
                <div class="img-wrap">
                    <img src="${fixImg(imageUrl)}" alt="${item.name}">
                    <button class="fav ${isFav(item.id) ? 'active' : ''}" onclick="toggleFavorite('${item.id}', event)">
                        <i class="${isFav(item.id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="title">${item.name}</div>
               
          <div class="rating" >


<span style="color: #FF6B00; font-size: 16px; font-weight: bold; ">In Stock</span>
          </div>

                    <div class="price">${parseFloat(displayPrice).toFixed(2)} EGP</div>
                    <button class="btn" onclick="addRelatedToCart('${item.id}', event)">
                        <i class="fa-solid fa-cart-shopping"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
    relatedGrid.innerHTML = html;
}

// Add to Cart function

// Add related product to cart

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
    const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    
    const cartIcon = document.querySelector('.icon-item .fa-shopping-cart')?.closest('.icon-item');
    if (cartIcon) {
        const existingBadge = cartIcon.querySelector('.cart-badge');
        if (existingBadge) existingBadge.remove();
        
   
    }
}

// Order Now function
function orderNow() {
    console.log('Order Now clicked');
    
    if (!isUserLoggedIn()) {
        showLoginRequired('place an order');
        return false;
    }
    
    openSummary();
    return false;
}

// Open summary modal
function openSummary() {
    if (!isUserLoggedIn()) {
        showLoginRequired('place an order');
        return;
    }

    if (!currentProductData) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Product data not loaded yet. Please refresh the page.'
            });
        }
        return;
    }

    const qty = parseInt(document.getElementById('qty').value) || 1;
    
    const currentDate = new Date();
    const hasActiveDiscount = currentProductData.discountPrice && 
                            currentProductData.discountStartDate && 
                            currentProductData.discountEndDate &&
                            new Date(currentProductData.discountStartDate) <= currentDate &&
                            new Date(currentProductData.discountEndDate) >= currentDate;
    const unitPrice = hasActiveDiscount ? parseFloat(currentProductData.discountPrice) : parseFloat(currentProductData.price);
    const total = unitPrice * qty;

    document.getElementById('summaryBox').innerHTML = `
        <div class="customer-info-section" style="text-align: left; margin-bottom: 20px;">
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <label style="font-weight: 600; color: #333;">Your Name:</label>
                <input type="text" id="custName" placeholder="Full Name" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <label style="font-weight: 600; color: #333;">Phone Number:</label>
                <input type="tel" id="custPhone" placeholder="01xxxxxxxxx" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;">
            </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

        <div style="text-align: left; margin-bottom: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Order Details</h4>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span>Product:</span>
                <span style="font-weight: 500;">${currentProductData.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span>Quantity:</span>
                <span>${qty}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span>Unit Price:</span>
                <span>${unitPrice.toLocaleString()} EGP</span>
            </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 15px 0; margin-top: 10px; border-top: 2px solid #eee; font-size: 22px; font-weight: bold; color: #000;">
            <span>Total:</span>
            <span style="color: #FF6B00;">${total.toLocaleString()} EGP</span>
        </div>
    `;
    document.getElementById('modalOverlay').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

// Send to WhatsApp
async function sendToWhatsApp() {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const qty = document.getElementById('qty').value || 1;
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');

    if (!name || !phone) {
        Swal.fire({ icon: 'warning', title: 'بيانات ناقصة', text: 'يرجى إدخال الاسم ورقم الهاتف' });
        return;
    }

    const phoneRegex = /^01[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
        Swal.fire({ icon: 'error', title: 'رقم خطأ', text: 'يرجى إدخال رقم هاتف مصري صحيح' });
        return;
    }

    const currentDate = new Date();
    const hasActiveDiscount = currentProductData.discountPrice && 
                              currentProductData.discountStartDate && 
                              currentProductData.discountEndDate &&
                              new Date(currentProductData.discountStartDate) <= currentDate &&
                              new Date(currentProductData.discountEndDate) >= currentDate;

    const unitPrice = hasActiveDiscount ? parseFloat(currentProductData.discountPrice) : parseFloat(currentProductData.price);
    const total = unitPrice * qty;

    const orderData = {
        customerPhone: phone,
        whatsappNumber: WHATSAPP_NUMBER,
        notes: `طلب مباشر من المنتج: ${currentProductData.name} - اسم العميل: ${name}`,
        items: [{
            productId: Number(currentProductData.id),
            quantity: Number(qty)
        }]
    };

    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) throw new Error('Failed to sync with server');
        console.log("Order added to dashboard successfully!");
    } catch (error) {
        console.error("Dashboard sync error:", error);
    }

    const message = `السلام عليكم، أريد طلب المنتج التالي:%0A%0A` +
                    `*📦 المنتج:* ${currentProductData.name}%0A` +
                    `*💰 السعر:* ${unitPrice.toLocaleString()} EGP%0A` +
                    `*🔢 الكمية:* ${qty}%0A%0A` +
                    `--------------------------%0A` +
                    `*👤 بيانات العميل:*%0A` +
                    `*الاسم:* ${name}%0A` +
                    `*الهاتف:* ${phone}%0A%0A` +
                    `*💵 الإجمالي:* ${total.toLocaleString()} EGP`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    closeModal();
    
    Swal.fire({
        icon: 'success',
        title: 'تم استلام طلبك',
        text: 'سيتم تحويلك للواتساب للتأكيد',
        timer: 2000,
        showConfirmButton: false
    });
}

// Shop Now function
function shopNow() {
    console.log('Shop Now clicked');
    
    if (!isUserLoggedIn()) {
        showLoginRequired('view special offers');
        return false;
    }
    
    window.location.href = 'products.html';
    return false;
}

// Update button styles
function updateButtonStyles() {
    const isLoggedIn = isUserLoggedIn();
    
    setTimeout(() => {
        const mainButtons = document.querySelectorAll('.btn-cart, .btn-order, .btn-shop');
        mainButtons.forEach(btn => {
            if (btn) {
                if (!isLoggedIn) {
                    btn.style.opacity = '0.7';
                    btn.title = 'Login required';
                } else {
                    btn.style.opacity = '1';
                    btn.title = '';
                }
            }
        });
        
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn) {
            if (isLoggedIn) {
                loginBtn.textContent = 'login';
                loginBtn.onclick = function(e) {
                    e.preventDefault();
                    window.location.href = 'login.html';
                };
            } else {
                loginBtn.textContent = 'Log In';
                loginBtn.onclick = function(e) {
                    e.preventDefault();
                    window.location.href = 'login.html';
                };
            }
        }
    }, 100);
}

function isFav(productId) {
    if (!productId) return false;
    let favorites = JSON.parse(localStorage.getItem('user_favorites')) || [];
    return favorites.includes(productId.toString());
}

function updateLocalFavs(productId, isAdd) {
    let favorites = JSON.parse(localStorage.getItem('user_favorites')) || [];
    let pIdStr = productId.toString();

    if (isAdd) {
        if (!favorites.includes(pIdStr)) favorites.push(pIdStr);
    } else {
        favorites = favorites.filter(id => id !== pIdStr);
    }
    localStorage.setItem('user_favorites', JSON.stringify(favorites));
}

async function toggleFavorite(productId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    if (!isUserLoggedIn()) {
        showLoginRequired('add items to favorites');
        return;
    }

    const token = localStorage.getItem("token");
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    const isCurrentlyFav = btn.classList.contains('active');

    if (!isCurrentlyFav) {
        btn.classList.add('active');
        icon.classList.replace('fa-regular', 'fa-solid');
        icon.style.color = "red";
    } else {
        btn.classList.remove('active');
        icon.classList.replace('fa-solid', 'fa-regular');
        icon.style.color = "";
    }

    try {
        let response;
        if (!isCurrentlyFav) {
            response = await fetch(`${API_URL}/api/Favorites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: parseInt(productId)
                })
            });
        } else {
            response = await fetch(`${API_URL}/api/Favorites/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }

        if (response.ok) {
            console.log("Success: Server updated");
            updateLocalFavs(productId, !isCurrentlyFav);
        } else {
            throw new Error("Server rejected request");
        }
    } catch (error) {
        console.error("Favorite Error:", error);
        btn.classList.toggle('active');
        icon.classList.toggle('fa-solid');
        icon.classList.toggle('fa-regular');
        if(!isCurrentlyFav) icon.style.color = "";
    }
}

function handleCartClick() {
    if (isUserLoggedIn()) {
        window.location.href = 'cart.html';
    } else {
        alert("Please login first");
        window.location.href = 'login.html';
    }
}

// ============ SIMPLIFIED SEARCH FUNCTIONALITY ============

// Show empty search warning
function showEmptySearchWarning() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.classList.add('shake');
        setTimeout(() => searchInput.classList.remove('shake'), 500);
        searchInput.focus();
    }
}

// Get all products from API

// Search products function

// Display search results in dropdown

// Select a search result from dropdown
function selectSearchResult(productId) {
    // Hide dropdown
    const dropdown = document.getElementById('autocompleteDropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    // Clear search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    // Navigate to product page
    window.location.href = `product-details.html?id=${productId}`;
}

// Real-time search as user types
async function performRealTimeSearch(searchTerm) {
    // إلغاء التوقيت القديم
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // إخفاء القائمة لو البحث فارغ
    if (!searchTerm || searchTerm.trim() === '') {
        const dropdown = document.getElementById('autocompleteDropdown');
        if (dropdown) dropdown.style.display = 'none';
        return;
    }
    
    // تنفيذ البحث باستخدام الدالة الجديدة التي تطلب Q وتجلب 100 نتيجة
    searchTimeout = setTimeout(async () => {
        try {
            // استدعاء الدالة الجديدة مباشرة
            await performSearch(searchTerm); 
        } catch (error) {
            console.error('Real-time search error:', error);
        }
    }, 300);
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (!searchInput || !searchBtn) {
        console.error('Search elements not found');
        return;
    }
    
    // Real-time search as user types
    searchInput.addEventListener('input', function(e) {
        const searchTerm = this.value.trim();
        performRealTimeSearch(searchTerm);
    });
    
    // Search button click
    searchBtn.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        
        if (!searchTerm) {
            showEmptySearchWarning();
            return;
        }
        
        // Perform search
        performRealTimeSearch(searchTerm);
    });
    
    // Enter key - also triggers search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const searchTerm = this.value.trim();
            
            if (!searchTerm) {
                showEmptySearchWarning();
                return;
            }
            
            // Perform search
            performRealTimeSearch(searchTerm);
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('autocompleteDropdown');
        if (dropdown && !searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Keyboard navigation in dropdown
    searchInput.addEventListener('keydown', function(e) {
        const dropdown = document.getElementById('autocompleteDropdown');
        if (!dropdown || dropdown.style.display === 'none') return;
        
        const items = dropdown.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;
        
        let activeIndex = -1;
        
        items.forEach((item, index) => {
            if (item.classList.contains('active')) {
                activeIndex = index;
                item.classList.remove('active');
            }
        });
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (activeIndex + 1) % items.length;
            items[nextIndex].classList.add('active');
            items[nextIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
            items[prevIndex].classList.add('active');
            items[prevIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const activeItem = dropdown.querySelector('.autocomplete-item.active');
            if (activeItem) {
                activeItem.click();
            } else if (items.length > 0) {
                // Select first item if none is active
                items[0].click();
            }
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
        }
    });
    
    console.log('✅ Search setup complete');
}

// Initialize everything
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📱 Page loaded');
    
    // Load product
    try {
        await loadProduct();
    } catch (error) {
        console.error('Error loading product:', error);
    }
    
    // Update cart and buttons
    updateCartCount();
    updateButtonStyles();
    
    // Setup search
    setTimeout(() => {
        setupSearch();
        console.log('✅ Search functionality ready');
    }, 1000);
    
    // Load SweetAlert if needed
    if (typeof Swal === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
        document.head.appendChild(script);
    }
    
    // Modal close events
    document.getElementById('modalOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
});

// User account icon
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    const accountIcon = document.getElementById('userAccountIcon');

    if (token && accountIcon) {
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                const userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;

                if (userRole === "User") {
                    accountIcon.style.setProperty('display', 'flex', 'important');
                } else {
                    accountIcon.style.display = 'none';
                }
            }
        } catch (error) {
            console.error("خطأ في قراءة بيانات المستخدم:", error);
            accountIcon.style.display = 'none';
        }
    }
});
// دالة لجلب البيانات من الـ API عند البحث
// دالة البحث المحسنة
// 1. تعريف دالة البحث مع معالجة شاملة للأخطاء
async function performSearch(query) {
    if (!query || query.trim().length < 1) {
        document.getElementById('autocompleteDropdown').style.display = 'none';
        return;
    }

    console.log("🔍 Searching across ALL products for:", query);

    try {
        // لاحظ هنا: شلنا أي CategoryId عشان يظهر "كل" المنتجات مهما كان نوعها
        // وضفنا PageSize=100 عشان يظهر MSI حتى لو كان في آخر القائمة
        const response = await fetch(`${API_URL}/api/products/search?Q=${encodeURIComponent(query)}&PageSize=100`);
        
        if (!response.ok) throw new Error("Server response error");

        const data = await response.json();
        const products = data.items || data; // التعامل مع صيغة الـ JSON سواء كانت items أو مصفوفة

        const dropdown = document.getElementById('autocompleteDropdown');
        dropdown.innerHTML = ''; 

        if (!products || products.length === 0) {
            dropdown.innerHTML = '<div class="autocomplete-item">No results found</div>';
        } else {
            products.forEach(product => {
                // حل مشكلة صورة الـ 404: 
                // لو الصورة الأصلية مش موجودة، هيعرض صورة مؤقتة من الإنترنت بدل ما يوقف الكود
                const imgUrl = product.mainImageUrl ? fixImg(product.mainImageUrl) : 'https://via.placeholder.com/150';

                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.style = "display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;";
                item.innerHTML = `
                    <img src="${imgUrl}" 
                         onerror="this.src='https://via.placeholder.com/50'" 
                         style="width:45px; height:45px; object-fit:cover; margin-right:12px; border-radius:5px;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:bold; color:#333;">${product.name}</span>
                        <span style="color:#FF6B00; font-size:13px;">${product.price} EGP</span>
                    </div>
                `;

                item.onclick = () => {
                    // التوجيه المباشر للمنتج عن طريق الـ ID فقط
                    window.location.href = `product-details.html?id=${product.id}`;
                };
                dropdown.appendChild(item);
            });
        }
        dropdown.style.display = 'block';
    } catch (error) {
        console.error("❌ Search Error:", error);
    }
}
// 1. التعريف (مرة واحدة فقط)
if (typeof searchTimeout === 'undefined') {

}

// 2. الدالة الأساسية لجلب البيانات
async function performSearch(query) {
    const dropdown = document.getElementById('autocompleteDropdown');
    if (!query || query.trim().length < 1) {
        if (dropdown) dropdown.style.display = 'none';
        return;
    }

    try {
        // استخدام Q و PageSize=100 لضمان ظهور كل النتائج (مثل MSI)
        const response = await fetch(`${API_URL}/api/products/search?Q=${encodeURIComponent(query)}&PageSize=100`);
        const data = await response.json();
        const products = data.items || data;

        if (dropdown) {
            dropdown.innerHTML = ''; 
            if (!products || products.length === 0) {
                dropdown.innerHTML = '<div class="autocomplete-item" style="padding:10px;">لا توجد نتائج</div>';
            } else {
                products.forEach(product => {
                    const imgUrl = product.mainImageUrl ? fixImg(product.mainImageUrl) : 'img/placeholder.jpg';
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.style = "display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; gap: 10px;";
                    item.innerHTML = `
                        <img src="${imgUrl}" onerror="this.src='https://via.placeholder.com/50'" style="width:40px; height:40px; object-fit:cover; border-radius:5px;">
                        <div>
                            <div style="font-weight:bold; font-size:14px; color:#333;">${product.name}</div>
                            <div style="color:#FF6B00; font-size:13px;">${product.price} EGP</div>
                        </div>
                    `;
                    item.onclick = () => window.location.href = `product-details.html?id=${product.id}`;
                    dropdown.appendChild(item);
                });
            }
            dropdown.style.display = 'block';
        }
    } catch (error) {
        console.error("Search Error:", error);
    }
}

// 3. دالة التوقيت
function performRealTimeSearch(searchTerm) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(searchTerm), 300);
}
//////////////////////////////////////////////////////////////////////////////////
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