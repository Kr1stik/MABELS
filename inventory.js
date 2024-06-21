import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let updateItemId = null;
let allItems = [];

// Fetch and display inventory items
async function fetchInventoryItems() {
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, "menu"));
    allItems = [];
    querySnapshot.forEach((doc) => {
        const item = doc.data();
        item.id = doc.id;
        allItems.push(item);
    });
    displayItems(allItems);
}

function displayItems(items) {
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '';
    items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - ₱${item.price} (Category: ${item.category}, Available: ${item.quantity})`;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteItem(item.id);

        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update';
        updateButton.onclick = () => populateMenuForm(item.id, item);

        buttonContainer.appendChild(deleteButton);
        buttonContainer.appendChild(updateButton);

        li.appendChild(buttonContainer);
        inventoryList.appendChild(li);
    });
}

document.getElementById('menu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemName = document.getElementById('item-name').value;
    const itemPrice = parseFloat(document.getElementById('item-price').value);
    const itemCategory = document.getElementById('item-category').value;
    const itemQuantity = parseInt(document.getElementById('item-quantity').value);

    try {
        if (updateItemId) {
            await updateMenuItem(updateItemId, { name: itemName, price: itemPrice, category: itemCategory, quantity: itemQuantity });
            updateItemId = null;
        } else {
            await addMenuItem({ name: itemName, price: itemPrice, category: itemCategory, quantity: itemQuantity });
        }

        fetchInventoryItems();
        document.getElementById('menu-form').reset();
    } catch (e) {
        console.error("Error adding/updating menu item: ", e);
        alert("Error adding/updating menu item: " + e.message);
    }
});

// Function to add a new menu item
async function addMenuItem(item) {
    try {
        await addDoc(collection(db, "menu"), item);
        alert("Menu item added successfully!");
    } catch (e) {
        console.error("Error adding menu item: ", e);
        alert("Error adding menu item: " + e.message);
    }
}

// Function to update an existing menu item
async function updateMenuItem(id, item) {
    try {
        const itemDoc = doc(db, "menu", id);
        await updateDoc(itemDoc, item);
        alert("Menu item updated successfully!");
    } catch (e) {
        console.error("Error updating menu item: ", e);
        alert("Error updating menu item: " + e.message);
    }
}

// Function to delete a menu item
async function deleteItem(id) {
    try {
        await deleteDoc(doc(db, "menu", id));
        alert("Menu item deleted successfully!");
        fetchInventoryItems();
    } catch (e) {
        console.error("Error deleting menu item: ", e);
        alert("Error deleting menu item: " + e.message);
    }
}

// Function to populate the menu form for updating
function populateMenuForm(id, item) {
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-quantity').value = item.quantity;
    updateItemId = id;
}

// Search bar functionality
document.getElementById('search-bar').addEventListener('input', function() {
    const query = this.value.toLowerCase();
    const filteredItems = allItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    displayItems(filteredItems);
});

// Initial fetch of inventory items
fetchInventoryItems();
