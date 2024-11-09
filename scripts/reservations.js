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
    // fetchNotifications(userId);
    displayreservations(user.uid);
  } else {
    console.log("User is not logged in");
  }
});


const logoutbtn = document.querySelector("#logout");
console.log(logoutbtn);
logoutbtn.addEventListener("click", () => {
  console.log("Clicked logout btn");
  logout();
});

const busFilter = document.getElementById("busFilter");

async function displayreservations(uid) {
  try {
    const busescollection = collection(db, `companies/${uid}/buses`);
    const querySnapshot = await getDocs(busescollection);

    // Populate the dropdown with bus numbers
    querySnapshot.docs.forEach((doc) => {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = doc.id;
      busFilter.appendChild(option);
    });

    querySnapshot.docs.map(async (doc) => {
      const reservationscollection = collection(db, `companies/${uid}/buses/${doc.id}/reservations`);
      const reservationsnapshot = await getDocs(reservationscollection);

      reservationsnapshot.docs.map((x) => {
        const data = x.data();
        
        // Format the timestamp
        const datetime = new Date(data.date_time.seconds * 1000);
        const formattedDateTime = datetime.toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });

        // Create a new row for each reservation
        const reservationRow = `
          <tr data-bus-number="${doc.id}">
            <td>${x.id}</td>
            <td>${doc.id}</td>
            <td>${formattedDateTime}</td>
            <td>${data.from}</td>
            <td>${data.to}</td>
            <td>${data.passengerId}</td>
            <td>${data.seats_reserved}</td>
            <td>${data.type || "N/A"}</td>
            <td>${data.amount}</td>
            <td>${data.accomplished}</td>
          </tr>
        `;
        
        // Append the row to the table body
        document.getElementById("reservations").insertAdjacentHTML('beforeend', reservationRow);
      });
    });

    // Initialize DataTable
    $('#busReservation').DataTable();

  } catch (error) {
    console.log(error);
  }
}

busFilter.addEventListener("change", function () {
    const selectedBus = this.value;
    const rows = document.querySelectorAll("#reservations tr");
  
    rows.forEach((row) => {
      const busNumber = row.getAttribute("data-bus-number");
      if (selectedBus === "" || busNumber === selectedBus) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
  