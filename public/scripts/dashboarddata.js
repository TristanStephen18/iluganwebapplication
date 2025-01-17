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
  updateDoc,
  onSnapshot,
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

let terminalLat;
let terminalLng;
let companyId;
let logincounter;

const optionsDate = {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
};

const optionsTime = {
  hour: 'numeric',
  minute: 'numeric',
  hour12: true // 12-hour format
};
function updateDateTime() {
  const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
  const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

  const datenow = new Date();
  const formattedDate = datenow.toLocaleDateString('en-US', optionsDate);
  const formattedTime = datenow.toLocaleTimeString('en-US', optionsTime);

  const finalFormattedDate = `${formattedDate}, ${formattedTime}`;
  
  // Update the element where you want to display the date and time
  document.getElementById('datenow').textContent = finalFormattedDate;
}

setInterval(updateDateTime, 1000);

const logoutbtn = document.querySelector("#logout");
console.log(logoutbtn);
logoutbtn.addEventListener("click", () => {
  console.log("Clicked logout btn");
  logout();
});

async function logout() {
  const userDocRef = doc(db, "companies", companyId);
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

async function getCompanyData(uid) {
  // const loadingModal = new bootstrap.Modal(
  //   document.getElementById("loadingModal")
  // );
  // loadingModal.show();
  const displaydatap = document.querySelector("#tpassenger");
  const displaydatar = document.querySelector("#treservation");

  // console.log(displaydatap.innerHTML);
  console.log(uid);
  try {
    const companycollection = collection(db, `companies/${uid}/data`);

    console.log(companycollection);

    onSnapshot(companycollection, (snapshot) => {
      console.log(snapshot);
      let totalpassengers = 0;
      let totalreservations = 0;

      if (snapshot.empty) {
        // loadingModal.hide();
        console.log("Collection is empty");
      } else {
        snapshot.forEach((doc) => {
          const data = doc.data();
          // console.log(data.total_passengers);
          totalpassengers = totalpassengers + data.total_passengers;
          totalreservations = totalreservations + data.total_reservation;
          console.log(data.total_reservation);

          // console.log(doc.data());
        });
      }

      // console.log(snapshot.doc);
      console.log("Total passenger: " + totalpassengers);
      console.log("Total reservations: " + totalreservations);
      displaydatap.innerHTML = `${totalpassengers}`;
      displaydatar.innerHTML = `${totalreservations}`;
    });
  } catch (error) {
    console.log(error);
  }
}

const compname = document.querySelector("#cname");
async function getcompanyname(uid) {
  try {
    const companyDocRef = doc(db, "companies", uid);
    const companyDocSnap = await getDoc(companyDocRef);

    console.log(companyDocSnap.data());
    logincounter = companyDocSnap.data().logincounter;
    console.log(`Login times: ${logincounter}`);
    compname.innerHTML = `${companyDocSnap.data().company_name}`;
  } catch (error) {
    console.log(error);
  }
}

async function getnumberofbuses(uid) {
  const busesdisaplyer = document.querySelector("#nbuses");
  console.log(busesdisaplyer.innerHTML);
  let numberofbuses = 0;
  const busescollection = collection(db, `companies/${uid}/buses`);
  try {
    onSnapshot(busescollection, (snapshot) => {
      if (snapshot.empty) {
        numberofbuses = 0;
      } else {
        console.log(snapshot.size);
        numberofbuses = snapshot.size;
      }

      busesdisaplyer.innerHTML = `${numberofbuses}`;
    });
  } catch (error) {
    console.log(error);
  }
}

async function getnumberofconductors(uid) {
  let conumcount = 0;
  let insnumcount = 0;
  const insnum = document.querySelector("#insnum");
  const connum = document.querySelector("#connum");
  //   console.log(busesdisaplyer.innerHTML);
  let numberofbuses = 0;
  const employeescollection = collection(db, `companies/${uid}/employees`);
  try {
    onSnapshot(employeescollection, (snapshot) => {
      console.log(snapshot.size);

      snapshot.forEach((doc) => {
        console.log(doc.data());

        if (doc.data().type == "conductor") {
          conumcount = conumcount + 1;
        } else {
          insnumcount = insnumcount + 1;
        }
      });
      //   numberofbuses = snapshot.size;

      //   busesdisaplyer.innerHTML = `${numberofbuses}`;
      connum.innerHTML = `Conductors: ${conumcount}`;
      insnum.innerHTML = `Inspectors: ${insnumcount}`;
    });
  } catch (error) {
    console.log(error);
  }
}

function requestNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Notification permission granted.");
      } else {
        console.log("Notification permission denied.");
      }
    });
  } else {
    console.log("Browser does not support notifications.");
  }
}


