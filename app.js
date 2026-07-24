// قائمة الأصناف والوجبات
let menuItems = [
    {
        id: 1,
        name: "ريزو دجاج",
        category: "ريزو",
        price: 6000,
        image: "rizzo.jpg"
    }
];

function displayMenu(items) {
    const container = document.getElementById('menuContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    items.forEach(item => {
        container.innerHTML += `
            <div class="menu-item">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='logo.png'">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="price">${item.price} د.ع</p>
                    <button class="add-btn" onclick="addToCart(${item.id})">+ إضافة</button>
                </div>
            </div>
        `;
    });
}

function filterCategory(category) {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (category === 'الكل') {
        displayMenu(menuItems);
    } else {
        const filtered = menuItems.filter(item => item.category === category);
        displayMenu(filtered);
    }
}

let cart = [];

function addToCart(id) {
    const item = menuItems.find(p => p.id === id);
    if (item) {
        cart.push(item);
        updateCartUI();
    }
}

function updateCartUI() {
    const totalPriceElement = document.getElementById('totalPrice');
    const cartCountElement = document.getElementById('cartCount');
    
    let total = cart.reduce((sum, item) => sum + item.price, 0);
    
    if (totalPriceElement) totalPriceElement.textContent = total;
    if (cartCountElement) cartCountElement.textContent = cart.length;
}

function openCart() {
    if (cart.length === 0) {
        alert("السلة فارغة حالياً!");
        return;
    }
    let orderDetails = cart.map(item => `- ${item.name} (${item.price} د.ع)`).join('\n');
    let total = cart.reduce((sum, item) => sum + item.price, 0);
    alert(`قائمة طلباتك:\n\n${orderDetails}\n\nالإجمالي الكلي: ${total} د.ع`);
}

window.onload = function() {
    displayMenu(menuItems);
};
