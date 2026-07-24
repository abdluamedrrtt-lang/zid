const RESTAURANT_PHONE = "9647838021664"; // رقم الواتساب الخاص بالمطعم

// قاعدة البيانات المبدئية
const menuData = [
    {
        id: 1,
        name: "برغر لحم دبل تشيز",
        category: "برغر",
        price: 7500,
        description: "شريحتين لحم بلدي مع الجبن الصافي والصوص الخاص.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
        isAvailable: true,
        sizes: [{ name: "فردي", price: 0 }, { name: "عائلي دبل", price: 3000 }],
        addons: [{ name: "جبنة إضافية", price: 1000 }, { name: "صوص حار", price: 500 }],
        removals: ["بدون بصل", "بدون مخلل", "بدون خردل"]
    },
    {
        id: 2,
        name: "برغر دجاج مقرمش",
        category: "برغر",
        price: 6000,
        description: "صدر دجاج مقرمش مع خس وصوص المايونيز.",
        image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=300",
        isAvailable: true,
        sizes: [],
        addons: [{ name: "جبنة شيدر", price: 1000 }],
        removals: ["بدون مايونيز", "بدون خس"]
    },
    {
        id: 3,
        name: "بطاطا بالجبن (تشيز فرايز)",
        category: "مقبلات",
        price: 3500,
        description: "بطاطس مقرمشة مغطاة بصوص الشيدر الذائب.",
        image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300",
        isAvailable: false, // نفدت الكمية
        sizes: [],
        addons: [],
        removals: []
    }
];

let cart = [];
let currentCustomizingItem = null;
let gpsLocationUrl = "";
let deliveryFee = 0;

document.addEventListener("DOMContentLoaded", () => {
    renderCategories();
    renderMenu(menuData);
});

// 1. الأقسام والبحث
function renderCategories() {
    const categories = ["الكل", ...new Set(menuData.map(i => i.category))];
    document.getElementById("categories-container").innerHTML = categories.map(cat => `
        <button onclick="filterCategory('${cat}')" class="px-4 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap bg-gray-50 text-gray-700 hover:bg-red-600 hover:text-white transition">
            ${cat}
        </button>
    `).join('');
}

function filterCategory(cat) {
    if (cat === "الكل") renderMenu(menuData);
    else renderMenu(menuData.filter(i => i.category === cat));
}

function handleSearch() {
    const query = document.getElementById("search-input").value.toLowerCase();
    renderMenu(menuData.filter(i => i.name.toLowerCase().includes(query)));
}

