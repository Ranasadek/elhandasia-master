
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
    
    let thumbs = `<img src="${fixImg(p.mainImageUrl)}" class="active" onclick="swap(this)">`;
    if (p.additionalImages && Array.isArray(p.additionalImages)) {
        p.additionalImages.forEach(img => { 
            thumbs += `<img src="${fixImg(img)}" onclick="swap(this)">`; 
        });
    }

    const list = p.description ? p.description.split('.').filter(t => t.trim()).map(t => `<li>${t.trim()}</li>`).join('') : 'No description available';

    // 1. رسم الصفحة مع ضبط المسافات والعداد المخفي
    document.getElementById('product-page').innerHTML = `
    <div class="thumbnails" style="display: flex; flex-direction: column; align-items: center; gap: 10px; max-height: 500px; overflow-y: auto; width: 100px; padding: 10px;">${thumbs}</div>
    
    <div class="main-image-box">
        <img id="big-img" src="${fixImg(p.mainImageUrl)}">
        <div class="zoom-icon"><i class="fas fa-search-plus"></i></div>
    </div>
    
    <div class="product-details" style="display: flex !important; flex-direction: column !important; height: auto !important; min-height: unset !important; gap: 5px !important; justify-content: flex-start !important;">
        <h1 style="margin:0">${p.name}</h1>
        <div class="rating">
            <span style="color: #FF6B00; font-size: 16px; font-weight: bold;">In Stock</span>
        </div>
        
        <div class="price-row" style="margin-bottom: 5px;">
            ${hasDiscount ? `<span class="old-price">${parseFloat(p.price).toFixed(2)} EGP</span>` : ''}
            <div class="current-price">${parseFloat(displayPrice).toFixed(2)} <small style="font-size:16px">EGP</small></div>
        </div>

        <input type="hidden" id="qty" value="1">

        <div class="short-description" style="
            margin: 5px 0; 
            border-top: 1px solid #eee; 
            padding: 8px; 
            max-height: 150px; 
            overflow-y: auto; 
            background: #fdfdfd; 
            border-radius: 5px;">
            <h4 style="margin: 0 0 5px 0; color: #333; font-size: 14px;">Product Description:</h4>
            <ul style="padding-left: 18px; color: #666; font-size: 13px; line-height: 1.4; margin: 0;">
                ${list}
            </ul>
        </div>
    
        <div class="action-btns" style="margin-top: 5px; display: flex; gap: 10px; position: relative; z-index: 10;">
            <button class="btn btn-cart" onclick="addToCart()" style="flex: 1; min-height: 45px; transition: 0.3s; cursor: pointer !important;">
                <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
            <button class="btn btn-order" onclick="orderNow()" style="flex: 1; min-height: 45px; cursor: pointer !important;">
                <i class="fas fa-bolt"></i> Order Now
            </button>
        </div>
    </div>
    
    <div class="offer-card" style="clear: both; margin-top: 20px;">
        <div>
            <h2>Exclusive Offer</h2>
            <p>Order now and get special discounts on accessories</p>
        </div>
        <button class="btn-shop" onclick="shopNow()">Shop Now</button>
    </div>
    `;

    // 2. إعادة تفعيل خاصية الزوم (عشان تشتغل بعد رسم الـ HTML الجديد)
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

    // 3. تحديث الاستايلات العامة
    updateButtonStyles();
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
function addToCart() {
    console.log('Add to Cart clicked');
    
    if (!isUserLoggedIn()) {
        showLoginRequired('add items to cart');
        return false;
    }
    
    const productId = new URLSearchParams(window.location.search).get('id') || 1;
    const quantity = parseInt(document.getElementById('qty')?.value) || 1;
    const productName = currentProductData?.name || document.querySelector('.product-details h1')?.textContent || 'Product';
    
    // حساب السعر (سواء خصم أو عادي)
    const currentDate = new Date();
    const hasActiveDiscount = currentProductData?.discountPrice && 
                            currentProductData?.discountStartDate && 
                            currentProductData?.discountEndDate &&
                            new Date(currentProductData.discountStartDate) <= currentDate &&
                            new Date(currentProductData.discountEndDate) >= currentDate;
    const productPrice = hasActiveDiscount ? parseFloat(currentProductData.discountPrice) : parseFloat(currentProductData?.price || '0');
    const productImage = currentProductData?.mainImageUrl ? fixImg(currentProductData.mainImageUrl) : (document.getElementById('big-img')?.src || '');
    
    // إضافة للمقرض (LocalStorage)
    let cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
    const existingProductIndex = cart.findIndex(item => item.id == productId);
    
    if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += quantity;
        cart[existingProductIndex].totalPrice = cart[existingProductIndex].quantity * cart[existingProductIndex].price;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: quantity,
            img: productImage,
            totalPrice: productPrice * quantity,
            addedDate: new Date().toISOString()
        });
    }
    
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
    updateCartCount();
    
    // --- الجزء اللي يهمك: تغيير شكل الزرار ---
    const addToCartBtn = document.querySelector('.btn-cart');
    if (addToCartBtn) {
        const originalText = addToCartBtn.innerHTML; // حفظ النص القديم (Add to Cart)
        
        // تحويله للأخضر وكلمة Added
        addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Added';
        addToCartBtn.style.setProperty('background-color', '#28a745', 'important');
        addToCartBtn.style.setProperty('border-color', '#28a745', 'important');
        addToCartBtn.style.color = '#ffffff';
        addToCartBtn.disabled = true;
        
        // العودة للوضع الطبيعي بعد 2 ثانية
        setTimeout(() => {
            addToCartBtn.innerHTML = originalText;
            addToCartBtn.style.backgroundColor = ""; // هيرجع للون البرتقالي من الـ CSS
            addToCartBtn.style.borderColor = "";
            addToCartBtn.disabled = false;
        }, 2000);
    }
    
    return false;
}
// Add related product to cart
function addRelatedToCart(productId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    if (!isUserLoggedIn()) {
        showLoginRequired('add items to cart');
        return false;
    }
    
    const btn = event.currentTarget || event.target;
    const originalText = btn.innerHTML;

    const card = btn.closest('.card') || btn.closest('.product-card');
    const productName = card ? card.querySelector('.title, h3, .product-name')?.textContent : 'Product ' + productId;
    const productPrice = card ? parseFloat(card.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '')) : 0;
    const productImage = card ? card.querySelector('img')?.src : '';
    
    let cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
    const existingProductIndex = cart.findIndex(item => item.id == productId);
    
    if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: 1,
            img: productImage,
            totalPrice: productPrice
        });
    }
    
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
    updateCartCount();

    btn.innerHTML = '✓ Added';
    btn.style.backgroundColor = '#28a745';
    btn.style.borderColor = '#28a745';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.disabled = false;
    }, 2000);

    return false;
}

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
    const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    
    const cartIcon = document.querySelector('.icon-item .fa-shopping-cart')?.closest('.icon-item');
    if (cartIcon) {
        const existingBadge = cartIcon.querySelector('.cart-badge');
        if (existingBadge) existingBadge.remove();
        
        if (totalItems > 0) {
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.textContent = totalItems > 99 ? '99+' : totalItems;
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: 9px;
                background: #FF6B00;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 17px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            
            cartIcon.style.position = 'relative';
            cartIcon.appendChild(badge);
        }
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

// 1. دالة فتح ملخص الطلب - تعتمد السعر بعد الخصم كلياً
async function openSummary() {
    if (!isUserLoggedIn()) {
        showLoginRequired('place an order');
        return;
    }

    const qty = parseInt(document.getElementById('qty').value) || 1;
    
    // تحديد السعر الصحيح (بعد الخصم)
    // بنشوف لو فيه discountPrice وقيمته أكبر من 0، نستخدمه.. وإلا نستخدم السعر العادي
    const unitPrice = (currentProductData.discountPrice && currentProductData.discountPrice > 0) 
                      ? parseFloat(currentProductData.discountPrice) 
                      : parseFloat(currentProductData.price);
    
    const subtotal = unitPrice * qty;

    document.getElementById('summaryBox').innerHTML = `
        <div class="order-summary-container" style="text-align: right; direction: rtl; font-family: sans-serif;">
            
            <div id="admin-area" style="display:none; background:#fff3cd; padding:10px; border:1px solid #ffeeba; border-radius:8px; margin-bottom:15px;">
                <small style="font-weight:bold;">تعديل سعر الشحن (أدمن فقط):</small>
                <div style="display:flex; gap:5px; margin-top:5px;">
                    <input type="number" id="newShippingPrice" placeholder="السعر الجديد" style="flex:1; padding:8px; border:1px solid #ddd;">
                    <button onclick="saveNewShippingPrice()" style="background:#28a745; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer;">تحديث</button>
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <label>Name:</label>
                <input type="text" id="custName" placeholder="Full Name" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div>
                    <label>Phone Number:</label>
                    <input type="tel" id="custPhone" placeholder="01xxxxxxxxx" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div>
                    <label>WhatsApp:</label>
                    <input type="tel" id="custWhatsapp" placeholder="01xxxxxxxxx" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <label>Governorate:</label>
                <select id="governorate" onchange="updateShipping()" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    <option value="0" data-price="0">Select Governorate...</option>
                </select>
            </div>

            <div style="margin-bottom: 10px;">
                <label>Address Details:</label>
                <input type="text" id="custAddress" placeholder="Street / Building / Floor" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>

            <div style="margin-bottom: 10px;">
                <label>Notes (Optional):</label>
                <textarea id="custNotes" rows="2" placeholder="Any special instructions..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; resize:none;"></textarea>
            </div>

            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; margin-top:10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom:5px;">
                    <span>Product (Unit Price):</span>
                    <span style="font-weight:bold;">${unitPrice.toLocaleString()} EGP</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom:5px;">
                    <span>Shipping Fee:</span>
                    <span id="shippingPrice" style="color: #28a745; font-weight:bold;">0.00 EGP</span>
                </div>
                <hr>
                <div style="display: flex; justify-content: space-between; font-size: 1.3rem; font-weight: bold;">
                    <span>Total:</span>
                    <span id="finalTotal" style="color: #FF6B00;">${subtotal.toLocaleString()} EGP</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalOverlay').style.display = 'flex';
    await loadGovernorates();
    checkAdminStatus();
}

// 2. تحديث الحسابات عند تغيير المحافظة (التأكد من استخدام السعر بعد الخصم)
function updateShipping() {
    const select = document.getElementById('governorate');
    const shippingFee = parseFloat(select.options[select.selectedIndex].dataset.price) || 0;
    const qty = parseInt(document.getElementById('qty').value) || 1;
    
    // السعر بعد الخصم
    const unitPrice = (currentProductData.discountPrice && currentProductData.discountPrice > 0) 
                      ? parseFloat(currentProductData.discountPrice) 
                      : parseFloat(currentProductData.price);
    
    const productTotal = unitPrice * qty;

    document.getElementById('shippingPrice').innerText = `${shippingFee.toFixed(2)} EGP`;
    document.getElementById('finalTotal').innerText = `${(productTotal + shippingFee).toLocaleString()} EGP`;
}

// 3. إرسال الطلب (الملاحظات اختيارية والسعر هو السعر بعد الخصم)
async function sendToWhatsApp() {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const whatsapp = document.getElementById('custWhatsapp').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const notes = document.getElementById('custNotes').value.trim();
    const govSelect = document.getElementById('governorate');
    const govName = govSelect.options[govSelect.selectedIndex].text;
    const shippingFee = parseFloat(govSelect.options[govSelect.selectedIndex].dataset.price) || 0;
    const qty = document.getElementById('qty').value || 1;

    // التحقق من الحقول الإجبارية (الملاحظات ليست منها)
    if (!name || !phone || !whatsapp || !address || govSelect.value == "0") {
        Swal.fire({ icon: 'warning', title: 'بيانات ناقصة', text: 'يرجى إكمال الاسم، الهاتف، واتساب، والعنوان' });
        return;
    }

    const unitPrice = (currentProductData.discountPrice && currentProductData.discountPrice > 0) 
                      ? parseFloat(currentProductData.discountPrice) 
                      : parseFloat(currentProductData.price);
    
    const total = (unitPrice * qty) + shippingFee;

    const message = `*Order Summary - El Handasia*%0A%0A` +
                    `*Product:* ${currentProductData.name}%0A` +
                    `*Qty:* ${qty}%0A` +
                    `*Unit Price:* ${unitPrice.toLocaleString()} EGP%0A` +
                    `--------------------------%0A` +
                    `*Customer Info:*%0A` +
                    `*Name:* ${name}%0A` +
                    `*Phone:* ${phone}%0A` +
                    `*WhatsApp:* ${whatsapp}%0A` +
                    `*Gov:* ${govName}%0A` +
                    `*Address:* ${address}%0A` +
                    `*Notes:* ${notes ? notes : 'N/A'}%0A` +
                    `--------------------------%0A` +
                    `*Shipping:* ${shippingFee} EGP%0A` +
                    `*Total Amount:* ${total.toLocaleString()} EGP`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    closeModal();
}

async function openSummary() {
    if (!isUserLoggedIn()) {
        showLoginRequired('place an order');
        return;
    }

    const qty = parseInt(document.getElementById('qty').value) || 1;
    
    // حساب السعر الجديد (بعد الخصم)
    const unitPrice = (currentProductData.discountPrice && currentProductData.discountPrice > 0) 
                      ? parseFloat(currentProductData.discountPrice) 
                      : parseFloat(currentProductData.price);
    
    const subtotal = unitPrice * qty;

    document.getElementById('summaryBox').innerHTML = `
        <div style="direction: ltr; text-align: left; font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="text-align: center; margin-bottom: 20px;">Order Summary</h2>

            <div id="admin-area" style="display:none; background:#fff3cd; padding:10px; border-radius:8px; margin-bottom:15px;">
                <label style="font-size: 12px; font-weight: bold;">Admin: Edit Shipping Fee</label>
                <div style="display:flex; gap:5px;">
                    <input type="number" id="newShippingPrice" placeholder="New Fee" style="flex:1; padding:5px; border:1px solid #ccc;">
                    <button onclick="saveNewShippingPrice()" style="background:#28a745; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">Update</button>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Your Name:</label>
                <input type="text" id="custName" placeholder="Full Name" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>

            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                <div style="flex: 1;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Phone Number:</label>
                    <input type="tel" id="custPhone" placeholder="01xxxxxxxxx" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                </div>
                <div style="flex: 1;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">WhatsApp:</label>
                    <input type="tel" id="custWhatsapp" placeholder="01xxxxxxxxx" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Governorate:</label>
                <select id="governorate" onchange="updateShipping()" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: white;">
                    <option value="0" data-price="0">Select Governorate...</option>
                </select>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Address Details:</label>
                <input type="text" id="custAddress" placeholder="Street / Building / Floor" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Notes (Optional):</label>
                <textarea id="custNotes" rows="2" placeholder="Any special instructions..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: none;"></textarea>
            </div>

            <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Product (Unit Price):</span>
                    <span style="font-weight: bold;">${unitPrice.toLocaleString()} EGP</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Shipping Fee:</span>
                    <span id="shippingPrice" style="color: #28a745; font-weight: bold;">0.00 EGP</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.4rem; font-weight: bold; border-top: 2px solid #eee; pt: 10px; margin-top: 10px;">
                    <span>Total:</span>
                    <span id="finalTotal" style="color: #FF6B00;">${subtotal.toLocaleString()} EGP</span>
                </div>
            </div>

            <button onclick="sendToWhatsApp()" style="width: 100%; background: #25D366; color: white; border: none; padding: 15px; border-radius: 8px; font-size: 1.1rem; font-weight: bold; margin-top: 20px; cursor: pointer;">
                Send Order via WhatsApp
            </button>
            
            <p style="text-align: center; font-size: 12px; color: #888; margin-top: 10px;">
                Our team will contact you within 24 hours to confirm your order.
            </p>
        </div>
    `;

    document.getElementById('modalOverlay').style.display = 'flex';
    await loadGovernorates();
    checkAdminStatus();
}

// تحديث الشحن والسعر النهائي
function updateShipping() {
    const select = document.getElementById('governorate');
    const shippingFee = parseFloat(select.options[select.selectedIndex].dataset.price) || 0;
    const qty = parseInt(document.getElementById('qty').value) || 1;
    
    // استخدام السعر بعد الخصم دوماً في التحديث
    const unitPrice = (currentProductData.discountPrice && currentProductData.discountPrice > 0) 
                      ? parseFloat(currentProductData.discountPrice) 
                      : parseFloat(currentProductData.price);
    
    const productTotal = unitPrice * qty;

    document.getElementById('shippingPrice').innerText = `${shippingFee.toFixed(2)} EGP`;
    document.getElementById('finalTotal').innerText = `${(productTotal + shippingFee).toLocaleString()} EGP`;
}

async function openSummary() {
    if (!isUserLoggedIn()) {
        showLoginRequired('place an order');
        return;
    }

    const qty = parseInt(document.getElementById('qty').value) || 1;
    
    const unitPrice = (currentProductData.discountPrice && currentProductData.discountPrice > 0) 
                      ? parseFloat(currentProductData.discountPrice) 
                      : parseFloat(currentProductData.price);
    
    const subtotal = unitPrice * qty;

    const summaryBox = document.getElementById('summaryBox');
    summaryBox.style.maxHeight = "80vh"; 
    summaryBox.style.overflowY = "auto"; 
    summaryBox.style.paddingRight = "10px"; 

    summaryBox.innerHTML = `
        <div style="direction: ltr; text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding-bottom: 20px;">
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">Your Name:</label>
                <input type="text" id="custName" placeholder="Full Name" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">Email Address:</label>
                <input type="email" id="custEmail" placeholder="example@mail.com" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">Phone Number:</label>
                <input type="tel" id="custPhone" placeholder="01xxxxxxxxx" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">WhatsApp Number:</label>
                <input type="tel" id="custWhatsapp" placeholder="01xxxxxxxxx" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">Governorate:</label>
                <select id="governorate" onchange="updateShipping()" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; background: #fff;">
                    <option value="0" data-price="0">Select Governorate...</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">Address Details:</label>
                <input type="text" id="custAddress" placeholder="Street / Building / Floor" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 25px;">
                <label style="display: block; font-weight: bold; margin-bottom: 8px;">Notes (Optional):</label>
                <textarea id="custNotes" rows="2" placeholder="Any special instructions..." style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; resize: none;"></textarea>
            </div>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; border: 1px solid #eee; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #666;">Unit Price:</span>
                    <span style="font-weight: bold;">${unitPrice.toLocaleString()} EGP</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #666;">Shipping Fee:</span>
                    <span id="shippingPrice" style="color: #28a745; font-weight: bold;">0.00 EGP</span>
                </div>
                <hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 800;">
                    <span>Total:</span>
                    <span id="finalTotal" style="color: #FF6B00;">${subtotal.toLocaleString()} EGP</span>
                </div>
            </div>
            <button id="submitBtn" onclick="sendToWhatsApp()" style="width: 100%; background: #25D366; color: white; border: none; padding: 16px; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <i class="fab fa-whatsapp"></i> Send Order via WhatsApp
            </button>
        </div>
    `;

    document.getElementById('modalOverlay').style.display = 'flex';
    await loadGovernorates();
}
// دالة تحميل المحافظات
async function loadGovernorates() {
    try {
        const response = await fetch(`${API_URL}/api/shipping-governorates`);
        const govs = await response.json();
        const select = document.getElementById('governorate');
        select.innerHTML = '<option value="0" data-price="0">Select Governorate...</option>';
        govs.forEach(gov => {
            const option = document.createElement('option');
            option.value = gov.id;
            option.text = gov.name;
            option.dataset.price = gov.shippingFee;
            select.appendChild(option);
        });
    } catch (e) { console.error(e); }
}

function checkAdminStatus() {
    if (localStorage.getItem('userRole') === 'Admin') {
        document.getElementById('admin-area').style.display = 'block';
    }
}
// Close modal
function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

// Send to WhatsApp
async function sendToWhatsApp() {
    const name = document.getElementById('custName')?.value.trim(); 
    const email = document.getElementById('custEmail')?.value.trim();
    const phone = document.getElementById('custPhone')?.value.trim();
    const whatsapp = document.getElementById('custWhatsapp')?.value.trim();
    const address = document.getElementById('custAddress')?.value.trim();
    const userNotes = document.getElementById('custNotes')?.value.trim() || "لا يوجد ملاحظات";
    
    const govSelect = document.getElementById('governorate');
    const govId = parseInt(govSelect?.value) || 0; 
    const govName = govSelect && govSelect.selectedIndex > 0 ? govSelect.options[govSelect.selectedIndex].text : "غير محدد";

    const qty = parseInt(document.getElementById('qty')?.value) || 1;
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');

    const unitPrice = (currentProductData.discountPrice && currentProductData.discountPrice > 0) 
                      ? parseFloat(currentProductData.discountPrice) 
                      : parseFloat(currentProductData.price);
    
    const productsSubtotal = unitPrice * qty;
    const shippingFeeText = document.getElementById('shippingPrice')?.innerText || "0";
    const shippingFee = parseFloat(shippingFeeText.replace(/[^0-9.]/g, '')) || 0;
    const finalTotal = productsSubtotal + shippingFee;

    if (!name || !phone || !email || govId === 0) {
        Swal.fire({ icon: 'warning', title: 'بيانات ناقصة', text: 'يرجى إدخال الاسم، الإيميل، الهاتف، والمحافظة' });
        return;
    }

    const orderData = {
        customerName: name, 
        customerEmail: email, 
        customerPhone: phone,
        governorateId: govId,
        whatsappNumber: whatsapp || phone,
        address: address,
        // ✅ التعديل هنا: بنحط الاسم في أول الـ Notes عشان الأدمن يشوفه فوراً في الداش بورد
        // حتى لو السيرفر عرض اسم التوكن، الأدمن هيلاقي الاسم الصحيح مكتوب هنا
        notes: `الاسم المطلوب: ${name} | العنوان: ${address} | ملاحظات: ${userNotes}`, 
        items: [
            {
                productId: Number(currentProductData.id),
                quantity: Number(qty)
            }
        ]
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

        if (response.ok) {
            // رسالة الواتساب بالاسم اللي أنت كتبته
            const message = `السلام عليكم، أريد طلب المنتج التالي:%0A%0A` +
                            `📦 *المنتج:* ${currentProductData.name}%0A` +
                            `💰 *سعر المنتج:* ${unitPrice.toLocaleString()} EGP%0A` +
                            `🔢 *الكمية:* ${qty}%0A` +
                            `🚚 *مصاريف الشحن:* ${shippingFee.toLocaleString()} EGP%0A%0A` +
                            `--------------------------%0A` +
                            `👤 *بيانات العميل:*%0A` +
                            `*الاسم:* ${name}%0A` + // الاسم اللي أنت كتبته يدوي
                            `*الهاتف:* ${phone}%0A` +
                            `*المحافظة:* ${govName}%0A` +
                            `*العنوان:* ${address}%0A%0A` +
                            `💵 *الإجمالي النهائي:* ${finalTotal.toLocaleString()} EGP`;

            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');

            Swal.fire({
                icon: 'success',
                title: 'تم استلام طلبك',
                text: `تم تسجيل الطلب باسم: ${name}`,
                timer: 2500,
                showConfirmButton: false
            }).then(() => closeModal());
        } else {
            throw new Error("API Reject");
        }
    } catch (error) {
        console.error("Dashboard sync error:", error);
        Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل التسميع في الداش بورد' });
    }
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
    
    // تحميل بيانات المنتج أولاً
    try {
        await loadProduct(); 
    } catch (error) {
        console.error('Error loading product:', error);
    }
    
    // الفحص بتاع الإدمن لازم يجي هنا بعد ما الـ HTML يكون ريدي
    checkAdminStatus(); 

    updateCartCount();
    updateButtonStyles();
    
    setTimeout(() => {
        setupSearch();
    }, 1000);
});

// دالة مخصصة للتحقق من الإدمن في هذه الصفحة
function checkAdminStatus() {
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    const adminLink = document.getElementById('admin-dash-link');
    
    if (!adminLink) return;

    if (!token) {
        adminLink.style.setProperty('display', 'none', 'important');
        return;
    }

    try {
        const payload = JSON.parse(window.atob(token.split('.')[1]));
        const userRole = (payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role || "").toString().toLowerCase();

        if (userRole === "admin") {
            adminLink.style.setProperty('display', 'flex', 'important');
        } else {
            adminLink.style.setProperty('display', 'none', 'important');
        }
    } catch (e) {
        adminLink.style.display = 'none';
    }
}
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