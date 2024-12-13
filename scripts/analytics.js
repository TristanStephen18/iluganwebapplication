import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  updateDoc
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

let userId = null;
let totalRevenueChart, reservationChart, passengerChart;
const fromDateInput = document.getElementById('fromdate');
const toDateInput = document.getElementById('todate');
fromDateInput.value = "2024-10-01";
toDateInput.value = "2024-12-25";
const initialfromdate = fromDateInput.value;
const initialtodate = toDateInput.value;
let busid;

// Check if the user is authenticated
onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId = user.uid;
    await populateBusDropdown();
    // renderInitialChart();
  } else {
    console.log("User is not signed in");
  }
});

const logoutbtn = document.querySelector("#logout");
console.log(logoutbtn);
logoutbtn.addEventListener("click", () => {
  console.log("Clicked logout btn");
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
      }).then(async (result)=>{
        await updateDoc(userDocRef, {status: 'offline'});
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

// Fetch buses and populate the dropdown
async function populateBusDropdown() {
  const buses = await fetchBusData();
  console.log(buses);
  const busSelect = document.getElementById("busSelect");
  busSelect.innerHTML = "";
  buses.forEach((bus) => {
    const option = document.createElement("option");
    option.value = bus.id;
    option.textContent = `${bus.id}`;
    busSelect.appendChild(option);
  });
  if (busSelect.options.length > 0) {
    busid = busSelect.options[0].value;
    await updateDateFilter(busSelect.value); // Populate date filter initially
    renderTotalRevenueChart(busSelect.options[0].value, initialfromdate, initialtodate); // Render revenue chart for first bus
    setupReservationChart(busSelect.options[0].value);
    // setupPassengerChart()
  }
}

// Fetch bus data for dropdown population
async function fetchBusData() {
  const busesRef = collection(db, `companies/${userId}/buses`);
  const busDocs = await getDocs(busesRef);
  return busDocs.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));
}

// Populate the date filter for a selected bus
async function updateDateFilter(busId) {
  const dataRef = collection(db, `companies/${userId}/buses/${busId}/data`);
  const dataDocs = await getDocs(dataRef);
  const dateFilter = document.getElementById("datefilter");
  dateFilter.innerHTML = "";
  dataDocs.forEach((doc) => {
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = doc.id;
    dateFilter.appendChild(option);
  });

  if (dateFilter.options.length > 0) {
    setupPassengerChart(busId, dateFilter.options[0].value);
  }
}

// Render Total Revenue Chart
// async function renderTotalRevenueChart(busId) {
//   const { revenueData, dateLabels } = await fetchWeeklyRevenueData(busId);
//   const ctx = document.getElementById("totalRevenueChart").getContext("2d");
//   if (totalRevenueChart) totalRevenueChart.destroy();
//   totalRevenueChart = new Chart(ctx, {
//     type: "line",
//     data: {
//       labels: dateLabels,
//       datasets: [{
//         label: "Total Revenue",
//         data: revenueData,
//         backgroundColor: "rgba(75, 192, 192, 0.2)",
//         borderColor: "rgba(75, 192, 192, 1)",
//         borderWidth: 2,
//       }],
//     },
//     options: {
//         responsive: true,
//         maintainAspectRatio: false,
//       scales: {
//         y: { beginAtZero: true, title: { display: true, text: "Revenue (PHP)" } },
//         x: { title: { display: true, text: "Date" } },
//       },
//     },
//   });
// }

// Fetch weekly revenue data
async function fetchWeeklyRevenueData(busId) {
  const dataRef = collection(db, `companies/${userId}/buses/${busId}/data`);
  const dataDocs = await getDocs(dataRef);
  const revenueData = [],
    dateLabels = [];
  dataDocs.forEach((doc) => {
    dateLabels.push(doc.id);
    revenueData.push(doc.data().total_income || 0);
  });
  return { revenueData, dateLabels };
}

