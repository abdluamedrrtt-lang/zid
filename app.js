// ==========================================
// 1. الإعدادات العامة ورقم الواتساب
// ==========================================
const RESTAURANT_PHONE = "9647838021664";

// القائمة الافتراضية للوجبات
const defaultMenu = [
    {
        id: 1,
        name: "برغر لحم دبل تشيز",
        category: "برغر",
        price: 7500,
        description: "شريحتين لحم بلدي مع الجبن الصافي والصوص الخاص.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
        isAvailable: true
    },
    {
        id: 2,
        name: "برغر دجاج مقرمش",
        category: "برغر",
        price: 6000,
        description: "صدر دجاج مقرمش مع خس وصوص المايونيز.",
        image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=300",
        isAvailable: true
    },
    {
        id: 3,
        name: "بطاطا بالجبن (تشيز فرايز)",
        category: "مقبلات",
        price: 3500,
        description: "بطاطس مقرمشة مغطاة بصوص الشيدر الذائب.",
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300",
        isAvailable: false
    }
];

// جلب الوجبات المخزنة
function getMenu() {
    const saved = localStorage.getItem("restaurant_menu");
    if (!saved) {
        localStorage.setItem("restaurant_menu", JSON.stringify(defaultMenu));
        return defaultMenu;
    }
    return JSON.parse(saved);
}

// حفظ الوجبات
function saveMenu(menu) {
    localStorage.setItem("restaurant_menu", JSON.stringify(menu));
}

let cart = [];

// ==========================================
// 2. عرض المنيو للزبون (index.html)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("menu-items")) {
        renderCategories();
        renderUserMenu();
    }
});

function renderCategories() {
    const menu = getMenu();
    const categories = ["الكل", ...new Set(menu.map(i => i.category))];
    const container = document.getElementById("categories-container");
    if (!container) return;

    container.innerHTML = categories.map(cat => `
        <button onclick="filterCategory('${cat}')" class="px-4 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap bg-gray-50 text-gray-700 hover:bg-red-600 hover:text-white transition">
            ${cat}
        </button>
    `).join('');
}

function filterCategory(cat) {
    const menu = getMenu();
    if (cat === "الكل") renderUserMenu(menu);
    else renderUserMenu(menu.filter(i => i.category === cat));
}

