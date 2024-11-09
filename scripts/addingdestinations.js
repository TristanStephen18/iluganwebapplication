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
  onSnapshot
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

const showmodal = document.querySelector('#showmodal');

const samplecodument = doc(db, 'sampledata/locations');

let useruid;

async function addDestinations(uid, destinations) {
    try{
        const companydoc = doc(db, `companies/${uid}`);

        await setDoc(companydoc, {
            endterminals: destinations // save the array in the 'locations' field
          });

          console.log("data added to company data");
        
    }catch (error){
        console.log(error);
    }
}

  const nextbtn = document.querySelector(".next-button");
  nextbtn.addEventListener('click', ()=>{
    console.log('clicked');
    const locationslist = document.getElementById('inputList');
    const values = [];
  
  locationslist.querySelectorAll("input").forEach(input => {
    values.push(input.value);
  });

  console.log(values);

  addDestinations(useruid, values);
  
  });


async function checkuser() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User is logged in:", user.uid);
        useruid = user.uid;

        const userdocref = doc(db, 'companies', user.uid);

        console.log(userdocref);
        const documentsnapshot = await getDoc(userdocref);

        if(documentsnapshot.exists()){
            console.log(documentsnapshot.data());

            const data = documentsnapshot.data();

            console.log(data.terminal_location == null);
            console.log(data.busdestinations == null);
            if(data.terminal_location != null && data.busdestinations != null){
                window.location.assign('/dashboard');
            }else if(data.busdestinations != null && data.terminal_location == null){
                window.location.assign('/terminallocation')
            }
        }else{
            console.log("data doees not existt");
        }
      } else {
        console.log("No user is signed in.");
        window.location.assign("/login");
      }
    });
  }

  checkuser();
  