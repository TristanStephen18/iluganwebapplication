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

// import {sample} from "/models";

// sample();
// import { checkForNewBusAlerts } from "../scripts/alerts";

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
const filter = document.querySelector("#timeFilter");

// console.log(filter.value);

// filter.addEventListener('onchange', ()=>{
//     // plotCompanyData(filter.value);
// });

function requestNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Notification permission granted.");
        // You can show a welcome notification here if desired
        // showNotification("hello", {
        //       body: "You have a new message!",
        //     });
      } else {
        console.log("Notification permission denied.");
      }
    });
  } else {
    console.log("Browser does not support notifications.");
  }
}

async function checkuser() {
  requestNotificationPermission();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is logged in:", user.uid);
      getTerminalCoordinates(user.uid);
      getCompanyData(user.uid);
      getnumberofbuses(user.uid);
      getnumberofconductors(user.uid);
      getcompanyname(user.uid);
      // plotCompanyData(user.uid);

      companyId = user.uid;
      plotCompanyData(filter.value);
      try {
        const companyDocRef = doc(db, "companies", user.uid);
        const companyDocSnap = await getDoc(companyDocRef);

        if (companyDocSnap.exists()) {
          const companyData = companyDocSnap.data();
          const notificationsCount = companyData.notifications || 0;

          // Reference to the busalerts subcollection
          const busAlertsRef = collection(
            db,
            "companies",
            user.uid,
            "busalerts"
          );

          // Set up a real-time listener on the busalerts collection
          onSnapshot(busAlertsRef, async (snapshot) => {
            const busAlertsCount = snapshot.size; // Number of bus alerts

            // Compare with the stored notifications count
            if (busAlertsCount > notificationsCount) {
              console.log("New bus alert detected!");

              // Display a notification if there are new bus alerts
              showNotification("New Bus Alert", {
                body: "You have new bus alerts! Check your alerts.",
                icon: "/path/to/icon.png",
              });

              // Update the notifications count in the company document
              await updateDoc(companyDocRef, { notifications: busAlertsCount });
            }
          });
        } else {
          console.log("No such company document for this user.");
        }
      } catch (error) {
        console.error("Error setting up bus alerts listener:", error);
      }

      try {
        // Reference to the current user's company document
        const companyDocRef = doc(db, "companies", user.uid);
        const companyDocSnap = await getDoc(companyDocRef);

        if (companyDocSnap.exists()) {
          const companyData = companyDocSnap.data();
          const notificationsCount = companyData.inspectionnotifications || 0;

          // Reference to the busalerts subcollection
          const busAlertsRef = collection(
            db,
            "companies",
            user.uid,
            "inspectionalerts"
          );

          // Set up a real-time listener on the busalerts collection
          onSnapshot(busAlertsRef, async (snapshot) => {
            const busAlertsCount = snapshot.size; // Number of bus alerts

            // Compare with the stored notifications count
            if (busAlertsCount > notificationsCount) {
              console.log("New bus alert detected!");

              // Display a notification if there are new bus alerts
              showNotification("Inspection Alert", {
                body: "A bus was inspeted",
                icon: "/path/to/icon.png",
              });

              // Update the notifications count in the company document
              await updateDoc(companyDocRef, {
                inspectionnotifications: busAlertsCount,
              });
            }
          });
        } else {
          console.log("No such company document for this user.");
        }
      } catch (error) {
        console.error("Error setting up bus alerts listener:", error);
      }
    } else {
      console.log("No user is signed in.");
      window.location.assign("/login");
    }
  });
}

function showNotification(title, options) {
  if (Notification.permission === "granted") {
    new Notification(title, options).addEventListener("click", () => {
      // window.location.assign("fleetmanagement.html");
    });
  } else {
    console.log("Notification permission not granted.");
  }
}

async function getTerminalCoordinates(uid) {
  try {
    const docRef = doc(db, "companies", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const location = docSnap.data().terminal_location;
      if (location) {
        terminalLat = location.latitude;
        terminalLng = location.longitude;
        console.log("Terminal Location:", terminalLat, terminalLng);
      } else {
        console.log("No terminal location found");
      }
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error fetching terminal location: ", error);
  }
}

const logoutbtn = document.querySelector("#logout");
console.log(logoutbtn);
logoutbtn.addEventListener("click", () => {
  console.log("Clicked logout btn");
  logout();
});

async function logout() {
  signOut(auth)
    .then(() => {
      alert("Log out successful");
      window.location.assign("/login");
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
      connum.innerHTML = `${conumcount}`;
      insnum.innerHTML = `${insnumcount}`;
    });
  } catch (error) {
    console.log(error);
  }
}

