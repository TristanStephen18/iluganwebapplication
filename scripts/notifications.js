import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAL0I2_e4RNhtnwavuNrncD21sZAsmslmY",
  authDomain: "ilugan-database.firebaseapp.com",
  projectId: "ilugan-database",
  storageBucket: "ilugan-database.appspot.com",
  messagingSenderId: "814689984399",
  appId: "1:814689984399:web:ec6e6715f77d754a6875fa",
  measurementId: "G-XD470CX22M",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Authenticate and fetch data
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userId = user.uid;
    fetchNotifications(userId);
  } else {
    console.log("User is not logged in");
  }
});

function displayNotification(busnumber, description, emergency, date) {
    const notificationsContainer = document.getElementById("notifications");
    const notificationElement = document.createElement("div");
    notificationElement.className = "notification";

    notificationElement.innerHTML = `
      <i class="fas fa-bell"></i>
      <div>
        <strong>${busnumber} - ${emergency ? "Emergency" : "Normal"}</strong>
        <p>${description}</p>
        <small>${date}</small>
      </div>
    `;
    notificationsContainer.appendChild(notificationElement);
  }

const logoutbtn = document.querySelector("#logout");
console.log(logoutbtn);
logoutbtn.addEventListener("click", () => {
  console.log("Clicked logout btn");
  logout();
});

let notificationsData = []; // Store fetched notifications
let currentPage = 1; // Track current page
const itemsPerPage = 10; // Number of notifications per page

// Update display function with filters and pagination
function displayNotifications() {
  const searchInput = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const filterDate = document.getElementById("filterDate").value;

  const filteredData = notificationsData.filter((notification) => {
    const matchesSearch =
      notification.busnumber.toLowerCase().includes(searchInput) ||
      notification.description.toLowerCase().includes(searchInput);

    const matchesDate = filterDate ? notification.date === filterDate : true; // No date filter applied

    return matchesSearch && matchesDate;
  });

  paginateNotifications(filteredData);
}

// Function to create pagination controls
function paginateNotifications(data) {
  const notificationsContainer = document.getElementById("notifications");
  const paginationContainer = document.getElementById("pagination");
  notificationsContainer.innerHTML = ""; // Clear current notifications
  paginationContainer.innerHTML = ""; // Clear pagination buttons

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(start, start + itemsPerPage);

  paginatedData.forEach((notification) => {
    displayNotification(
      notification.busnumber,
      notification.description,
      notification.emergency,
      notification.date
    );
  });

  // Create pagination buttons
  for (let i = 1; i <= totalPages; i++) {
    const pageItem = document.createElement("li");
    pageItem.className = `page-item ${i === currentPage ? "active" : ""}`;
    const pageLink = document.createElement("a");
    pageLink.className = "page-link";
    pageLink.textContent = i;
    pageLink.addEventListener("click", () => {
      currentPage = i;
      paginateNotifications(data);
    });
    pageItem.appendChild(pageLink);
    paginationContainer.appendChild(pageItem);
  }
}

// Fetch notifications from Firestore and initialize data
async function fetchNotifications(uid) {
  const alertsRef = collection(db, `companies/${uid}/busalerts`);
  const querySnapshot = await getDocs(alertsRef);

  notificationsData = querySnapshot.docs.map((doc) => {
    const { busnumber, description, emergency } = doc.data();
    return {
      busnumber,
      description,
      emergency,
      date: doc.id, // Assuming document ID represents the date
    };
  });

  displayNotifications(); // Display with initial data
}

// Add event listeners to search input and filter date
document
  .getElementById("searchInput")
  .addEventListener("input", displayNotifications);
document
  .getElementById("filterDate")
  .addEventListener("change", displayNotifications);

// fetchNotifications()
