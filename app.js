// --- إعدادات مطبخ زاد (البصرة) ---
const KITCHEN_LAT = 30.5085; // خط العرض للمطبخ
const KITCHEN_LNG = 47.7803; // خط الطول للمطبخ

// الوجبات الأساسية للظهور المباشر لجميع الزبائن
const defaultMenu = [
    {
        name: "ريزو كرانشي",
        price: 6000,
        category: "ريزو",
        image: "https://files.catbox.moe/k4btrv.jpeg",
        desc: "قطع دجاج كرانشي مقرمشة مع أرز الريزو المميز والصوص الخاص"
    }
];

// دمج الوجبات الأساسية مع الوجبات المضافة محلياً
let localMenu = JSON.parse(localStorage.getItem('zad_menu')) || [];
let menuData = [...defaultMenu, ...localMenu];

let cart = [];
let deliveryFee = 0;
let userLocationLink = "";

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    renderMenu('الكل');
});

// عرض الأقسام
function renderCategories() {
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return;
    
    const categories = ['الكل', ...new Set(menuData.map(item => item.category))];
    
    categoriesContainer.innerHTML = categories.map(cat => 
        `<button class="cat-btn ${cat === 'الكل' ? 'active' : ''}" onclick="filterCategory('${cat}', this)">${cat}</button>`
    ).join('');
}

// تصفية الأقسام
function filterCategory(category, btnElement) {
    if(btnElement) {
        document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }
    renderMenu(category);
}

// عرض الوجبات
function renderMenu(category) {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    const filteredData = category === 'الكل' ? menuData : menuData.filter(item => item.category === category);

    if (filteredData.length === 0) {
        menuContainer.innerHTML = `<p style="text-align:center; padding: 20px; color:#aaa;">لا توجد وجبات في هذا القسم حالياً.</p>`;
        return;
    }

    menuContainer.innerHTML = filteredData.map(item => `
        <div class="meal-card">
            <img src="${item.image}" alt="${item.name}" class="meal-img" onerror="this.src='https://via.placeholder.com/150'">
            <div class="meal-details">
                <h3>${item.name}</h3>
                <p class="meal-desc">${item.desc || ''}</p>
                <div class="meal-bottom">
                    <span class="meal-price">${Number(item.price).toLocaleString()} د.ع</span>
                    <button class="add-btn" onclick="addToCart('${item.name}', ${item.price})">+ إضافة</button>
                </div>
            </div>
        </div>
    `).join('');
}

// إضافة للسلة
function addToCart(name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ name, price, qty: 1 });
    }
    updateCartUI();
}

// تحديث الواجهة السفلية للسلة
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

    if (cartCount) cartCount.innerText = totalItems;
    if (cartTotalPrice) cartTotalPrice.innerText = (subtotal + deliveryFee).toLocaleString();
}

// فتح نافذة السلة
function openCartModal() {
    if (cart.length === 0) {
        alert("السلة فارغة! اختر بعض الوجبات أولاً.");
        return;
    }
    document.getElementById('cart-modal').style.display = 'flex';
    renderCartModal();
}

function closeCartModal() {
    document.getElementById('cart-modal').style.display = 'none';
}

// عرض مكونات السلة والحساب
function renderCartModal() {
    const cartItemsList = document.getElementById('cart-items');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (cartItemsList) {
        cartItemsList.innerHTML = cart.map((item, index) => `
            <div class="cart-item-row">
                <span>${item.name}</span>
                <div class="qty-controls">
                    <button onclick="changeQty(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${index}, 1)">+</button>
                </div>
                <span>${(item.price * item.qty).toLocaleString()} د.ع</span>
            </div>
        `).join('');
    }

    document.getElementById('subtotal-price').innerText = subtotal.toLocaleString();
    document.getElementById('delivery-price').innerText = deliveryFee.toLocaleString();
    document.getElementById('final-total-price').innerText = (subtotal + deliveryFee).toLocaleString();
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    if (cart.length === 0) {
        closeCartModal();
    }
    updateCartUI();
    renderCartModal();
}

// --- دالة حساب المسافة بالـ GPS والتوصيل ---
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // نصف قطر الأرض بالكيلومترات
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

function getCurrentLocation() {
    const status = document.getElementById('location-status');

    if (!navigator.geolocation) {
        status.innerText = "متصفحك لا يدعم خدمة الـ GPS.";
        return;
    }

    status.innerText = "⏳ جاري تحديد موقعك الجغرافي...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            userLocationLink = `https://www.google.com/maps?q=${userLat},${userLng}`;

            const distance = calculateDistance(KITCHEN_LAT, KITCHEN_LNG, userLat, userLng);

            // احتساب سعر التوصيل
            if (distance <= 7) {
                deliveryFee = 1000;
            } else if (distance <= 10) {
                deliveryFee = 2000;
            } else {
                deliveryFee = 3000;
            }

            status.innerHTML = `✅ تم تحديد الموقع! (المسافة: ${distance.toFixed(1)} كم)`;
            
            updateCartUI();
            renderCartModal();
        },
        (error) => {
            status.innerText = "❌ تعذر الحصول على الموقع. يرجى تفعيل الـ GPS بالهاتف.";
        }
    );
}

// إرسال الطلب عبر الواتساب
function sendOrderToWhatsApp() {
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const notes = document.getElementById('cust-notes').value.trim();

    if (!name || !phone) {
        alert("يرجى كتابة الاسم ورقم الهاتف لإكمال الطلب.");
        return;
    }

    if (deliveryFee === 0 && !userLocationLink) {
        if (!confirm("لم تقم بتحديد موقعك عبر الـ GPS لتحديد سعر التوصيل، هل تريد الاستمرار؟")) {
            return;
        }
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const finalTotal = subtotal + deliveryFee;

    let message = `🍔 *طلب جديد من مطبخ زاد* 🍔\n\n`;
    message += `👤 *الاسم:* ${name}\n`;
    message += `📞 *الهاتف:* ${phone}\n\n`;
    message += `📝 *تفاصيل الطلب:*\n`;

    cart.forEach(item => {
        message += `• ${item.name} (${item.qty}) = ${(item.price * item.qty).toLocaleString()} د.ع\n`;
    });

    message += `\n💰 *مجموع الوجبات:* ${subtotal.toLocaleString()} د.ع\n`;
    message += `🛵 *أجور التوصيل:* ${deliveryFee.toLocaleString()} د.ع\n`;
    message += `💵 *المجموع الكلي:* ${finalTotal.toLocaleString()} د.ع\n\n`;

    if (userLocationLink) {
        message += `📍 *موقع التوصيل على الخريطة:* \n${userLocationLink}\n\n`;
    }

    if (notes) {
        message += `📌 *ملاحظات العنوان:* ${notes}\n`;
    }

    // رقمك المخصص لاستلام الطلبات
    const whatsappPhone = "9647838021664"; 

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappPhone}?text=${encodedMessage}`, '_blank');
}