async function plotCompanyData(filter) {
  // const companyId = "1CzPhECXc8PFJQP4rfGzwW77gKp1"; // replace with actual company ID
  const dataRef = collection(db, `companies/${companyId}/data`);

  try {
    const snapshot = await getDocs(dataRef);

    // Temporary arrays for storing raw data
    const dates = [];
    const totalPassengers = [];
    const totalIncome = [];

    // Retrieve raw data
    snapshot.forEach((doc) => {
      dates.push(doc.id); // use document ID (date) for labels
      totalPassengers.push(doc.data().total_passengers || 0);
      totalIncome.push(doc.data().total_income || 0);
    });

    // Filter data based on selected filter
    const { filteredDates, filteredPassengers, filteredIncome } = filterData(
      dates,
      totalPassengers,
      totalIncome,
      filter
    );

    // Clear previous charts if they exist
    //   if (window.passengerChart) window.passengerChart.destroy();
    //   if (window.incomeChart) window.incomeChart.destroy();

    // Plot Passenger Chart
    const passengerCtx = document
      .getElementById("passengerChart");
    window.passengerChart = new Chart(passengerCtx, {
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
    window.incomeChart = new Chart(incomeCtx, {
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

// Function to filter data based on time selection
function filterData(dates, passengers, income, filter) {
  const filteredDates = [];
  const filteredPassengers = [];
  const filteredIncome = [];

  if (filter === "weekly") {
    for (let i = 0; i < dates.length; i += 7) {
      filteredDates.push(dates[i]);
      filteredPassengers.push(
        passengers.slice(i, i + 7).reduce((a, b) => a + b, 0)
      );
      filteredIncome.push(income.slice(i, i + 7).reduce((a, b) => a + b, 0));
    }
  } else if (filter === "monthly") {
    for (let i = 0; i < dates.length; i += 30) {
      filteredDates.push(dates[i]);
      filteredPassengers.push(
        passengers.slice(i, i + 30).reduce((a, b) => a + b, 0)
      );
      filteredIncome.push(income.slice(i, i + 30).reduce((a, b) => a + b, 0));
    }
  } else if (filter === "yearly") {
    for (let i = 0; i < dates.length; i += 365) {
      filteredDates.push(dates[i]);
      filteredPassengers.push(
        passengers.slice(i, i + 365).reduce((a, b) => a + b, 0)
      );
      filteredIncome.push(income.slice(i, i + 365).reduce((a, b) => a + b, 0));
    }
  }

  return { filteredDates, filteredPassengers, filteredIncome };
}

// Function to update graph based on filter selection
function updateGraph() {
  const filter = document.getElementById("timeFilter").value;
  plotCompanyData(filter);
}

// Define function to fetch and plot data
// async function plotCompanyData(companyId) {
//   const dataRef = collection(db, `companies/${companyId}/data`);

//   try {
//     const snapshot = await getDocs(dataRef);

//     const dates = [];
//     const totalPassengers = [];
//     const totalIncome = [];

//     snapshot.forEach(doc => {
//       dates.push(doc.id); // use document ID (date) for labels
//       totalPassengers.push(doc.data().total_passengers || 0);
//       totalIncome.push(doc.data().total_income || 0);
//     });

//     // Plot Passenger Chart
//     const passengerCtx = document.getElementById("passengerChart");
//     new Chart(passengerCtx, {
//       type: "line",
//       data: {
//         labels: dates,
//         datasets: [{
//           label: "Total Passengers",
//           data: totalPassengers,
//           backgroundColor: "rgba(75, 192, 192, 0.2)",
//           borderColor: "rgba(75, 192, 192, 1)",
//           borderWidth: 1
//         }]
//       },
//       options: {
//         scales: {
//           x: { beginAtZero: true },
//           y: { beginAtZero: true }
//         }
//       }
//     });

//     // Plot Income Chart
//     const incomeCtx = document.getElementById("incomeChart");
//     new Chart(incomeCtx, {
//       type: "line",
//       data: {
//         labels: dates,
//         datasets: [{
//           label: "Total Income",
//           data: totalIncome,
//           backgroundColor: "rgba(153, 102, 255, 0.2)",
//           borderColor: "rgba(153, 102, 255, 1)",
//           borderWidth: 1
//         }]
//       },
//       options: {
//         scales: {
//           x: { beginAtZero: true },
//           y: { beginAtZero: true }
//         }
//       }
//     });

//   } catch (error) {
//     console.error("Error fetching company data:", error);
//   }
// }

checkuser();
