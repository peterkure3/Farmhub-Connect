const sideMenu = document.querySelector('aside');
const menuBtn = document.getElementById('menu-btn');
const closeBtn = document.getElementById('close-btn');
const darkMode = document.querySelector('.dark-mode');

menuBtn.addEventListener('click', () => {
    sideMenu.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    sideMenu.style.display = 'none';
});

darkMode.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode-variables');
    darkMode.querySelector('span:nth-child(1)').classList.toggle('active');
    darkMode.querySelector('span:nth-child(2)').classList.toggle('active');
});

// Fetch products function
function fetchProducts() {
    fetch('http://127.0.0.1:3000/api/products')
        .then(response => response.json())
        .then(products => {
            renderProducts(products);
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });
}

// Render products function
function renderProducts(products) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = ''; // Clear existing table content

    products.forEach(product => {
        const tr = document.createElement('tr');
        const trContent = `
            <td>${product.productName}</td>
            <td>${product.productNumber}</td>
            <td>${product.paymentStatus}</td>
            <td class="${product.status === 'Declined' ? 'danger' : product.status === 'Pending' ? 'warning' : 'primary'}">${product.status}</td>
            <td class="primary">Details</td>
        `;
        tr.innerHTML = trContent;
        tbody.appendChild(tr);
    });
}

// Call fetchProducts when the DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    fetchProducts();
});
