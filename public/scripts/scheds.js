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
  setDoc,
  getDoc,
  doc,
  GeoPoint,
  onSnapshot,
  deleteDoc,
  updateDoc,
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

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      userId = user.uid;
      console.log("User is logged in: " + user.uid);
      displaybuses(user.uid);
    } else {
      console.log("User is not logged in");
    }
  });
});

// Function to display buses with or without departure times
async function displaybuses(uid) {
  try {
    const busescollection = collection(db, `companies/${uid}/buses`);
    onSnapshot(busescollection, (querysnapshot) => {
      // Clear table and container content to avoid duplicates
      document.getElementById("buses").innerHTML = "";
      document.getElementById("no-schedule-buses").innerHTML = "";
      const labeler = document.getElementById('noschedlabel');
      labeler.innerHTML = "";

      querysnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const busnum = doc.id;

        if (!data.departure_time) {
          // Add buses without departure_time as clickable containers
          const busContainer = `
            <div class="bus-container" data-bus-number="${busnum}">
              <img src="../images/bicon2.png" style="width: 75px; height: 50px; margin-bottom: 4px;" />
              <p style="font-weight: bold; text-align: center;">${busnum}</p>
            </div>
          `;
          document
            .getElementById("no-schedule-buses")
            .insertAdjacentHTML("beforeend", busContainer);
            labeler.innerHTML = "Buses with no schedules";
        } else {
          // Add buses with departure_time to the table
          let timelabel = "pm";
          const depttime = data.departure_time;
          if (parseInt(depttime.split(":")[0]) < 12) {
            timelabel = "am";
          }

          const busesrow = `
            <tr data-bus-number="${busnum}">
              <td style="font-weight: bold;">
                <img src="../images/bicon2.png" style="width: 75px; height: 50px; margin-bottom: 4px;" /><br />
                ${busnum}
              </td>
              <td>${data.terminalloc}</td>
              <td>${data.destination}</td>
              <td>${data.via || "Missing"}</td>
              <td>${data.departure_time} ${timelabel}</td>
              <td>
                <button class="update-btn" data-id="${busnum}">Edit</button>
              </td>
            </tr>
          `;
          document
            .getElementById("buses")
            .insertAdjacentHTML("beforeend", busesrow);
        }
      });

      // Add event listeners for clickable bus containers
      document.querySelectorAll(".bus-container").forEach((container) => {
        container.addEventListener("click", (e) => {
          const busnum = container.getAttribute("data-bus-number");
          showModal(busnum, "Add a departure time for", "Set Departure Schedule");
        });
      });

      // Add event listeners for edit buttons
      document.querySelectorAll(".update-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const busnum = button.getAttribute("data-id");
          const currentRow = button.closest("tr");
          const currentTime = currentRow.querySelector("td:nth-child(5)").textContent.split(" ")[0];
          showModal(busnum, `Update ${busnum}'s departure time`, "Update Departure Time", currentTime);
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
}

// Function to show modal for adding/updating departure time
function showModal(busnum, title, buttonText, existingTime = "") {
  const modalHTML = `
    <div id="scheduleModal" class="modal" tabindex="-1" style="display: block;">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title} (${busnum})</h5>
            <button type="button" class="btn-close" id="closeModalBtn" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="scheduleForm">
              <div class="mb-3">
                <label for="departure-time" class="form-label">Departure Time</label>
                <input type="time" class="form-control" id="departure-time" value="${existingTime}">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" id="modalActionBtn">${buttonText}</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Add event listener for modal action button
  document.getElementById("modalActionBtn").addEventListener("click", () => {
    const schedtime = document.getElementById("departure-time").value;
    if (schedtime) {
      updatebussched(schedtime, busnum);
      closeModal();
    } else {
      Swal.fire("Error", "Please select a valid time.", "error");
    }
  });

  // Add event listener for close button
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById("scheduleModal");
  if (modal) modal.remove();
}


// Function to update bus schedule in Firestore
async function updatebussched(schedtime, busnum) {
  try {
    await updateDoc(doc(db, `companies/${userId}/buses`, busnum), {
      departure_time: schedtime,
    }).then(() => {
      Swal.fire({
        title: "Success",
        text: `${busnum}'s schedule was updated successfully`,
        icon: "success",
      });
    });
  } catch (error) {
    console.log(error);
    Swal.fire("Error", "Failed to update schedule.", "error");
  }
}
