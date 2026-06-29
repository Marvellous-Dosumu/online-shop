// Cart and product helpers
const CART_KEY = 'onlineShopCart';

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getCartCount(cart) {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartButton() {
    const button = document.querySelector('.cart-float-button');
    if (!button) return;

    const count = getCartCount(getCart());
    button.textContent = count > 0 ? `Cart (${count})` : 'Go to Cart';
}

function createProductObject(productElement) {
    const img = productElement.querySelector('img')?.getAttribute('src') || '';
    const name = productElement.querySelector('h2')?.textContent.trim() || 'Product';
    const priceText = productElement.querySelector('p')?.textContent.trim() || '$0';
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    return {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        price,
        img,
        quantity: 1,
    };
}

function addToCart(product) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push(product);
    }
    saveCart(cart);
    updateCartButton();
}

function renderCartPage() {
    const cart = getCart();
    const countEl = document.getElementById('item-count');
    const cartItemsEl = document.getElementById('cart-items');
    const checkoutButton = document.getElementById('checkout-button');
    const cartTotalEl = document.getElementById('cart-total-value');

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (countEl) {
        countEl.textContent = getCartCount(cart);
    }

    if (cartItemsEl) {
        cartItemsEl.innerHTML = '';
        if (cart.length === 0) {
            cartItemsEl.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        } else {
            cart.forEach((item) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
          <img src="${item.img}" alt="${item.name}" />
          <div class="cart-item-details">
            <h3>${item.name}</h3>
            <p>${item.quantity} x $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        `;
                cartItemsEl.appendChild(itemEl);
            });
        }
    }

    if (cartTotalEl) {
        cartTotalEl.textContent = `$${totalPrice.toFixed(2)}`;
    }

    if (checkoutButton) {
        checkoutButton.disabled = cart.length === 0;
    }
}

// Shop page and category filters
function initShopPage() {
    const products = document.querySelectorAll('.product');
    products.forEach((productElement, index) => {
        const category = index < 5 ? 'wires' : index < 12 ? 'phone' : 'electronics';
        productElement.dataset.category = category;

        const button = productElement.querySelector('.add-to-cart');
        if (!button) return;

        button.addEventListener('click', () => {
            const product = createProductObject(productElement);
            addToCart(product);
            button.textContent = 'Added';
            setTimeout(() => {
                button.textContent = 'Add to Cart';
            }, 1000);
        });
    });
}

function filterProducts(category) {
    const products = document.querySelectorAll('.product');
    products.forEach((product) => {
        if (category === 'all' || product.dataset.category === category) {
            product.style.display = '';
        } else {
            product.style.display = 'none';
        }
    });
}

function closeSidebar() {
    const sidebar = document.getElementById('category-sidebar');
    const overlay = document.getElementById('filter-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
}

function initCategorySidebar() {
    const openButton = document.getElementById('open-sidebar');
    const closeButton = document.getElementById('close-sidebar');
    const overlay = document.getElementById('filter-overlay');
    const categoryButtons = document.querySelectorAll('.category-btn');

    if (openButton) {
        openButton.addEventListener('click', () => {
            document.getElementById('category-sidebar')?.classList.add('open');
            overlay?.classList.add('visible');
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    categoryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            categoryButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            filterProducts(category);
            closeSidebar();
        });
    });
}

// User, login, and session helpers
const USER_KEY = 'onlineShopCurrentUser';
const USERS_KEY = 'onlineShopUsers';
const VISITOR_STATS_KEY = 'onlineShopVisitorStats';
const SESSION_GUEST_KEY = 'onlineShopGuestSession';
const SESSION_LOGIN_KEY = 'onlineShopLoginSession';

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    const normalizedUser = {
        ...user,
        orders: user.orders ?? getCartCount(getCart()),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    saveUser(normalizedUser);
    recordVisitorEntry('logged-in', normalizedUser);
}

function getUsers() {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveUser(user) {
    const users = getUsers();
    const existing = users.find((item) => item.email === user.email);
    if (existing) {
        existing.name = user.name;
        existing.orders = user.orders;
    } else {
        users.push(user);
    }
    saveUsers(users);
}

function getVisitorStats() {
    try {
        const raw = localStorage.getItem(VISITOR_STATS_KEY);
        return raw
            ? JSON.parse(raw)
            : { guests: 0, loggedIn: 0, entries: [] };
    } catch {
        return { guests: 0, loggedIn: 0, entries: [] };
    }
}

function saveVisitorStats(stats) {
    localStorage.setItem(VISITOR_STATS_KEY, JSON.stringify(stats));
}

function recordVisitorEntry(type, user = null) {
    const stats = getVisitorStats();
    const sessionKey = type === 'guest' ? SESSION_GUEST_KEY : SESSION_LOGIN_KEY;
    if (sessionStorage.getItem(sessionKey)) return stats;

    sessionStorage.setItem(sessionKey, '1');
    const entry = {
        id: `${type}-${Date.now()}`,
        type: type === 'guest' ? 'Guest' : 'Logged In',
        name: user?.name || 'Guest',
        email: user?.email || '—',
        orders: user?.orders || 0,
        items: '',
        time: new Date().toLocaleString(),
    };

    if (type === 'guest') {
        stats.guests += 1;
    } else {
        stats.loggedIn += 1;
    }

    stats.entries.unshift(entry);
    saveVisitorStats(stats);
    return stats;
}

function recordOrderEntry(cart, user = null) {
    const stats = getVisitorStats();
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const entry = {
        id: `order-${Date.now()}`,
        type: 'Order',
        name: user?.name || 'Guest',
        email: user?.email || '—',
        orders: getCartCount(cart),
        items: cart
            .map((product) => `${product.quantity}x ${product.name}`)
            .join(', '),
        total: totalPrice,
        time: new Date().toLocaleString(),
    };

    stats.entries.unshift(entry);
    saveVisitorStats(stats);
    return stats;
}

function trackVisitor() {
    const user = getCurrentUser();
    return user ? recordVisitorEntry('logged-in', user) : recordVisitorEntry('guest');
}

function updateHomeGreeting() {
    const greeting = document.getElementById('home-greeting');
    const user = getCurrentUser();
    if (greeting) {
        greeting.textContent = user ? `Hello, ${user.name}!` : 'Hello, guest!';
    }
}

function initLoginPage() {
    const form = document.querySelector('.login-page form');
    if (!form) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = form.querySelector('#name')?.value.trim();
        const email = form.querySelector('#email')?.value.trim();
        const password = form.querySelector('#password')?.value.trim();
        if (!name || !email || !password) {
            alert('Please fill in all fields.');
            return;
        }

        const user = {
            name,
            email,
            orders: getCartCount(getCart()),
        };
        setCurrentUser(user);
        alert(`Welcome ${name}!`);
        window.location.href = 'online.html';
    });
}

function updateCurrentUserOrders(cart) {
    const user = getCurrentUser();
    if (!user) return;
    const currentTotal = user.orders || 0;
    user.orders = currentTotal + getCartCount(cart);
    setCurrentUser(user);
}

// Admin and visitor tracking
function renderAdminPage() {
    const stats = getVisitorStats();
    const table = document.getElementById('admin-table');
    const loggedInCount = document.getElementById('logged-in-count');
    const guestCount = document.getElementById('guest-count');
    const totalVisitors = document.getElementById('total-visitors');

    if (loggedInCount) {
        loggedInCount.textContent = stats.loggedIn;
    }

    if (guestCount) {
        guestCount.textContent = stats.guests;
    }

    if (totalVisitors) {
        totalVisitors.textContent = stats.guests + stats.loggedIn;
    }

    if (!table) return;

    if (stats.entries.length === 0) {
        table.innerHTML = '<tr><td colspan="7" class="admin-empty">No visitors have been recorded yet.</td></tr>';
        return;
    }

    table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Type</th>
        <th>Orders</th>
        <th>Items Ordered</th>
        <th>Total Price</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      ${stats.entries
            .map(
                (entry) => `
      <tr>
        <td>${entry.name}</td>
        <td>${entry.email}</td>
        <td>${entry.type}</td>
        <td>${entry.orders || 0}</td>
        <td>${entry.items || '-'}</td>
        <td>${entry.total ? `$${entry.total.toFixed(2)}` : '-'}</td>
        <td>${entry.time}</td>
      </tr>`
            )
            .join('')}
    </tbody>
  `;
}

function initAdminPage() {
    const table = document.getElementById('admin-table');
    if (!table) return;
    renderAdminPage();
}

// Checkout and page startup
function initCartPage() {
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            const cart = getCart();
            if (cart.length === 0) {
                alert('Your cart is empty.');
                return;
            }

            const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const user = getCurrentUser();
            recordOrderEntry(cart, user);
            saveCart([]);
            updateCurrentUserOrders(cart);
            window.location.href = '../thankyou.html';
        });
    }

    renderCartPage();
    updateCurrentUserOrders(getCart());
}

function initSharedPages() {
    updateCartButton();
    updateHomeGreeting();
    trackVisitor();

    if (document.querySelector('.product-list')) {
        initShopPage();
        initCategorySidebar();
    }

    if (document.getElementById('cart-items')) {
        initCartPage();
    }

    if (document.querySelector('.login-page form')) {
        initLoginPage();
    }

    if (document.getElementById('admin-table')) {
        initAdminPage();
    }
}

document.addEventListener('DOMContentLoaded', initSharedPages);
