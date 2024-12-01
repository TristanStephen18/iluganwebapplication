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

// Authenticate and fetch data
onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    // fetchNotifications(userId);
    displayreservations(user.uid);
  } else {
    console.log("User is not logged in");
    // window.location.assign('/login');
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

    // Get today's date without time
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to the start of the day

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
          hour12: true,
        });
        let status = "Pending";
        if(data.accomplished == true){
            status = "Scanned";
        }
        // Check if the reservation date is today
        const reservationDate = new Date(datetime);
        reservationDate.setHours(0, 0, 0, 0); // Reset time for comparison
          // Create a new row for today's reservation
          const reservationRow = `
            <tr data-bus-number="${doc.id}">
              <td>${x.id}</td>
              <td>${doc.id}</td>
              <td>${formattedDateTime}</td>
              <td>${data.from}</td>
              <td>${data.to}</td>
              <td>${data.seats_reserved}</td>
              <td>${data.type || "Regular"}</td>
              <td>${data.amount}</td>
              <td>${status}</td>
            </tr>
          `;

          // Append the row to the table body
          document.getElementById("reservations").insertAdjacentHTML('beforeend', reservationRow);
      });
    });

    // Initialize DataTable
    // $('#busReservation').DataTable();

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
  
  document.getElementById('backbutton').addEventListener('click', ()=>{
    window.location.assign('/reservations');
  });