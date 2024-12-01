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
  onSnapshot,
  doc,
  updateDoc,
  setDoc
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

let busnotifications = [];
let inspectionnotifs = [];
let userId;

const options = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: true, // Ensures 12-hour clock with am/pm
};

onAuthStateChanged(auth, (user) => {
    if (user) {
      userId = user.uid;
    //   listenForNotifications(userId);
    getcompanynotifications(user.uid);
    console.log(`User is logged in: ${user.uid}`)
    } else {
      console.log("User is not logged in");
    }
  });

async function getcompanynotifications(uid) {
    try{
        const busnotifref = collection(db, `companies/${uid}/busnotifications`);
        const busnotificationsdocs = await getDocs(busnotifref);
        const inspectionnotifsref = collection(db,  `companies/${uid}/inspectionalerts`);

        onSnapshot(busnotifref, async (docsnapshot) => {
            console.log(docsnapshot.size);
            const querysnapshot = docsnapshot.docs;
        
            querysnapshot.forEach((doc) => {
                const notifdata = doc.data();
                const notifObject = { notif: notifdata.notification, date: notifdata.dateNtime };
                busnotifications.push(notifObject);
        
                // Call displaybusnotifs to display each notification
                displaybusnotifs(notifObject.notif, notifObject.date);
            });
        });
        
        onSnapshot(inspectionnotifsref, async(insnapshot)=>{
            console.log(insnapshot.size);

            const snapshots = insnapshot.docs;
            snapshots.map((doc)=>{
                const inspectionnotifdata = doc.data();
                displayinsnotifs(inspectionnotifdata.busnumber, inspectionnotifdata.context, inspectionnotifdata.reason, inspectionnotifdata.validation, inspectionnotifdata.datetime);
                inspectionnotifs.push({busnumber: inspectionnotifdata.busnumber, inspectorid: inspectionnotifdata.context, status: inspectionnotifdata.validation, reason: inspectionnotifdata.reason});
            });
        });

        console.log(busnotifications);
        console.log(inspectionnotifs);
        // for(let x = 0; x < busnotifications.length; x++){
        //     console.log(busnotifications[x]); 
        // }
        // getbnotifs();
    }catch (error){
        console.log(error);
    }
}

document.querySelector("#logout").addEventListener("click", logout);

async function logout() {
  const userDocRef = doc(db, "companies", userId);
  await updateDoc(userDocRef, { status: "offline" });
  await signOut(auth);
  Swal.fire("Ilugan", "Log out successful", "success").then(() => location.assign("/login"));
}

async function displaybusnotifs(notif, date) {
    const busnotifdiv = document.getElementById('busnotifications');
    const notificationelement = document.createElement('div');
    notificationelement.className = "busnotif";
    const newdate = new Date(`${date}`);
    const formatteddate = newdate.toLocaleString('en-Us', options);

    notificationelement.innerHTML = `
    <i class="fas fa-bus" style="margin-left: 10px;"></i>
    <div id="notifdiv">
      <strong style="text-transform: uppercase;">${notif}</strong><br>
      <small>${formatteddate}</small>
    </div>
    `;

    busnotifdiv.appendChild(notificationelement);
}


async function displayinsnotifs(busnum, id, reason, validation, date) {
    const newdate = new Date();
    let formattedDate;
    if(date == null){
      formattedDate = new Intl.DateTimeFormat("en-US", options).format(newdate);
    }else{
      const insdate = new Date(`${date.toDate()}`);
      console.log(insdate);
      formattedDate = insdate.toLocaleString("en-US", options);
    }
    const insnotifdiv = document.getElementById('inspectionnotifications');
    const insnotif = document.createElement('div');
    insnotif.className = "inspectionotif";

    let icon;

    if(validation == 'passed'){
        icon = '<i class="fas fa-thumbs-up" style="margin-left: 10px;"></i>';
    }else{
        icon = '<i class="fas fa-thumbs-down" style="margin-left: 10px;"></i>';
    }

    insnotif.innerHTML = `
${icon}
    <div id="notifdiv">
      <strong style="text-transform: uppercase;">${busnum} - ${id}</strong><br>
      <p>Result: ${validation}</p><br>
      <p>${formattedDate}</p>
    </div>
    `;

    insnotifdiv.appendChild(insnotif);
}