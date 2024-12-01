import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  collection,
  doc,
  updateDoc
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

let userid = null;
let originalToken = null;
let comp_email = null;
let counter = 0;

const add_employee_form = document.querySelector("#add-employees-form");
// console.log(prompt("enter a value"));

// const num1 =parseInt(prompt("Enter a value: "));
// const num2 = parseInt(prompt("Enter a value: "));
// alert(`There sum is ${num1 + num2}`)

// Show the modal for password re-entry
function showPasswordModal() {
    const passwordModal = new bootstrap.Modal(document.getElementById("passwordModal"));
    passwordModal.show();
    
    return new Promise((resolve) => {
      const submitButton = document.getElementById("submit-password");
  
      submitButton.onclick = () => {
        const reenteredPassword = document.getElementById("reenter-password").value;
        passwordModal.hide();
        resolve(reenteredPassword);
      };
    });
  }
  
  add_employee_form.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const employee_id = add_employee_form["emp-id"].value;
    const emp_email = add_employee_form["email"].value;
    const emp_password = add_employee_form["password"].value;
    const emp_type = add_employee_form["employee_type"].value;
    const employee_name = add_employee_form["name"].value;
    let emp_userId = null;
  
    try {
      console.log(employee_id, emp_email, emp_password, emp_type, employee_name, emp_userId);
      await createUserWithEmailAndPassword(auth, emp_email, emp_password).then((cred) => {
        console.log("New employee account created.");
        emp_userId = cred.user.uid;
      });
  
      await addDataToFirestore(emp_userId, employee_id, employee_name, emp_email, emp_password, emp_type);
      await auth.signOut();
      add_employee_form.reset();
  
      // Trigger modal to re-enter password
      const reenteredPassword = await showPasswordModal();
      await signInWithEmailAndPassword(auth, comp_email, reenteredPassword);
      console.log("Original user reauthenticated.");
      addtosystemlogs(userid, employee_id);
    } catch (error) {
      console.log(error);
    }
  });
  
async function addDataToFirestore(id, empId, emp_name, email, password, type) {
  try {
    console.log(userid);
    await setDoc(doc(db, `companies/${userid}/employees`, id), {
      employee_name: emp_name,
      id: empId,
      email: email,
      password: password,
      type: type,
      status: "inactive"
    });
    if(type == "conductor"){
      await setDoc(doc(db, `ilugan_mobile_users`, id), {
        companyId: userid,
        employee_name: emp_name,
        id: empId,
        email: email,
        password: password,
        type: type,
        inbus: "",
      });
    }else{
      await setDoc(doc(db, `ilugan_mobile_users`, id), {
        companyId: userid,
        employee_name: emp_name,
        id: empId,
        email: email,
        password: password,
        type: type,
      });
    }
    // alert("Employee Added");
  } catch (error) {
    console.error("Error writing document: ", error);
  }
}

function checkUser() {
  onAuthStateChanged(auth, async (user) => {
    if(counter == 0){
        if (user) {
            console.log("User is logged in:", user.uid);
            userid = user.uid;
            comp_email = user.email;
            console.log(user.email);
            counter = 2;
            originalToken = await user.getIdToken(true);
            console.log(originalToken);
        }else{
            // window.location.assign('/login');
        }
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
  const userDocRef = doc(db, "companies", userid);
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

async function addtosystemlogs(uid, empID) {
    console.log('System logs function');
    try {
      // Create a reference to a new document in the 'systemlogs' collection
      const logRef = doc(collection(db, `companies/${uid}/systemlogs`));
    
      await setDoc(logRef, {
        log: `You created an iLugan Mobile Account for ${empID}`,
        date: Date()
      });
      console.log("A new system log was added");
  
      showNotification('System Log', {
        body: `You created an iLugan Mobile Account for ${empID}`,
        icon: '/logo'
      });
    } catch (error) {
      console.log(error);
    }
  }

function showNotification(title, options) {
    if (Notification.permission === "granted") {
      new Notification(title, options);
    }
  }

  const seeemps = document.getElementById('see_employees');

  seeemps.addEventListener('click', ()=>{
    window.location.assign('/employees');
  })

window.onload = checkUser;
