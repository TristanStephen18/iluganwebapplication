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
  doc,
  updateDoc,
  deleteDoc,
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

let userId;

onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    console.log("User is logged in");
    getEmployees(user.uid);
  } else {
    console.log("User is not logged in");
  }
});

async function getEmployees(uid) {
  const employeestable = document.getElementById("employees");

  // Clear existing rows to prevent duplication
  employeestable.innerHTML = "";

  try {
    const employeescollection = collection(db, `companies/${uid}/employees`);

    // Listen to changes in the employees collection
    onSnapshot(employeescollection, (querySnapshot) => {
      // Clear the table to avoid duplicate entries
      employeestable.innerHTML = "";

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const isDisabled = data.status === "disabled";
        const buttonText = isDisabled ? "Enable" : "Disable";
        const buttonClass = isDisabled ? "enable-btn" : "disable-btn";
        const buttonStyle = isDisabled ? "btn-success" : "btn-warning";

        const employeesrow = `
                  <tr data-emp-number="${doc.id}">
                    <td><strong>${data.id}</strong></td>
                    <td>${data.email}</td>
                    <td>${data.employee_name}</td>
                    <td>${data.type}</td>
                    <td>${data.status}</td>
                    <td>${doc.id}</td>
                    <td>
                      <button class="${buttonClass} ${buttonStyle}" data-id="${doc.id}">
                        ${buttonText}
                      </button>
                      <button class="delete-btn" data-id="${doc.id}">Delete Account</button>
                    </td>
                  </tr>
                `;

        employeestable.insertAdjacentHTML("beforeend", employeesrow);
      });

      // Re-add event listeners for the new rows
      document
        .querySelectorAll(".disable-btn, .enable-btn")
        .forEach((button) => {
          button.addEventListener("click", (e) =>
            handleToggleAccount(e.target)
          );
        });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", (e) =>
          handleDeleteAccount(e.target.dataset.id)
        );
      });
    });
  } catch (error) {
    console.error(error);
  }
}

async function handleToggleAccount(button) {
  const employeeId = button.dataset.id;
  const currentStatus = button.innerText.toLowerCase();
  const action = currentStatus === "disable" ? "disable" : "enable";

  const confirmResult = await Swal.fire({
    title: `Are you sure?`,
    text: `Do you want to ${action} this account?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: `Yes, ${action} it`,
    cancelButtonText: "Cancel",
  });

  if (confirmResult.isConfirmed) {
    try {
      const companyEmployeeRef = doc(
        db,
        `companies/${userId}/employees`,
        employeeId
      );
      const iluganMobileUserRef = doc(db, `ilugan_mobile_users`, employeeId);

      if (action === "disable") {
        await updateDoc(companyEmployeeRef, { status: "disabled" });
        await updateDoc(iluganMobileUserRef, { status: "disabled" });
        button.innerText = "Enable";
        button.classList.remove("btn-warning");
        button.classList.add("btn-success");
        document.querySelector(
          `[data-emp-number="${employeeId}"] td:nth-child(5)`
        ).innerText = "disabled";
      } else {
        await updateDoc(companyEmployeeRef, { status: "inactive" });
        await updateDoc(iluganMobileUserRef, { status: "inactive" });
        button.innerText = "Disable";
        button.classList.remove("btn-success");
        button.classList.add("btn-warning");
        document.querySelector(
          `[data-emp-number="${employeeId}"] td:nth-child(5)`
        ).innerText = "inactive";
      }
      Swal.fire(
        action === "disable" ? "Disabled!" : "Enabled!",
        `The account has been ${action}d.`,
        "success"
      );
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  }
}

async function handleDeleteAccount(employeeId) {
  const confirmResult = await Swal.fire({
    title: "Are you sure?",
    text: "This action will permanently delete the account.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
  });

  if (confirmResult.isConfirmed) {
    try {
      const companyEmployeeRef = doc(
        db,
        `companies/${userId}/employees`,
        employeeId
      );
      const iluganMobileUserRef = doc(db, `ilugan_mobile_users`, employeeId);

      await deleteDoc(companyEmployeeRef);
      await deleteDoc(iluganMobileUserRef);

      Swal.fire("Deleted!", "The account has been deleted.", "success");

      document.querySelector(`[data-emp-number="${employeeId}"]`).remove();
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  }
}

const logoutbtn = document.querySelector("#logout");
logoutbtn.addEventListener("click", () => {
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
      }).then(async () => {
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
