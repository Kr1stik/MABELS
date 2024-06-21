import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJfrX-blbvbFFsLAKqZOWvZh9YH5bUOaQ",
    authDomain: "kr1stik.firebaseapp.com",
    projectId: "kr1stik",
    storageBucket: "kr1stik.appspot.com",
    messagingSenderId: "401971179832",
    appId: "1:401971179832:web:9e488e8baa2a0b3f0dd1cd",
    measurementId: "G-G57SM7L67M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async function () {
    const links = document.querySelectorAll('.Menu a');
    const contentContainer = document.getElementById('content');
    const orderList = document.getElementById('order-list');
    const totalPriceElement = document.getElementById('total-price');
    const checkoutButton = document.getElementById('checkout-button');

    let orderItems = {};
    let availableQuantities = {};
    let usedTableNumbers = new Set();

    const categoryContent = await fetchAndOrganizeInventoryItems(db);

    links.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const category = this.getAttribute('data-category');
            if (categoryContent[category]) {
                contentContainer.innerHTML = categoryContent[category];
                addOrderListeners();
            } else {
                contentContainer.innerHTML = "<h2>Category not found</h2><p>No content available for this category.</p>";
            }
        });
    });

    checkoutButton.addEventListener('click', async function () {
        try {
            const totalPrice = calculateTotalPrice(orderItems);
            const discountType = document.getElementById('discount-select').value;
            const { discountedPrice, discountAmount } = applyDiscount(totalPrice, discountType);
            const serviceType = document.getElementById('order-type').value;
            const tableNumber = generateUniqueTableNumber();

            await addDoc(collection(db, 'orders'), {
                orderItems,
                totalPrice,
                discountedPrice,
                discountType,
                discountAmount,
                serviceType,
                tableNumber,
                status: 'Pending'
            });

            orderItems = {};
            updateOrderListDisplay();
            alert('Order placed successfully!');
        } catch (error) {
            console.error('Error placing order: ', error);
            alert('An error occurred during checkout. Please try again later.');
        }
    });

    async function fetchAndOrganizeInventoryItems(db) {
        const categoryContent = {};
        try {
            const querySnapshot = await getDocs(collection(db, "menu"));
            querySnapshot.forEach((doc) => {
                const item = doc.data();
                const category = item.category;
                const itemId = doc.id;

                if (!categoryContent[category]) {
                    categoryContent[category] = `<h2>${category}</h2>`;
                }

                categoryContent[category] += `
                    <div class="product-item" data-id="${itemId}" data-name="${item.name}" data-price="${item.price}" data-quantity="${item.quantity}">
                        <span>${item.name} - ₱${item.price}</span>
                        <span>Available: <span class="item-quantity" id="quantity-${itemId}">${item.quantity}</span></span>
                    </div>
                `;

                availableQuantities[itemId] = item.quantity;
            });

        } catch (error) {
            console.error('Error fetching inventory items:', error);
        }

        return categoryContent;
    }

    function addOrderListeners() {
        const menuItems = document.querySelectorAll('.product-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function () {
                const itemId = this.getAttribute('data-id');
                const itemName = this.getAttribute('data-name');
                const itemPrice = parseFloat(this.getAttribute('data-price'));
                const itemQuantityElement = document.getElementById(`quantity-${itemId}`);
                let itemQuantity = parseInt(itemQuantityElement.textContent);

                if (itemQuantity > 0) {
                    addToOrder(itemName, itemPrice, itemId);
                    itemQuantity -= 1;
                    availableQuantities[itemId] -= 1;
                    itemQuantityElement.textContent = itemQuantity;

                    if (itemQuantity === 0) {
                        this.classList.add('out-of-stock');
                    }

                    if (itemQuantity <= 2) {
                        alert(`Warning: Only ${itemQuantity} ${itemName}(s) left in stock!`);
                    }
                }
            });
        });
    }

    function addToOrder(name, price, itemId) {
        if (orderItems[itemId]) {
            orderItems[itemId].quantity += 1;
            orderItems[itemId].totalPrice += price;
        } else {
            orderItems[itemId] = {
                name: name,
                quantity: 1,
                unitPrice: price,
                totalPrice: price
            };
        }
        updateOrderListDisplay();
    }

    function removeFromOrder(itemId, unitPrice) {
        if (orderItems[itemId]) {
            if (orderItems[itemId].quantity > 1) {
                orderItems[itemId].quantity -= 1;
                orderItems[itemId].totalPrice -= unitPrice;
            } else {
                delete orderItems[itemId];
            }

            availableQuantities[itemId] += 1;
            const itemQuantityElement = document.getElementById(`quantity-${itemId}`);
            itemQuantityElement.textContent = availableQuantities[itemId];

            updateOrderListDisplay();
        }
    }

    function updateOrderListDisplay() {
        orderList.innerHTML = '';
        let totalPrice = 0;

        for (const [itemId, details] of Object.entries(orderItems)) {
            const orderItem = document.createElement('li');
            orderItem.innerHTML = `
                <span>${details.name} - ₱${details.unitPrice} x ${details.quantity} = ₱${details.totalPrice}</span>
                <button class="remove-item" data-id="${itemId}" data-price="${details.unitPrice}">Remove</button>
            `;
            orderList.appendChild(orderItem);
            totalPrice += details.totalPrice;
        }

        totalPriceElement.textContent = `Total: ₱${totalPrice}`;

        const removeButtons = document.querySelectorAll('.remove-item');
        removeButtons.forEach(button => {
            button.addEventListener('click', function () {
                const itemId = this.getAttribute('data-id');
                const unitPrice = parseFloat(this.getAttribute('data-price'));
                removeFromOrder(itemId, unitPrice);
            });
        });
    }

    function calculateTotalPrice(orderItems) {
        let total = 0;
        for (const itemId in orderItems) {
            total += orderItems[itemId].totalPrice;
        }
        return total;
    }

    function applyDiscount(totalPrice, discountType) {
        let discountAmount = 0;
        if (discountType === 'PWD') {
            discountAmount = totalPrice * 0.20; // 20% discount for PWD
        } else if (discountType === 'Senior') {
            discountAmount = totalPrice * 0.05; // 5% discount for Senior Citizen
        }
        const discountedPrice = totalPrice - discountAmount;
        return { discountedPrice, discountAmount };
    }

    function generateUniqueTableNumber() {
        let tableNumber;
        do {
            tableNumber = Math.floor(Math.random() * 20) + 1; // Generate a random number between 1 and 20
        } while (usedTableNumbers.has(tableNumber));
        usedTableNumbers.add(tableNumber);
        return tableNumber;
    }
});
