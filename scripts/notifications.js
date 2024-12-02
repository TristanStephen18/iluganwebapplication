import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc
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

const options = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: true // 12-hour format
};

let userId;
let notificationsData = [];
let selectedNotification = null;
const itemsPerPage = 10;
let currentPage = 1;

// Pagination controls
function updatePaginationControls() {
  const totalPages = Math.ceil(notificationsData.length / itemsPerPage);
  const paginationContainer = document.querySelector('.pagination');
  paginationContainer.innerHTML = `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="previousPage()">Previous</a>
    </li>
    ${Array.from({ length: totalPages }, (_, i) => `
      <li class="page-item ${currentPage === i + 1 ? 'active' : ''}">
        <a class="page-link" href="#" onclick="goToPage(${i + 1})">${i + 1}</a>
      </li>
    `).join('')}
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="nextPage()">Next</a>
    </li>
  `;
}

// Display the notifications for the current page
function displayCurrentPageNotifications() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedData = notificationsData.slice(start, end);

  document.getElementById("pendingNotifications").innerHTML = "";
  document.getElementById("respondedNotifications").innerHTML = "";

  paginatedData.forEach(notification => {
    displayNotification(
      notification.busnumber,
      notification.description,
      notification.emergency,
      notification.date,
      notification.responded,
      notification.id
    );
  });

  updatePaginationControls();
}

// Navigate to a specific page
function goToPage(page) {
  currentPage = page;
  displayCurrentPageNotifications();
}

// Navigate to the next page
function nextPage() {
  const totalPages = Math.ceil(notificationsData.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayCurrentPageNotifications();
  }
}

// Navigate to the previous page
function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    displayCurrentPageNotifications();
  }
}

// Attach pagination functions to the global scope for inline HTML access
window.goToPage = goToPage;
window.nextPage = nextPage;
window.previousPage = previousPage;

onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    listenForNotifications(userId);
  } else {
    console.log("User is not logged in");
  }
});

document.querySelector("#logout").addEventListener("click", logout);

async function logout() {
  const userDocRef = doc(db, "companies", userId);
  await updateDoc(userDocRef, { status: "offline" });
  await signOut(auth);
  Swal.fire("Ilugan", "Log out successful", "success").then(() => location.assign("/login"));
}

// Listen for click on "Respond" button and open modal
function displayNotification(busnumber, description, emergency, date, responded, notificationId) {
  const container = responded ? document.getElementById("respondedNotifications") : document.getElementById("pendingNotifications");
  const notificationElement = document.createElement("div");
  notificationElement.className = "notification";

  notificationElement.innerHTML = `
    <i class="fas fa-exclamation-triangle" style="margin-left: 10px;"></i>
    <div id="alertdiv">
      <strong style="text-transform: uppercase;">${busnumber} - ${emergency}</strong>
      <p>${description}</p>
      <small>${date}</small>
      ${!responded ? `<button class="btn btn-sm btn-success mt-2 respond-btn" id="rbtn" data-id="${notificationId}" busnum="${busnumber}">Respond</button>` : ""}
    </div>
  `;
  
  container.appendChild(notificationElement);
}

document.getElementById("pendingNotifications").addEventListener("click", (event) => {
  const respondBtn = event.target.closest(".respond-btn");
  if (respondBtn) {
    const notificationId = respondBtn.getAttribute("data-id");
    const busnum = respondBtn.getAttribute("busnum");
    console.log(busnum);
    selectedNotification = notificationsData.find(notification => notification.id === notificationId);
    document.getElementById('responseModalLabel').innerHTML = `Respond to ${busnum}'s emergency`;

    // Show the modal explicitly using Bootstrap’s Modal API
    const responseModal = new bootstrap.Modal(document.getElementById("responseModal"), {
      keyboard: false
    });
    responseModal.show();
  }
});

// Other logic like sending a response, listening for updates, and logging remains unchanged...

document.getElementById("sendResponseBtn").addEventListener("click", async () => {
  // Logic for sending a response...
});

