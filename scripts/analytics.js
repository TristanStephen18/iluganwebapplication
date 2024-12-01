import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
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

// Check if the user is authenticated
onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    // if(user.emailVerified){
    //   console.log('email is verified');
    // }else{
    //   console.log('email is not verified');
    //   sendEmailVerification(user)
    //     .then(() => {
    //       console.log("Verification email sent!");
    //       alert("A verification email has been sent to your inbox.");
    //     })
    //     .catch((error) => {
    //       console.error("Error sending verification email:", error.message);
    //     });
    // }
    listenForBuses();
  } else {
    console.log("User is not signed in");
    // window.location.assign('/login');
  }
});

// Logout functionality
document.querySelector("#logout").addEventListener("click", logout);

async function logout() {
  const userDocRef = doc(db, "companies", userId);
  signOut(auth)
    .then(() => {
      Swal.fire({
        title: "Ilugan",
        text: "Log out successful",
        icon: "success",
      }).then(async (result) => {
        await updateDoc(userDocRef, { status: "offline" });
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

// Real-time listener for buses and populate the dropdown
function listenForBuses() {
  const busesRef = collection(db, `companies/${userId}/buses`);
  onSnapshot(busesRef, async (snapshot) => {
    const buses = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
    populateBusDropdown(buses);

    if (buses.length > 0) {
      const firstBusId = buses[0].id;
      listenForDateChanges(firstBusId); // Initial date listener for the first bus
      renderTotalRevenueChart(firstBusId); // Initial chart render for the first bus
      setupReservationChart(firstBusId); // Real-time reservation chart setup
    }
  });
}

// Populate the bus dropdown
function populateBusDropdown(buses) {
  const busSelect = document.getElementById("busSelect");
  busSelect.innerHTML = "";
  buses.forEach((bus) => {
    const option = document.createElement("option");
    option.value = bus.id;
    option.textContent = bus.name || `Bus ${bus.id}`;
    busSelect.appendChild(option);
  });
}

// Real-time listener for date changes within a bus
function listenForDateChanges(busId) {
  const dataRef = collection(db, `companies/${userId}/buses/${busId}/data`);
  onSnapshot(dataRef, (snapshot) => {
    // Extract and sort the dates in descending order
    const dates = snapshot.docs
      .map((doc) => doc.id)
      .sort((a, b) => new Date(b) - new Date(a));
    console.log("Sorted Dates:", dates);

    populateDateFilter(dates);

    if (dates.length > 0) {
      setupPassengerChart(busId, dates[0]); // Initial passenger chart for the most recent date
    }
  });
}

// Populate the date dropdown
function populateDateFilter(dates) {
  const dateFilter = document.getElementById("datefilter");
  dateFilter.innerHTML = "";
  dates.forEach((date) => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = date;
    dateFilter.appendChild(option);
  });
}

// Real-time Revenue Chart
function renderTotalRevenueChart(busId) {
  const dataRef = collection(db, `companies/${userId}/buses/${busId}/data`);
  onSnapshot(dataRef, (snapshot) => {
    const data = [];

    // Combine the date and revenue into an array of objects
    snapshot.forEach((doc) => {
      data.push({ date: doc.id, revenue: doc.data().total_income || 0 });
    });

    // Sort the data by date in descending order
    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Extract sorted dates and revenues
    const dateLabels = data.map((item) => item.date);
    const revenueData = data.map((item) => item.revenue);

    const ctx = document.getElementById("totalRevenueChart").getContext("2d");

    if (totalRevenueChart) totalRevenueChart.destroy();

    totalRevenueChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: dateLabels,
        datasets: [
          {
            label: "Total Revenue",
            data: revenueData,
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
  });
}


// Real-time Reservation Chart
function setupReservationChart(busId) {
  const reservationRef = doc(db, `companies/${userId}/buses/${busId}`);
  onSnapshot(reservationRef, (snapshot) => {
    const data = snapshot.data();
    if (data) {
      const { occupied_seats, available_seats } = data;
      const ctx = document.getElementById("reservationChart");

      if (reservationChart) reservationChart.destroy();

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

// Real-time Passenger Chart
function setupPassengerChart(busId, date) {
  const passengerRef = doc(
    db,
    `companies/${userId}/buses/${busId}/data/${date}`
  );
  onSnapshot(passengerRef, (snapshot) => {
    if (snapshot.exists()) {
      const { total_passengers, total_reservations } = snapshot.data();
      const walkIn = total_passengers - total_reservations;
      const ctx = document.getElementById("passengerChart");

      if (passengerChart) passengerChart.destroy();

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
  });
}

// Event listeners for UI interactions
document.getElementById("busSelect").addEventListener("change", (event) => {
  const busId = event.target.value;
  listenForDateChanges(busId);
  renderTotalRevenueChart(busId);
  setupReservationChart(busId);
});

document.getElementById("datefilter").addEventListener("change", (event) => {
  const busId = document.getElementById("busSelect").value;
  const date = event.target.value;
  setupPassengerChart(busId, date);
});
