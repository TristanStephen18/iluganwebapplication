import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase config
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

let userId;

// DOM elements
const busFilter = document.getElementById("busFilter");
// const fromDateInput = document.createElement("input");
// fromDateInput.type = "date";
// fromDateInput.id = "fromDate";
// fromDateInput.style.marginRight = "10px";
const fromDateInput = document.getElementById('fromDate');
const toDateInput = document.getElementById('toDate');

// const toDateInput = document.createElement("input");
// toDateInput.type = "date";
// toDateInput.id = "toDate";

// const filterContainer = document.getElementById("optionholder");
// filterContainer.appendChild(fromDateInput);
// filterContainer.appendChild(toDateInput);

const tableBody = document.getElementById("reservations");
let reservationsData = []; // To hold fetched data for pagination and filtering

// Authenticate and fetch data
onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    displayReservations(userId);
  } else {
    console.log("User is not logged in");
    // window.location.assign('/login');
  }
});

// Logout functionality
const logoutbtn = document.querySelector("#logout");
logoutbtn.addEventListener("click", () => {
  logout();
});

async function logout() {
  const userDocRef = doc(db, "companies", userId);
  signOut(auth)
    .then(() => {
      Swal.fire({
        title: "Ilugan",
        text: "Log out successful",
        icon: "success",
      }).then(async () => {
        await updateDoc(userDocRef, { status: 'offline' });
        location.assign("/login");
      });
    })
    .catch((error) => {
      Swal.fire({
        title: "ERROR!!!",
        text: error.message,
        icon: "error",
      });
    });
}

// Fetch and display reservations
async function displayReservations(uid) {
  try {
    const busesCollection = collection(db, `companies/${uid}/buses`);
    const querySnapshot = await getDocs(busesCollection);

    // Populate the dropdown with bus numbers
    querySnapshot.docs.forEach((doc) => {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = doc.id;
      busFilter.appendChild(option);
    });

    // Fetch reservations for all buses
    for (const busDoc of querySnapshot.docs) {
      const reservationsCollection = collection(db, `companies/${uid}/buses/${busDoc.id}/reservations`);
      const reservationSnapshot = await getDocs(reservationsCollection);

      reservationSnapshot.docs.forEach((reservationDoc) => {
        const data = reservationDoc.data();
        const datetime = new Date(data.date_time.seconds * 1000);
        const formattedDateTime = datetime.toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        });

        reservationsData.push({
          id: reservationDoc.id,
          busNumber: busDoc.id,
          datetime,
          formattedDateTime,
          from: data.from,
          to: data.to,
          seats: data.seats_reserved,
          type: data.type || "Regular",
          amount: data.amount,
          status: data.accomplished ? "Scanned" : "Pending",
        });
      });
    }

    renderTable(reservationsData);
  } catch (error) {
    console.error(error);
  }
}

// Render table with pagination
let currentPage = 1;
const rowsPerPage = 15;

// Render table with pagination
function renderTable(data) {
  tableBody.innerHTML = "";

  // Pagination
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = data.slice(start, end);

  paginatedData.forEach((reservation) => {
    const limitedFrom = reservation.from.length > 20 
      ? reservation.from.substring(0, 20) + "..." 
      : reservation.from;

    const limitedTo = reservation.to.length > 20 
      ? reservation.to.substring(0, 20) + "..." 
      : reservation.to;

    const row = `
      <tr data-bus-number="${reservation.busNumber}">
        <td>${reservation.id}</td>
        <td>${reservation.busNumber}</td>
        <td>${reservation.formattedDateTime}</td>
        <td title="${reservation.from}">${limitedFrom}</td>
        <td title="${reservation.to}">${limitedTo}</td>
        <td>${reservation.seats}</td>
        <td>${reservation.type}</td>
        <td>${reservation.amount}</td>
        <td>${reservation.status}</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML('beforeend', row);
  });

  renderPagination(data.length);
}


// Render pagination controls
function renderPagination(totalRows) {
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginationContainer = document.getElementById("pagination") || document.createElement("div");
  paginationContainer.id = "pagination";
  paginationContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.className = "btn btn-secondary btn-sm m-1";
    button.disabled = i === currentPage;
    button.addEventListener("click", () => {
      currentPage = i;
      renderTable(filteredReservations());
    });
    paginationContainer.appendChild(button);
  }

  tableBody.parentElement.appendChild(paginationContainer);
}

// Filter reservations based on bus number and date range
function filteredReservations() {
  const selectedBus = busFilter.value;
  const fromDate = fromDateInput.value ? new Date(fromDateInput.value) : null;
  const toDate = toDateInput.value ? new Date(toDateInput.value) : null;

  return reservationsData.filter((reservation) => {
    const matchesBus = !selectedBus || reservation.busNumber === selectedBus;
    const matchesDate = (!fromDate || reservation.datetime >= fromDate) &&
      (!toDate || reservation.datetime <= toDate);

    return matchesBus && matchesDate;
  });
}

// Event listeners for filters
busFilter.addEventListener("change", () => {
  currentPage = 1;
  renderTable(filteredReservations());
});

fromDateInput.addEventListener("change", () => {
  currentPage = 1;
  renderTable(filteredReservations());
});

toDateInput.addEventListener("change", () => {
  currentPage = 1;
  renderTable(filteredReservations());
});

// Back button
document.getElementById('backbutton').addEventListener('click', () => {
  window.location.assign('/reservations');
});