// requestNotificationPermission();

async function checkuser() {
  requestNotificationPermission();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      companyId = user.uid;
      console.log("User is logged in:", user.uid);
      // getTerminalCoordinates(user.uid);
      getCompanyData(user.uid);
      getnumberofbuses(user.uid);
      // getnumberofconductors(user.uid);
      getcompanyname(user.uid);
      // document.getElementById('datenow').innerHTML = `${finalFormattedDate}`;
      
      // Initial data plot based on the current filter value
      initializeDefaultGraph();
      
      // Rest of your code here...

    } else {
      console.log("No user is signed in.");
      // location.assign("/login");
    }
  });
}

function initializeDefaultGraph() {
  const defaultFromDate = "2024-10-01";
  const defaultToDate = "2024-12-25";
  plotCompanyData(defaultFromDate, defaultToDate);
}

// async function getterminalLocation(uid) {
//   try{
//     const companydoc = doc(db, `companies/${uid}`);
//     const snapshot = await getDoc(companydoc);
//     console.log(snapshot);
//   }catch (error){
//     console.log(error);
//   }
// }

// The showNotification, logout, and other utility functions go here...

const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");

// Update the graph when either date picker value changes
fromDateInput.addEventListener("change", updateGraph);
toDateInput.addEventListener("change", updateGraph);

let passengerChart;
let incomeChart;

fromDateInput.value = "2023-10-01";
toDateInput.value = "2023-12-25";

// Function to fetch and plot data based on the selected date range
async function plotCompanyData(fromDate, toDate) {
  const dataRef = collection(db, `companies/${companyId}/data`);

  try {
    const snapshot = await getDocs(dataRef);

    const rawData = [];
    snapshot.forEach((doc) => {
      rawData.push({
        date: doc.id,
        passengers: doc.data().total_passengers || 0,
        income: doc.data().total_income || 0,
      });
    });

    // Convert raw data to JavaScript Date objects for filtering
    rawData.forEach((item) => {
      item.dateObj = new Date(item.date); // Assuming the date is in ISO format
    });

    // Filter data based on the selected date range
    const filteredData = rawData.filter((item) => {
      const date = item.dateObj;
      return (
        (!fromDate || date >= new Date(fromDate)) &&
        (!toDate || date <= new Date(toDate))
      );
    });

    const filteredDates = filteredData.map((item) => item.date);
    const filteredPassengers = filteredData.map((item) => item.passengers);
    const filteredIncome = filteredData.map((item) => item.income);

    // Clear previous charts if they exist
    if (passengerChart) passengerChart.destroy();
    if (incomeChart) incomeChart.destroy();

    // Plot Passenger Chart
    const passengerCtx = document.getElementById("passengerChart");
    passengerChart = new Chart(passengerCtx, {
      type: "line",
      data: {
        labels: filteredDates,
        datasets: [
          {
            label: "Total Passengers",
            data: filteredPassengers,
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          x: { beginAtZero: true },
          y: { beginAtZero: true },
        },
      },
    });

    // Plot Income Chart
    const incomeCtx = document.getElementById("incomeChart");
    incomeChart = new Chart(incomeCtx, {
      type: "line",
      data: {
        labels: filteredDates,
        datasets: [
          {
            label: "Total Income",
            data: filteredIncome,
            backgroundColor: "rgba(153, 102, 255, 0.2)",
            borderColor: "rgba(153, 102, 255, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          x: { beginAtZero: true },
          y: { beginAtZero: true },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching company data:", error);
  }
}

// Function to update the graph based on the selected date range
function updateGraph() {
  const fromDate = fromDateInput.value;
  const toDate = toDateInput.value;
  plotCompanyData(fromDate, toDate);
}

// Initialize the app
checkuser();


document.getElementById('totracker').addEventListener('click', ()=>{
  window.location.assign('/tracker');
});