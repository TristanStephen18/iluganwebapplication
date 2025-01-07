import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  query
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

let companyId;
const logsdiv = document.getElementById('logs');
// const loader = document.getElementById('loader');

const options = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true
};

let logsArray = [];  // Store all logs
let currentPage = 1;
const logsPerPage = 10;  // Limit to 10 logs per page

// Handle pagination controls
function updatePaginationControls() {
  const totalPages = Math.ceil(logsArray.length / logsPerPage);
  document.querySelector('.pagination').innerHTML = `
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

// Display logs based on the current page
function displayCurrentPageLogs() {
  logsdiv.innerHTML = ""; // Clear the logs container
  const start = (currentPage - 1) * logsPerPage;
  const end = start + logsPerPage;

  // Slice the array for the current page and sort by date in descending order
  const logsToDisplay = logsArray.slice(start, end).sort((a, b) => new Date(b.date) - new Date(a.date));

  logsToDisplay.forEach(log => {
    console.log(log.date); // Debugging output
    displayLog(log.log, log.date);
  });
}


// Navigate to a specific page
function goToPage(page) {
  currentPage = page;
  displayCurrentPageLogs();
  updatePaginationControls();
}

// Navigate to the next page
function nextPage() {
  const totalPages = Math.ceil(logsArray.length / logsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayCurrentPageLogs();
    updatePaginationControls();
  }
}

// Navigate to the previous page
function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    displayCurrentPageLogs();
    updatePaginationControls();
  }
}

async function checkuser() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      companyId = user.uid;
      console.log("User is logged in:", user.uid);
      await getSystemLogs(user.uid);
    } else {
      console.log("No user is signed in.");
      // location.assign("/login");
    }
  });
}

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

async function getSystemLogs(uid) {
  try {
    // Query Firestore collection with ordering by date in descending order
    const logsCollection = collection(db, `companies/${uid}/systemlogs`);
    const orderedLogsQuery = query(logsCollection, orderBy("date", "desc"));
    const logsSnapshot = await getDocs(orderedLogsQuery);

    // Map the logs with correct parsing of date
    logsArray = logsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        log: data.log,
        date: new Date(`${data.date}`), // Convert Firestore Timestamp to JS Date object
        id: doc.id
      };
    });

    // Display the first page of logs
    displayCurrentPageLogs();
    updatePaginationControls();
  } catch (error) {
    console.log("Error fetching system logs:", error);
  }
}


function displayLog(log, date) {
  const newdate = new Date(`${date}`);
  const logcontainer = document.createElement('div');
  logcontainer.className = 'log-entry';

  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(newdate);

  logcontainer.innerHTML = `
    <i class="fas fa-clipboard"></i>
    <div>
      <strong>${log}</strong><br>
      <small>${formattedDate}</small>
    </div>
  `;
  logsdiv.appendChild(logcontainer);
}

window.onload = checkuser;

// Expose pagination functions to the global scope for inline HTML access
window.nextPage = nextPage;
window.previousPage = previousPage;
window.goToPage = goToPage;
