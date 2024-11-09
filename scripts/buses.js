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
    console.log("User is logged in: " + user.uid);
    displaybuses(user.uid);
    // fetchNotifications(userId);
  } else {
    console.log("User is not logged in");
  }
});


async function displaybuses(uid) {
    try{
        const busescollection = collection(db, `companies/${uid}/buses`);
        const querysnapshot = await getDocs(busescollection);
        console.log(querysnapshot);

        querysnapshot.docs.map((doc)=>{
            console.log(doc.id);
            const data = doc.data();
            
        const busesrow = `
          <tr data-bus-number="${doc.id}">
            <td>${doc.id}</td>
            <td>${data.bus_number}</td>
            <td>${data.destination}</td>
            <td>${data.conductor || 'None assigned'}</td>
            <td>${data.distance_from_destination}</td>
            <td>${data.estinamted_time_of_arrival}</td>
            <td>${data.departure_time} am</td>
            <td>${data.trips || "0"}</td>
          </tr>
        `;

        document.getElementById('buses').insertAdjacentHTML('beforeend', busesrow);
        });

    }catch (error){
        console.log(error);
    }
}
