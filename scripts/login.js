import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// import {bootstrap} from "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css";

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

// Reference to login form and modal
const loginForm = document.querySelector("#login-form");
const loadingModal = new bootstrap.Modal(document.getElementById("loadingModal"), {
  backdrop: 'static',
  keyboard: false,
});


loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Show the loading modal
  loadingModal.show();

  const email = loginForm["email"].value;
  const password = loginForm["password"].value;
  let counter;

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      const userDocRef = doc(db, "companies", user.uid);
      // counter =  await getlogincounter(user.uid);
      
      try {
        const userDoc = await getDoc(userDocRef);
        
        loadingModal.hide();  // Hide modal on successful login
        window.location.assign("/dashboard");
      } catch (error) {
        loadingModal.hide();  // Hide modal on error
        Swal.fire({
          title: "Error",
          text: error.message,
          icon: "error",
          confirmButtonText: "OK",
        });
        console.log('Error: ' + error.message);
      }
    })
    .catch((error) => {
      loadingModal.hide();  // Hide modal if authentication fails
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonText: "OK",
      });
      console.log('Error: ' + error.message);
    });
});

async function getlogincounter(uid) {
  const userDocRef = doc(db, "companies", uid);
  const userDoc = await getDoc(userDocRef);

  console.log(userDoc);

  return userDoc.data().logincounter;
}

const forgotpassbtn = document.getElementById('forgotpassbtn');
forgotpassbtn.addEventListener('click', ()=>{
  const email = document.getElementById('email').value;
  console.log(email);
  if(email){
    sendPasswordResetEmail(auth, email).then(()=>{
      Swal.fire({
        title: "Password reset email sent!",
        text: `The email was sent to ${email}`,
        icon: "success",
        confirmButtonText: "OK",
      });
    });
  }else{
    alert('Enter your email first');
  }
});
