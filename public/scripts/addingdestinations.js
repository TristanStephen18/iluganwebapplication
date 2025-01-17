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
  setDoc,
  getDocs,
  updateDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
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

const showmodal = document.querySelector("#showmodal");

const samplecodument = doc(db, "sampledata/locations");

let useruid;

async function addDestinations(uid, destinations) {
  try {
    const companydoc = doc(db, `companies/${uid}`);

    await updateDoc(companydoc, {
      endterminals: destinations, // save the array in the 'locations' field
    });

    console.log("data added to company data");
    window.location.assign("/terminallocation");
  } catch (error) {
    console.log(error);
  }
}

const confirmed = document.querySelector("#confirmlocations");
confirmed.addEventListener("click", () => {
  console.log("clicked");
  const locationslist = document.getElementById("inputList");
  const values = [];

  locationslist.querySelectorAll("input").forEach((input) => {
    values.push(input.value);
  });

  console.log(values);

  addDestinations(useruid, values);
});

const loadingModal = new bootstrap.Modal(
  document.getElementById("loadingModal")
);

// Event delegation for dynamically created delete buttons
document.getElementById("inputList").addEventListener("click", (event) => {
  if (event.target.closest(".delete-location")) {
      const locationItem = event.target.closest(".location-item");
      locationItem.remove();

      // Hide "Next" button if no locations remain
      if (document.getElementById("inputList").children.length === 0) {
          document.querySelector(".next-button").style.display = "none";
          prompt.innerHTML = "Click here to add destinations";
      }
  }
});


async function checkuser() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is logged in:", user.uid);
      useruid = user.uid;

      const userdocref = doc(db, "companies", user.uid);

      console.log(userdocref);
      const documentsnapshot = await getDoc(userdocref);

      if (documentsnapshot.exists()) {
        console.log(documentsnapshot.data());

        const data = documentsnapshot.data();

        console.log(data.terminal_location == null);
        console.log(data.busdestinations == null);
        if (data.terminal_location != null && data.endterminals != null) {
          loadingModal.show();
          window.location.assign("/dashboard");
        } else if (
          data.terminal_location == null &&
          data.endterminals != null
        ) {
          console.log(data.terminal_location);
          // loadingModal.show();
          console.log("here");
          window.location.assign("/terminallocation");
        } else {
          return;
        }
      } else {
        console.log("data doees not exist");
      }
    } else {
      console.log("No user is signed in.");
      window.location.assign("/login");
    }
  });
}

checkuser();
