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

async function checkuser() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User is logged in:", user.uid);

        const userdocref = doc(db, 'companies', user.uid);

        console.log(userdocref);
        const documentsnapshot = await getDoc(userdocref);
        console.log(documentsnapshot);

        if(documentsnapshot.exists()){
            console.log(documentsnapshot.data());

            const data = documentsnapshot.data();

            if(data.terminal_location != null && data.busdestinations != null){
                window.location.assign('/dashboard');
            }else{
                window.location.assign('/destinations')
            }
        }else{
            console.log("data doees not existt");
        }

        // getUserData(user.uid);
        
        // try {
        //   const companyDocRef = doc(db, "companies", user.uid);
        //   const companyDocSnap = await getDoc(companyDocRef);
  
        //   if (companyDocSnap.exists()) {
        //     const companyData = companyDocSnap.data();
        //     const notificationsCount = companyData.notifications || 0;
  
        //     // Reference to the busalerts subcollection
        //     const busAlertsRef = collection(db, "companies", user.uid, "busalerts");
  
        //     // Set up a real-time listener on the busalerts collection
        //     onSnapshot(busAlertsRef, async (snapshot) => {
        //       const busAlertsCount = snapshot.size; // Number of bus alerts
              
        //       // Compare with the stored notifications count
        //       if (busAlertsCount > notificationsCount) {
        //         console.log("New bus alert detected!");
                
        //         // Display a notification if there are new bus alerts
        //         showNotification("New Bus Alert", {
        //           body: "You have new bus alerts! Check your alerts.",
        //           icon: "/path/to/icon.png",
        //         });
  
        //         // Update the notifications count in the company document
        //         await updateDoc(companyDocRef, { notifications: busAlertsCount });
        //       }
        //     });
        //   } else {
        //     console.log("No such company document for this user.");
        //   }
        // } catch (error) {
        //   console.error("Error setting up bus alerts listener:", error);
        // }
  
        // try {
        //   // Reference to the current user's company document
        //   const companyDocRef = doc(db, "companies", user.uid);
        //   const companyDocSnap = await getDoc(companyDocRef);
  
        //   if (companyDocSnap.exists()) {
        //     const companyData = companyDocSnap.data();
        //     const notificationsCount = companyData.inspectionnotifications || 0;
  
        //     // Reference to the busalerts subcollection
        //     const busAlertsRef = collection(db, "companies", user.uid, "inspectionalerts");
  
        //     // Set up a real-time listener on the busalerts collection
        //     onSnapshot(busAlertsRef, async (snapshot) => {
        //       const busAlertsCount = snapshot.size; // Number of bus alerts
              
        //       // Compare with the stored notifications count
        //       if (busAlertsCount > notificationsCount) {
        //         console.log("New bus alert detected!");
                
        //         // Display a notification if there are new bus alerts
        //         showNotification("Inspection Alert", {
        //           body: "A bus was inspeted",
        //           icon: "/path/to/icon.png",
        //         });
  
        //         // Update the notifications count in the company document
        //         await updateDoc(companyDocRef, { inspectionnotifications: busAlertsCount });
        //       }
        //     });
        //   } else {
        //     console.log("No such company document for this user.");
        //   }
        // } catch (error) {
        //   console.error("Error setting up bus alerts listener:", error);
        // }
      } else {
        console.log("No user is signed in.");
        window.location.assign("/login");
      }
    });
  }

  checkuser();
  