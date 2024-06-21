import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAJfrX-blbvbFFsLAKqZOWvZh9YH5bUOaQ",
    authDomain: "kr1stik.firebaseapp.com",
    projectId: "kr1stik",
    storageBucket: "kr1stik.appspot.com",
    messagingSenderId: "401971179832",
    appId: "1:401971179832:web:9e488e8baa2a0b3f0dd1cd",
    measurementId: "G-G57SM7L67M"
};

document.addEventListener('DOMContentLoaded', async function () {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const pendingOrdersContainer = document.getElementById('pending-orders');
    const completedOrdersContainer = document.getElementById('completed-orders');

    async function fetchOrdersByStatus(container, status) {
        container.innerHTML = ''; // Clear previous content
        try {
            const q = query(collection(db, 'orders'), where('status', '==', status));
            const querySnapshot = await getDocs(q);

            console.log(`Fetched ${status} orders: `, querySnapshot.docs.map(doc => doc.data()));

            if (querySnapshot.empty) {
                container.innerHTML = `<p>No ${status.toLowerCase()} orders found.</p>`;
                return;
            }

            querySnapshot.forEach(doc => {
                const order = doc.data();
                const orderId = doc.id;
                const { tableNumber, totalPrice, discountedPrice, discountType, discountAmount, orderItems, serviceType } = order;

                // Ensure orderItems is an object
                const itemsArray = orderItems ? Object.values(orderItems) : [];

                // Ensure discountAmount and discountedPrice are numbers
                const validDiscountAmount = typeof discountAmount === 'number' ? discountAmount : 0;
                const validDiscountedPrice = typeof discountedPrice === 'number' ? discountedPrice : totalPrice;

                // Create order card element
                const orderCard = document.createElement('div');
                orderCard.classList.add('order-item');
                if (status === 'Completed') {
                    orderCard.classList.add('completed');
                }

                // Create order details HTML
                const orderDetailsHTML = `
                    <div class="order-details">
                        <p><strong>Order ID:</strong> ${orderId}</p>
                        <p><strong>Table Number:</strong> ${tableNumber}</p>
                        <p><strong>Total Price:</strong> ₱${totalPrice.toFixed(2)}</p>
                        <p><strong>Discount Type:</strong> ${discountType}</p>
                        <p><strong>Discount Amount:</strong> ₱${validDiscountAmount.toFixed(2)}</p>
                        <p><strong>Price After Discount:</strong> ₱${validDiscountedPrice.toFixed(2)}</p>
                        <p><strong>Order Type:</strong> ${serviceType}</p>
                        <p><strong>Status:</strong> <span class="status">${status}</span></p>
                        <h4>Items:</h4>
                        <ul>
                            ${itemsArray.map(item => {
                                return `<li>${item.name} x ${item.quantity} - ₱${(item.quantity * item.unitPrice).toFixed(2)}</li>`;
                            }).join('')}
                        </ul>
                        ${status === 'Pending' ? '<label><input type="checkbox" class="served-checkbox" data-order-id="' + orderId + '"> Mark as Served</label>' : ''}
                        <button class="remove-button" data-order-id="${orderId}">Remove</button>
                    </div>
                `;

                orderCard.innerHTML = orderDetailsHTML;
                container.appendChild(orderCard);

                // Attach event listener to served checkbox for Pending orders
                if (status === 'Pending') {
                    const servedCheckbox = orderCard.querySelector('.served-checkbox');
                    servedCheckbox.addEventListener('change', async function() {
                        const orderId = this.getAttribute('data-order-id');
                        await markOrderAsCompleted(orderId);
                    });
                }

                // Attach event listener to remove button
                const removeButton = orderCard.querySelector('.remove-button');
                if (removeButton) {
                    removeButton.addEventListener('click', async function() {
                        const orderId = this.getAttribute('data-order-id');
                        await deleteOrder(orderId);
                    });
                }
            });
        } catch (error) {
            console.error(`Error fetching ${status} orders:`, error);
            container.innerHTML = `<p>Error fetching ${status} orders. Please try again later.</p>`;
        }
    }

    async function markOrderAsCompleted(orderId) {
        try {
            await updateDoc(doc(db, 'orders', orderId), {
                status: 'Completed' // Update status to Completed
            });
            console.log(`Order ${orderId} marked as completed.`);
            fetchOrders(); // Refresh displayed orders
        } catch (error) {
            console.error(`Error marking order ${orderId} as completed:`, error);
            alert(`Error marking order ${orderId} as completed. Please try again later.`);
        }
    }

    async function deleteOrder(orderId) {
        try {
            await deleteDoc(doc(db, 'orders', orderId));
            console.log(`Order ${orderId} deleted successfully.`);
            fetchOrders(); // Refresh displayed orders
        } catch (error) {
            console.error(`Error deleting order ${orderId}:`, error);
            alert(`Error deleting order ${orderId}. Please try again later.`);
        }
    }

    async function fetchOrders() {
        await fetchOrdersByStatus(pendingOrdersContainer, 'Pending');
        await fetchOrdersByStatus(completedOrdersContainer, 'Completed');
    }

    fetchOrders(); // Fetch orders when the page loads
});
