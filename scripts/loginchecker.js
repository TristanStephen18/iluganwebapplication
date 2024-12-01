import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
  collection,
  getDocs,
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

async function checkuser() {
  getSubscribers();
  // Show loading moda

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is logged in:", user.uid);
      const loadingModal = new bootstrap.Modal(
        document.getElementById("loadingModal")
      );
      loadingModal.show();

      const userdocref = doc(db, "companies", user.uid);
      const documentsnapshot = await getDoc(userdocref);

      if (documentsnapshot.exists()) {
        const data = documentsnapshot.data();

        let direction = "/dashboard";

        // Redirect based on data content
        // if (data.terminal_location != null && data.endterminals != null) {
        //   direction = "/dashboard";
        //   // window.location.assign("/dashboard");
        // } else if (data.endterminals == null) {
        //   direction = "/destinations";
        //   // window.location.assign("/destinations");
        // } else if (
        //   data.terminal_location == null &&
        //   data.endterminals != null
        // ) {
        //   direction = "/terminallocation";
        // }
        console.log(direction);
        window.location.assign(direction);
      } else {
        console.log("Data does not exist.");
      }

      // Hide loading modal when done
      loadingModal.hide();
    } else {
      console.log("No user is signed in.");
      loadingModal.hide(); // Hide modal before redirect
      // window.location.assign("/");
    }
  });
}

let subs = 0;

async function getSubscribers() {
  const appsubslabel = document.getElementById("subscribers");
  const webuserslabel = document.getElementById("total-sales");
  const userslabel = document.getElementById("users");
  webuserslabel.innerHTML = "";
  appsubslabel.innerHTML = "";
  userslabel.innerHTML = "";
  const passengerCollection = collection(db, "passengers");
  onSnapshot(passengerCollection, async (snapshot) => {
    console.log(snapshot.size);
    // subs = parseInt(snapshot.size);
    console.log(subs);
    updatesubs(snapshot.size);
    appsubslabel.innerHTML = snapshot.size;
    const companiescollection = collection(db, "companies");

    onSnapshot(companiescollection, async (data) => {
      webuserslabel.innerHTML = `${data.size}`;
      updatesubs(data.size);
      userslabel.innerHTML = `${snapshot.size + data.size}`;
    });
  });

  // appsubslabel.innerHTML = subs.toString();

  // const snapshot = await getDocs(passengerCollection);
  // console.log(snapshot.size);
}

function updatesubs(size) {
  subs += size;
  console.log("Hello");
}
// Call checkuser on page load
checkuser();