// Filter notifications based on the search input
function displayNotifications() {
  const searchInput = document.getElementById("searchInput").value.toLowerCase();

  const filteredNotifications = notificationsData.filter(notification => 
    notification.busnumber.toLowerCase().includes(searchInput) ||
    notification.description.toLowerCase().includes(searchInput)
  );

  currentPage = 1; // Reset to the first page
  notificationsData = filteredNotifications;
  displayCurrentPageNotifications();
}

document.getElementById("searchInput").addEventListener("input", displayNotifications);

function listenForNotifications(uid) {
  const alertsRef = collection(db, `companies/${uid}/busalerts`);
  onSnapshot(alertsRef, (snapshot) => {
    notificationsData = snapshot.docs.map(doc => {
      const data = doc.data();
      const notifdate = new Date(`${data.date.toDate()}`);
      const formatteddate = notifdate.toLocaleString('en-US', options);
      return {
        busnumber: data.busnumber,
        description: data.description,
        emergency: data.emergency,
        responded: data.responded || false,
        date: formatteddate,
        rawDate: notifdate, // Keep raw date for sorting
        id: doc.id
      };
    });

    // Sort notifications by rawDate (most recent first)
    notificationsData.sort((a, b) => b.rawDate - a.rawDate);

    currentPage = 1; // Reset to the first page
    displayCurrentPageNotifications();
  });
}

document.getElementById("sendResponseBtn").addEventListener("click", async () => {
  const responseText = document.getElementById("responseText").value;

  // Check if the selected notification is defined and has required properties
  if (!selectedNotification) {
    console.error("No selected notification found.");
    return;
  }

  const { busnumber, id: notificationId } = selectedNotification;
  const userDocRef = doc(db, "companies", userId); // Assuming `userId` is already set

  // Debugging output to check variable values
  console.log("Selected Notification:", selectedNotification);
  console.log("userId:", userId);
  console.log("busnumber:", busnumber);
  console.log("notificationId:", notificationId);

  if (!userId || !busnumber || !notificationId) {
    console.error("One or more required parameters are missing.");
    Swal.fire({
      title: "Error",
      text: "Could not send response due to missing information.",
      icon: "error",
    });
    return;
  }

  // Reference to the responses collection
  const responseRef = doc(db, `companies/${userId}/buses/${busnumber}/responses`, notificationId);
  const busref = doc(db, `companies/${userId}/buses`, busnumber);
  console.log(busref);

  try {
    // Send response to Firebase
    await setDoc(responseRef, { response: responseText, respondedAt: new Date() });
    await updateDoc(busref, {
      latest_response: responseText
    });

    // Update the notification as responded
    await updateDoc(doc(db, `companies/${userId}/busalerts`, notificationId), { responded: true });

    // Clear response text and close modal
    document.getElementById("responseText").value = "";
    bootstrap.Modal.getInstance(document.getElementById("responseModal")).hide();

    Swal.fire({
      title: "Response Sent",
      text: "Your response has been sent successfully.",
      icon: "success",
    });
    addtosystemlogs(userId, busnumber);
  } catch (error) {
    console.error("Error sending response:", error);
    Swal.fire({
      title: "Error",
      text: "There was an error sending the response.",
      icon: "error",
    });
  }
});


document.getElementById("pendingNotifications").addEventListener("click", (event) => {
  const respondBtn = event.target.closest("button");
  if (respondBtn && respondBtn.dataset.id) {
    selectedNotification = notificationsData.find(notification => notification.id === respondBtn.dataset.id);
  }
});

document.getElementById("searchInput").addEventListener("input", displayNotifications);

async function addtosystemlogs(uid, busnum) {
  console.log('System logs function');
  try {
    // Create a reference to a new document in the 'systemlogs' collection
    const logRef = doc(collection(db, `companies/${uid}/systemlogs`));
    
    await setDoc(logRef, {
      log: `You responded to (${busnum})'s emergency`,
      date: Date()
    });
    console.log("A new system log was added");

    showNotification('System Log', {
      body: `You responded to (${busnum})'s emergency`,
      icon: '/logo'
    });
  } catch (error) {
    console.log(error);
  }
}

function showNotification(title, options) {
  if (Notification.permission === "granted") {
    new Notification(title, options).addEventListener('click', ()=>{
      window.location.assign('/systemlogs');
    });
  }
}
