import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
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

let busnotifications = [];
let inspectionnotifs = [];
let userId;

// Pagination settings
const itemsPerPage = 10;
let busCurrentPage = 1;
let inspectionCurrentPage = 1;

const options = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true, // Ensures 12-hour clock with am/pm
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    getcompanynotifications(user.uid);
    console.log(`User is logged in: ${user.uid}`);
  } else {
    console.log("User is not logged in");
  }
});

// Fetch notifications
async function getcompanynotifications(uid) {
  try {
    const busnotifref = collection(db, `companies/${uid}/busnotifications`);
    const inspectionnotifsref = collection(db, `companies/${uid}/inspectionalerts`);

    onSnapshot(busnotifref, async (docsnapshot) => {
      busnotifications = docsnapshot.docs.map((doc) => {
        const notifdata = doc.data();
        return {
          notif: notifdata.notification,
          date: notifdata.dateNtime,
        };
      });
      busCurrentPage = 1; // Reset pagination to the first page
      displayCurrentPageBusNotifications();
    });

    onSnapshot(inspectionnotifsref, async (insnapshot) => {
      inspectionnotifs = insnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          busnum: data.busnumber,
          context: data.context,
          reason: data.reason,
          validation: data.validation,
          date: data.datetime,
        };
      });
      inspectionCurrentPage = 1; // Reset pagination to the first page
      displayCurrentPageInspectionNotifications();
    });
  } catch (error) {
    console.log(error);
  }
}

// Logout functionality
document.querySelector("#logout").addEventListener("click", logout);

async function logout() {
  const userDocRef = doc(db, "companies", userId);
  await updateDoc(userDocRef, { status: "offline" });
  await signOut(auth);
  Swal.fire("Ilugan", "Log out successful", "success").then(() => location.assign("/login"));
}

// Display paginated bus notifications
function displayCurrentPageBusNotifications() {
  const busnotifdiv = document.getElementById("busnotifications");
  busnotifdiv.innerHTML = "";

  const start = (busCurrentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedBusNotifications = busnotifications.slice(start, end);

  paginatedBusNotifications.forEach(({ notif, date }) => displaybusnotifs(notif, date));

  updateBusPaginationControls();
}

// Display paginated inspection notifications
function displayCurrentPageInspectionNotifications() {
  const insnotifdiv = document.getElementById("inspectionnotifications");
  insnotifdiv.innerHTML = "";

  const start = (inspectionCurrentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedInspectionNotifications = inspectionnotifs.slice(start, end);

  paginatedInspectionNotifications.forEach(({ busnum, context, reason, validation, date }) =>
    displayinsnotifs(busnum, context, reason, validation, date)
  );

  updateInspectionPaginationControls();
}

// Update pagination controls for bus notifications
function updateBusPaginationControls() {
  const totalPages = Math.ceil(busnotifications.length / itemsPerPage);
  const paginationContainer = document.getElementById("busPagination");
  paginationContainer.innerHTML = `
    <li class="page-item ${busCurrentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="previousBusPage()">Previous</a>
    </li>
    ${Array.from({ length: totalPages }, (_, i) =>
      `<li class="page-item ${busCurrentPage === i + 1 ? "active" : ""}">
        <a class="page-link" href="#" onclick="goToBusPage(${i + 1})">${i + 1}</a>
      </li>`
    ).join("")}
    <li class="page-item ${busCurrentPage === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="nextBusPage()">Next</a>
    </li>
  `;
}

// Update pagination controls for inspection notifications
function updateInspectionPaginationControls() {
  const totalPages = Math.ceil(inspectionnotifs.length / itemsPerPage);
  const paginationContainer = document.getElementById("inspectionPagination");
  paginationContainer.innerHTML = `
    <li class="page-item ${inspectionCurrentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="previousInspectionPage()">Previous</a>
    </li>
    ${Array.from({ length: totalPages }, (_, i) =>
      `<li class="page-item ${inspectionCurrentPage === i + 1 ? "active" : ""}">
        <a class="page-link" href="#" onclick="goToInspectionPage(${i + 1})">${i + 1}</a>
      </li>`
    ).join("")}
    <li class="page-item ${inspectionCurrentPage === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="nextInspectionPage()">Next</a>
    </li>
  `;
}

// Pagination navigation functions for bus notifications
function goToBusPage(page) {
  busCurrentPage = page;
  displayCurrentPageBusNotifications();
}

function nextBusPage() {
  const totalPages = Math.ceil(busnotifications.length / itemsPerPage);
  if (busCurrentPage < totalPages) {
    busCurrentPage++;
    displayCurrentPageBusNotifications();
  }
}

function previousBusPage() {
  if (busCurrentPage > 1) {
    busCurrentPage--;
    displayCurrentPageBusNotifications();
  }
}

// Pagination navigation functions for inspection notifications
function goToInspectionPage(page) {
  inspectionCurrentPage = page;
  displayCurrentPageInspectionNotifications();
}

function nextInspectionPage() {
  const totalPages = Math.ceil(inspectionnotifs.length / itemsPerPage);
  if (inspectionCurrentPage < totalPages) {
    inspectionCurrentPage++;
    displayCurrentPageInspectionNotifications();
  }
}

function previousInspectionPage() {
  if (inspectionCurrentPage > 1) {
    inspectionCurrentPage--;
    displayCurrentPageInspectionNotifications();
  }
}

// Expose functions for pagination controls to global scope
window.goToBusPage = goToBusPage;
window.nextBusPage = nextBusPage;
window.previousBusPage = previousBusPage;
window.goToInspectionPage = goToInspectionPage;
window.nextInspectionPage = nextInspectionPage;
window.previousInspectionPage = previousInspectionPage;

// Notification display functions
async function displaybusnotifs(notif, date) {
  const busnotifdiv = document.getElementById("busnotifications");
  const notificationelement = document.createElement("div");
  notificationelement.className = "busnotif";

  const formatteddate = new Date(date).toLocaleString("en-US", options);

  notificationelement.innerHTML = `
    <i class="fas fa-bus" style="margin-left: 10px;"></i>
    <div id="notifdiv">
      <strong style="text-transform: uppercase;">${notif}</strong><br>
      <small>${formatteddate}</small>
    </div>
  `;

  busnotifdiv.appendChild(notificationelement);
}

async function displayinsnotifs(busnum, id, reason, validation, date) {
  const formattedDate = date
    ? new Date(date.toDate()).toLocaleString("en-US", options)
    : new Date().toLocaleString("en-US", options);

  const insnotifdiv = document.getElementById("inspectionnotifications");
  const insnotif = document.createElement("div");
  insnotif.className = "inspectionotif";

  const icon = validation === "passed"
    ? '<i class="fas fa-thumbs-up" style="margin-left: 10px;"></i>'
    : '<i class="fas fa-thumbs-down" style="margin-left: 10px;"></i>';

  insnotif.innerHTML = `
    ${icon}
    <div id="notifdiv">
      <strong style="text-transform: uppercase;">${busnum} - ${id}</strong><br>
      <p>Result: ${validation}</p><br>
      <p>${reason || ""}</p><br>
      <p>${formattedDate}</p>
    </div>
  `;

  insnotifdiv.appendChild(insnotif);
}