function renderUserMenu(items = getMenu()) {
    const container = document.getElementById("menu-items");
    if (!container) return;

    container.innerHTML = items.map(item => `
        <div class="bg-white p-3 rounded-xl shadow-sm border flex gap-3 items-center ${!item.isAvailable ? 'opacity-50' : ''}">
            <img src="${item.image || 'https://via.placeholder.com/100'}" class="w-20 h-20 rounded-lg object-cover">
            <div class="flex-1">
                <div class="flex justify-between">
                    <h3 class="font-bold text-sm">${item.name}</h3>
                    ${!item.isAvailable ? '<span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">نفدت الكمية</span>' : ''}
                </div>
                <p class="text-xs text-gray-500 my-1 line-clamp-1">${item.description || ''}</p>
                <div class="flex justify-between items-center mt-2">
                    <span class="font-black text-red-600 text-sm">${item.price.toLocaleString()} د.ع</span>
                    ${item.isAvailable ? `
                        <button onclick="addToCart(${item.id})" class="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white">
                            + إضافة
                        </button>
                    ` : '<span class="text-xs text-gray-400">غير متوفر</span>'}
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 3. إدارة السلة والطلب
// ==========================================
function addToCart(id) {
    const menu = getMenu();
    const item = menu.find(i => i.id === id);
    if (!item) return;

    const inCart = cart.find(c => c.id === id);
    if (inCart) {
        inCart.qty++;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const totalCount = cart.reduce((acc, i) => acc + i.qty, 0);
    const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);

    const countElem = document.getElementById("cart-count");
    const totalElem = document.getElementById("cart-total");

    if (countElem) countElem.innerText = totalCount;
    if (totalElem) totalElem.innerText = subtotal.toLocaleString();

    const list = document.getElementById("cart-items-list");
    if (list) {
        list.innerHTML = cart.map(i => `
            <div class="flex justify-between items-center py-2">
                <div>
                    <h4 class="font-bold text-xs">${i.name}</h4>
                    <span class="text-xs text-red-600">${(i.price * i.qty).toLocaleString()} د.ع</span>
                </div>
                <div class="flex items-center gap-2 border rounded-lg px-2 py-1">
                    <button onclick="changeQty(${i.id}, -1)" class="text-red-600 font-bold">-</button>
                    <span class="text-xs font-bold">${i.qty}</span>
                    <button onclick="changeQty(${i.id}, 1)" class="text-green-600 font-bold">+</button>
                </div>
            </div>
        `).join('');
    }
}

function changeQty(id, delta) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx > -1) {
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
    }
    updateCartUI();
}

function toggleCartModal(show) {
    const modal = document.getElementById("cart-modal");
    if (modal) modal.classList.toggle("hidden", !show);
}

function sendOrderToWhatsApp(e) {
    e.preventDefault();
    if (cart.length === 0) return alert("السلة فارغة!");

    const name = document.getElementById("cust-name").value;
    const phone = document.getElementById("cust-phone").value;
    const address = document.getElementById("cust-address").value;

    let msg = `*طلب جديد من المطبخ* 🍔🛵\n\n`;
    msg += `*الزبون:* ${name}\n`;
    msg += `*الهاتف:* ${phone}\n`;
    msg += `*العنوان:* ${address}\n\n`;
    msg += `*الطلبات:*\n`;

    cart.forEach((i, idx) => {
        msg += `${idx+1}. ${i.name} x${i.qty} = ${(i.price * i.qty).toLocaleString()} د.ع\n`;
    });

    const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    msg += `\n*الإجمالي:* ${total.toLocaleString()} د.ع`;

    window.open(`https://wa.me/${RESTAURANT_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ==========================================
// 4. وظائف لوحة التحكم (admin.html)
// ==========================================
function renderAdminPage() {
    const menu = getMenu();
    const list = document.getElementById("admin-items-list");
    if (!list) return;

    list.innerHTML = menu.map(item => `
        <div class="border p-3 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50">
            <div class="flex items-center gap-3 w-full sm:w-auto">
                <img src="${item.image || 'https://via.placeholder.com/60'}" class="w-12 h-12 rounded object-cover">
                <div>
                    <h4 class="font-bold text-sm">${item.name}</h4>
                    <span class="text-xs text-gray-500">${item.category} | ${item.price.toLocaleString()} د.ع</span>
                </div>
            </div>
            
            <div class="flex gap-2 w-full sm:w-auto justify-end">
                <button onclick="toggleAvailability(${item.id})" class="px-3 py-1 rounded text-xs font-bold ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                    ${item.isAvailable ? 'متوفر ✅' : 'غير متوفر ❌'}
                </button>
                <button onclick="deleteItem(${item.id})" class="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">
                    حذف 🗑️
                </button>
            </div>
        </div>
    `).join('');
}

function addNewItem(e) {
    e.preventDefault();
    const menu = getMenu();
    
    const newItem = {
        id: Date.now(),
        name: document.getElementById("new-name").value,
        price: parseFloat(document.getElementById("new-price").value),
        category: document.getElementById("new-category").value,
        image: document.getElementById("new-image").value || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300",
        description: document.getElementById("new-desc").value || "",
        isAvailable: true
    };

    menu.push(newItem);
    saveMenu(menu);
    
    // إعادة تحديث العرض في لوحة التحكم
    renderAdminPage();
    e.target.reset();
    alert("تمت إضافة الوجبة بنجاح إلى المنيو!");
}

function toggleAvailability(id) {
    const menu = getMenu();
    const item = menu.find(i => i.id === id);
    if (item) {
        item.isAvailable = !item.isAvailable;
        saveMenu(menu);
        renderAdminPage();
    }
}

function deleteItem(id) {
    if (confirm("هل أنت تأكد من حذف هذه الوجبة؟")) {
        let menu = getMenu();
        menu = menu.filter(i => i.id !== id);
        saveMenu(menu);
        renderAdminPage();
    }
}