// Real-time Reservation Chart update
// Render Total Revenue Chart
async function renderTotalRevenueChart(busId, fromDate, toDate) {
  const dataRef = collection(db, `companies/${userId}/buses/${busId}/data`);

  try {
    // Fetch all revenue data from Firestore
    const snapshot = await getDocs(dataRef);

    // Extract raw data
    const rawData = snapshot.docs.map((doc) => ({
      date: doc.id, // Firestore document ID (assumed to be the date)
      revenue: doc.data().total_income || 0,
    }));

    // Convert Firestore document IDs to Date objects and filter based on the provided date range
    const filteredData = rawData
      .map((item) => ({
        ...item,
        dateObj: new Date(item.date), // Convert Firestore date strings to Date objects
      }))
      .filter((item) => {
        const date = item.dateObj;
        return (
          (!fromDate || date >= new Date(fromDate)) &&
          (!toDate || date <= new Date(toDate))
        );
      });

    // Sort the filtered data by date (ascending)
    const sortedData = filteredData.sort((a, b) => b.dateObj - a.dateObj);

    // Extract sorted dates and revenues
    const sortedDateLabels = sortedData.map((item) =>
      formatDate(item.dateObj)
    );
    const sortedRevenueData = sortedData.map((item) => item.revenue);

    // Get the chart context
    const ctx = document.getElementById("totalRevenueChart").getContext("2d");

    // Destroy existing chart if it exists
    if (totalRevenueChart) {
      totalRevenueChart.destroy();
    }

    // Render the new chart with filtered and sorted data
    totalRevenueChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: sortedDateLabels, // Filtered and sorted date labels
        datasets: [
          {
            label: "Total Revenue",
            data: sortedRevenueData, // Filtered and sorted revenues
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Revenue (PHP)" },
          },
          x: { title: { display: true, text: "Date" } },
        },
      },
    });
  } catch (error) {
    console.error("Error rendering revenue chart:", error);
  }
}


// Real-time Reservation Chart update
async function setupReservationChart(busId) {
  const reservationRef = doc(db, `companies/${userId}/buses/${busId}`);
  onSnapshot(reservationRef, (snapshot) => {
    const data = snapshot.data();
    if (data) {
      const { occupied_seats, available_seats } = data;
      const ctx = document.getElementById("reservationChart");

      if (reservationChart) {
        reservationChart.destroy();
        reservationChart = null;
        console.log("chart destroyed");
      }

      reservationChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: ["Occupied", "Available"],
          datasets: [
            {
              data: [occupied_seats, available_seats],
              backgroundColor: ["#29924F", "#e0e0e0"],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    }
  });
}


function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

fromDateInput.addEventListener('change', ()=>{
  renderTotalRevenueChart(busid, fromDateInput.value, toDateInput.value);
});

toDateInput.addEventListener('change', ()=>{
  renderTotalRevenueChart(busid, fromDateInput.value, toDateInput.value);
});


// Passenger Chart Update
async function setupPassengerChart(busId, date) {
  const passengerRef = doc(
    db,
    `companies/${userId}/buses/${busId}/data/${date}`
  );
  const snapshot = await getDoc(passengerRef);
  if (snapshot.exists()) {
    const { total_passengers, total_reservations } = snapshot.data();
    const walkIn = total_passengers - total_reservations;
    const ctx = document.getElementById("passengerChart");

    if (passengerChart) {
      passengerChart.destroy();
      passengerChart = null;
    }

    passengerChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Online", "Walk-in"],
        datasets: [
          {
            data: [total_reservations, walkIn],
            backgroundColor: ["#29924F", "#f39c12"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
}

// Event listeners for UI interactions
document
  .getElementById("busSelect")
  .addEventListener("change", async (event) => {
    const busId = event.target.value;
    busid = busId;
    await updateDateFilter(busId);
    renderTotalRevenueChart(busId, fromDateInput.value, toDateInput.value);
    setupReservationChart(busId);
    setupPassengerChart(busId);
  });

document
  .getElementById("datefilter")
  .addEventListener("change", async (event) => {
    const busId = document.getElementById("busSelect").value;
    const date = event.target.value;
    setupPassengerChart(busId, date);
  });