// 2. عرض المنتجات
function renderMenu(items) {
    document.getElementById("menu-items").innerHTML = items.map(item => `
        <div class="bg-white p-3 rounded-xl shadow-sm border flex gap-3 items-center ${!item.isAvailable ? 'opacity-50' : ''}">
            <img src="${item.image}" class="w-20 h-20 rounded-lg object-cover">
            <div class="flex-1">
                <div class="flex justify-between">
                    <h3 class="font-bold text-sm">${item.name}</h3>
                    ${!item.isAvailable ? '<span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">نفدت الكمية</span>' : ''}
                </div>
                <p class="text-xs text-gray-500 my-1 line-clamp-1">${item.description}</p>
                <div class="flex justify-between items-center mt-2">
                    <span class="font-black text-red-600 text-sm">${item.price.toLocaleString()} د.ع</span>
                    ${item.isAvailable ? `
                        <button onclick="openCustomizeModal(${item.id})" class="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white">
                            + إضافة
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// 3. نافذة التخصيص
function openCustomizeModal(id) {
    currentCustomizingItem = JSON.parse(JSON.stringify(menuData.find(i => i.id === id)));
    document.getElementById("cust-item-title").innerText = currentCustomizingItem.name;
    
    // الأحجام
    const sizesContainer = document.getElementById("sizes-container");
    if(currentCustomizingItem.sizes.length > 0) {
        document.getElementById("sizes-section").classList.remove("hidden");
        sizesContainer.innerHTML = currentCustomizingItem.sizes.map((s, idx) => `
            <label class="flex justify-between border p-2 rounded-lg text-xs cursor-pointer">
                <input type="radio" name="size-opt" value="${s.price}" ${idx===0?'checked':''} onchange="calculateCustomPrice()">
                <span>${s.name}</span>
                <span>+${s.price} د.ع</span>
            </label>
        `).join('');
    } else {
        document.getElementById("sizes-section").classList.add("hidden");
    }

    // الإضافات
    const addonsContainer = document.getElementById("addons-container");
    if(currentCustomizingItem.addons.length > 0) {
        document.getElementById("addons-section").classList.remove("hidden");
        addonsContainer.innerHTML = currentCustomizingItem.addons.map(a => `
            <label class="flex justify-between border p-2 rounded-lg text-xs cursor-pointer">
                <input type="checkbox" name="addon-opt" value="${a.price}" data-name="${a.name}" onchange="calculateCustomPrice()">
                <span>${a.name}</span>
                <span>+${a.price} د.ع</span>
            </label>
        `).join('');
    } else {
        document.getElementById("addons-section").classList.add("hidden");
    }

    // الحذف
    const removalsContainer = document.getElementById("removals-container");
    if(currentCustomizingItem.removals.length > 0) {
        document.getElementById("removals-section").classList.remove("hidden");
        removalsContainer.innerHTML = currentCustomizingItem.removals.map(r => `
            <label class="border p-2 rounded-lg text-xs flex items-center gap-1 cursor-pointer">
                <input type="checkbox" name="removal-opt" value="${r}">
                <span>${r}</span>
            </label>
        `).join('');
    } else {
        document.getElementById("removals-section").classList.add("hidden");
    }

    document.getElementById("item-note").value = "";
    calculateCustomPrice();
    document.getElementById("customize-modal").classList.remove("hidden");
}

function calculateCustomPrice() {
    let total = currentCustomizingItem.price;
    const selectedSize = document.querySelector('input[name="size-opt"]:checked');
    if(selectedSize) total += parseFloat(selectedSize.value);

    document.querySelectorAll('input[name="addon-opt"]:checked').forEach(cb => {
        total += parseFloat(cb.value);
    });

    document.getElementById("custom-price").innerText = total.toLocaleString();
    return total;
}

function closeCustomizeModal() {
    document.getElementById("customize-modal").classList.add("hidden");
}

function confirmAddToCart() {
    const finalPrice = calculateCustomPrice();
    const selectedSizeObj = document.querySelector('input[name="size-opt"]:checked');
    const sizeName = selectedSizeObj ? selectedSizeObj.closest('label').querySelector('span').innerText : '';
    
    const selectedAddons = [];
    document.querySelectorAll('input[name="addon-opt"]:checked').forEach(cb => {
        selectedAddons.push(cb.getAttribute('data-name'));
    });

    const selectedRemovals = [];
    document.querySelectorAll('input[name="removal-opt"]:checked').forEach(cb => {
        selectedRemovals.push(cb.value);
    });

    cart.push({
        cartItemId: Date.now(),
        name: currentCustomizingItem.name,
        unitPrice: finalPrice,
        qty: 1,
        size: sizeName,
        addons: selectedAddons,
        removals: selectedRemovals,
        note: document.getElementById("item-note").value
    });

    closeCustomizeModal();
    updateCartUI();
}

// 4. السلة والدفع
function updateCartUI() {
    const totalCount = cart.reduce((acc, i) => acc + i.qty, 0);
    const subtotal = cart.reduce((acc, i) => acc + (i.unitPrice * i.qty), 0);

    document.getElementById("cart-count").innerText = totalCount;
    document.getElementById("cart-total").innerText = (subtotal + deliveryFee).toLocaleString();
    document.getElementById("subtotal-price").innerText = subtotal.toLocaleString();

    const cartList = document.getElementById("cart-items-list");
    if(cart.length === 0) {
        cartList.innerHTML = `<p class="text-center text-gray-400 py-4 text-xs">السلة فارغة</p>`;
    } else {
        cartList.innerHTML = cart.map(item => `
            <div class="py-2">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-xs">${item.name} ${item.size ? `(${item.size})`:''}</h4>
                        <div class="text-[10px] text-gray-500">
                            ${item.addons.length ? `إضافات: ${item.addons.join(', ')}<br>` : ''}
                            ${item.removals.length ? `بدون: ${item.removals.join(', ')}<br>` : ''}
                            ${item.note ? `ملاحظة: ${item.note}` : ''}
                        </div>
                        <span class="font-bold text-xs text-red-600">${(item.unitPrice * item.qty).toLocaleString()} د.ع</span>
                    </div>
                    <div class="flex items-center gap-2 border rounded-lg bg-gray-50 px-2 py-1">
                        <button onclick="changeQty(${item.cartItemId}, -1)" class="text-red-600 font-bold">-</button>
                        <span class="text-xs font-bold">${item.qty}</span>
                        <button onclick="changeQty(${item.cartItemId}, 1)" class="text-green-600 font-bold">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function changeQty(cartItemId, delta) {
    const idx = cart.findIndex(i => i.cartItemId === cartItemId);
    if(idx > -1) {
        cart[idx].qty += delta;
        if(cart[idx].qty <= 0) cart.splice(idx, 1);
    }
    updateCartUI();
}

function toggleCartModal(show) {
    document.getElementById("cart-modal").classList.toggle("hidden", !show);
}

function updateDeliveryFee() {
    const select = document.getElementById("cust-region");
    const option = select.options[select.selectedIndex];
    deliveryFee = option.dataset.fee ? parseFloat(option.dataset.fee) : 0;
    document.getElementById("delivery-price").innerText = deliveryFee ? deliveryFee.toLocaleString() + " د.ع" : "حسب المنطقة";
    updateCartUI();
}

function getGPSLocation() {
    const status = document.getElementById("gps-status");
    if (!navigator.geolocation) {
        status.innerText = "الموقع غير مدعوم في متصفحك";
        return;
    }
    status.innerText = "جاري تحديد الموقع...";
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            gpsLocationUrl = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
            status.innerText = "تم إرفاق الموقع بنجاح ✅";
        },
        () => { status.innerText = "تعذر الحصول على الموقع تلقائياً"; }
    );
}

// 5. إرسال الطلب وإرساله إلى لوحة التحكم
function sendOrderToWhatsApp(e) {
    e.preventDefault();
    if(cart.length === 0) return alert("السلة فارغة!");

    const name = document.getElementById("cust-name").value;
    const phone = document.getElementById("cust-phone").value;
    const region = document.getElementById("cust-region").value;
    const address = document.getElementById("cust-address").value;
    const payment = document.querySelector('input[name="payment"]:checked').value;
    const subtotal = cart.reduce((acc, i) => acc + (i.unitPrice * i.qty), 0);
    const grandTotal = subtotal + deliveryFee;

    // حفظ الطلب محلیاً للوحة المطبخ
    const newOrder = {
        id: Math.floor(1000 + Math.random() * 9000),
        name, phone, address, payment,
        status: "قيد الانتظار ⏳",
        total: grandTotal.toLocaleString(),
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: (i.unitPrice * i.qty).toLocaleString() }))
    };

    let kitchenOrders = JSON.parse(localStorage.getItem('kitchen_orders') || '[]');
    kitchenOrders.unshift(newOrder);
    localStorage.setItem('kitchen_orders', JSON.stringify(kitchenOrders));

    // رسالة الواتساب
    let msg = `*طلب جديد من المنيو الإلكتروني* 🍔🛵\n\n`;
    msg += `*الزبون:* ${name}\n`;
    msg += `*الهاتف:* ${phone}\n`;
    msg += `*المنطقة:* ${region}\n`;
    msg += `*العنوان:* ${address}\n`;
    if(gpsLocationUrl) msg += `*رابط GPS:* ${gpsLocationUrl}\n`;
    msg += `*طريقة الدفع:* ${payment}\n`;
    msg += `\n*تفاصيل الوجبات:*\n`;

    cart.forEach((i, idx) => {
        msg += `${idx+1}. *${i.name}* ${i.size ? `(${i.size})`:''} x ${i.qty}\n`;
        if(i.addons.length) msg += `   + إضافات: ${i.addons.join(', ')}\n`;
        if(i.removals.length) msg += `   - بدون: ${i.removals.join(', ')}\n`;
        if(i.note) msg += `   📝 ملاحظة: ${i.note}\n`;
        msg += `   السعر: ${(i.unitPrice * i.qty).toLocaleString()} د.ع\n`;
    });

    msg += `\n*المجموع الفرعي:* ${subtotal.toLocaleString()} د.ع\n`;
    msg += `*أجور التوصيل:* ${deliveryFee.toLocaleString()} د.ع\n`;
    msg += `*الإجمالي النهائي:* ${grandTotal.toLocaleString()} د.ع`;

    window.open(`https://wa.me/${RESTAURANT_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
}
