import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

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

const currentDate = new Date();
const formattedDate = currentDate.toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "2-digit",
});

// console.log(formattedDate);

import {
  getFirestore,
  setDoc,
  doc,
  GeoPoint,
  Timestamp,
  getDoc,
  updateDoc,
  addDoc,
  collection,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const db = getFirestore();

const snpform = document.querySelector("#signup-form");


// console.log(snpform['email']);

// alert($('#email').value);

async function addData(id, mail, pass, comp, subscriptionType, expiryDate) {
  try {
    await setDoc(doc(db, "companies", id), {
      company_name: comp,
      terminal_location: null,
      email: mail,
      password: pass,
      subscribed: true,
      subscriptionType: subscriptionType,
      subscribedAt: Timestamp.now(),
      expiryDate: Timestamp.fromDate(expiryDate),
      status: "offline",
    });
    Swal.fire({
      title: "Account Created Successfully",
      text: "You cannow log in to our system",
      icon: "success",
      confirmButtonText: "OK",
    }).then(() => {
      window.location.assign("/login");
    });
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error,
      icon: "error",
      confirmButtonText: "OK",
    });
  }
}

async function updateAdminData(
  id,
  mail,
  pass,
  comp,
  subscriptionType,
  expiryDate,
  amount
) {
  try {
    // Set the company data under `admin/admin1/companies`
    await setDoc(doc(db, "admin/admin1/companies", comp), {
      company_name: comp,
      terminal_location: null,
      email: mail,
      subscriptionType: subscriptionType,
      subscribedAt: Timestamp.now(),
      expiryDate: Timestamp.fromDate(expiryDate),
      amountpayable: amount,
      paid: true,
    });

    // Format the current date for the document ID
    const iluganDocRef = doc(db, "admin/admin1/ilugan", formattedDate);

    // Attempt to fetch the existing document
    const iluganDocSnap = await getDoc(iluganDocRef);

    if (iluganDocSnap.exists()) {
      // If document exists, update existing values
      const currentData = iluganDocSnap.data();

      // Update total revenue by adding the new amount
      await updateDoc(iluganDocRef, {
        totalrevenue: currentData.totalrevenue + amount,
        webusers: currentData.webusers + 1,
        mobileusers: currentData.mobileusers,
      });
    } else {
      // If document doesn't exist, create it with initial values
      await setDoc(iluganDocRef, {
        totalrevenue: amount,
        webusers: 1,
        mobileusers: 1,
      });
    }

    // Call addData to add the user to the companies collection
    notifyadminonaccouncreation(mail, subscriptionType);
    addData(id, mail, pass, comp, subscriptionType, expiryDate);
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error",
      confirmButtonText: "OK",
    });
  }
}

async function notifyadminonaccouncreation(email, type) {
  const collectionRef = collection(db, "admin", "admin1", "notifications");

  await addDoc(collectionRef, {
    content: `${email} subscribed to your system with the susbcription type of ${type}`,
    date: Date(),
  });

  console.log("admin notified");
}

function getSubscriptionExpiry(subscriptionType) {
  const subscriptionDate = new Date(); // current date/time when user subscribes
  let expiryDate = new Date(subscriptionDate); // copy of the subscription date

  // Add time based on subscription type
  switch (subscriptionType) {
    case "Annual":
      expiryDate.setFullYear(subscriptionDate.getFullYear() + 1);
      break;
    case "Semi-Annual":
      expiryDate.setMonth(subscriptionDate.getMonth() + 6);
      break;
    case "Quarterly":
      expiryDate.setMonth(subscriptionDate.getMonth() + 3);
      break;
    default:
      throw new Error("Invalid subscription type");
  }

  return expiryDate;
}

snpform.addEventListener("submit", (e) => {
  e.preventDefault();

  let userid;
  const email = snpform["email"].value;
  const password = snpform["password"].value;
  const confirmpassword = snpform["confirmpassword"].value;
  const company = snpform["companyname"].value;
  const loginCard = document.querySelector(".login-card");

  if (password !== confirmpassword) {
    Swal.fire({
      title: "Confirm Password",
      text: "Passwords do not match",
      icon: "error",
      confirmButtonText: "OK",
    });
    return;
  }

  if (password.length <= 7) {
    Swal.fire({
      title: "Account Creation Error",
      text: "Password should be at least 8 characters",
      icon: "error",
      confirmButtonText: "OK",
    });
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((cred) => {
      userid = cred.user.uid;
      // Send email verification
      sendEmailVerification(cred.user)
        .then(() => {
          // Replace login-card content with a verification message
          loginCard.innerHTML = `
            <h2>Verify Your Email</h2>
            <p style="color: black;">
              A verification email has been sent to <strong>${email}</strong>. 
              Please check your inbox and verify your email before proceeding.
            </p>
            <p>
              After verification, this page will update automatically.
            </p>
          `;

          // Start polling for email verification
          startEmailVerificationPolling(cred.user);
        })
        .catch((error) => {
          Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error",
            confirmButtonText: "OK",
          });
        });
    })
    .catch((error) => {
      Swal.fire({
        title: "Error creating your account",
        text: error.message,
        icon: "error",
        confirmButtonText: "OK",
      });
    });

  let selectedPrice;
  let selectedPlan;

  const subscriptionCards = document.querySelectorAll(".subscription-card");
  subscriptionCards.forEach((card) => {
    card.addEventListener("click", function () {
      subscriptionCards.forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");
      selectedPrice = this.getAttribute("data-price");
      selectedPlan = this.getAttribute("data-plan");
    });
  });

  // Function to show loader and processing message
  function showProcessingModal() {
    const subscriptionModal = document.getElementById("subscriptionModal");
    subscriptionModal.innerHTML = ""; // Clear modal content

    const modalContent = document.createElement("div");
    modalContent.classList = "modal-content";

    const modalHeader = document.createElement("div");
    modalHeader.classList = "modal-header";
    const modalTitle = document.createElement("h5");
    modalTitle.classList = "modal-title";
    modalTitle.innerText = "Payment Status";

    const modalBody = document.createElement("div");
    modalBody.classList = "modal-body";
    modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
             <div class="spinner-border text-success" role="status" style = "width: 70px; height: 70px;">
          </div>
            <h2 style="margin-top: 20px; color: #25b09b;">Processing Subscription...</h2>
        </div>
    `;

    modalHeader.appendChild(modalTitle);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);

    subscriptionModal.appendChild(modalContent);

    // Show modal if using Bootstrap
    // $('#subscriptionModal').modal('show');
}


  // Function to show success message after payment
  function showPaymentSuccessModal() {
    const subscriptionModal = document.getElementById("subscriptionModal");
    subscriptionModal.innerHTML = ""; // Clear modal content

    const modalContent = document.createElement("div");
    modalContent.classList = "modal-content";

    const modalBody = document.createElement("div");
    modalBody.classList = "modal-body";
    modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
            <h2 style="color: #25b09b;">Payment Successfully Received!</h2>
        </div>
    `;

    modalContent.appendChild(modalBody);
    subscriptionModal.appendChild(modalContent);

    // Show modal if using Bootstrap
    // $('#subscriptionModal').modal('show');
}


  // Payment logic with loader and success message

  const payNowBtn = document.getElementById("payNow");
  payNowBtn.addEventListener("click", function () {
    if (selectedPlan && selectedPrice) {
      const expiryDate = getSubscriptionExpiry(selectedPlan);

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: "Basic c2tfdGVzdF81Z1VZeEx3WHBLcGdaQWdtRnNWWDlQUjQ6",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: parseFloat(selectedPrice) * 100,
              description: "Subscription",
              remarks: selectedPlan,
            },
          },
        }),
      };

      fetch("https://api.paymongo.com/v1/links", options)
        .then((response) => response.json())
        .then((response) => {
          // Show processing modal
          showProcessingModal();

          // Open payment link
          window.open(response.data.attributes.checkout_url);

          const checkStatusInterval = setInterval(() => {
            const options = {
              method: "GET",
              headers: {
                accept: "application/json",
                authorization:
                  "Basic c2tfdGVzdF81Z1VZeEx3WHBLcGdaQWdtRnNWWDlQUjQ6",
              },
            };

            fetch(
              `https://api.paymongo.com/v1/links/${response.data.id}`,
              options
            )
              .then((response) => response.json())
              .then((statusResponse) => {
                console.log(statusResponse.data.attributes.status);
                if (statusResponse.data.attributes.status === "paid") {
                  clearInterval(checkStatusInterval); // Stop polling

                  // Update modal content to success
                  showPaymentSuccessModal();

                  // Add user data and update admin data
                  updateAdminData(
                    userid,
                    email,
                    password,
                    company,
                    selectedPlan,
                    expiryDate,
                    parseFloat(selectedPrice)
                  );
                }
              })
              .catch((err) => console.error(err));
          }, 5000); // Poll every 5 seconds
        })
        .catch((err) => console.error(err));
    } else {
      alert("Please select a subscription plan.");
    }
  });

  // Close modal when clicking outside content (optional)
  window.addEventListener("click", function (e) {
    if (e.target === subscriptionModal) {
      subscriptionModal.style.display = "none";
    }
  });
});

function startEmailVerificationPolling(user) {
  const intervalId = setInterval(() => {
    user
      .reload()
      .then(() => {
        if (user.emailVerified) {
          clearInterval(intervalId); // Stop polling
          showPaymentModal(); // Show the payment modal
        }
      })
      .catch((error) => {
        console.error("Error reloading user:", error);
        clearInterval(intervalId); // Stop polling on error
      });
  }, 1000); // Poll every 1 second
}

// Function to show the payment modal
function showPaymentModal() {
  const subscriptionModal = document.getElementById("subscriptionModal");
  subscriptionModal.style.display = "flex";
  Swal.fire({
    title: "Email Verified",
    text: "Your email has been verified. You can now proceed to select a subscription plan.",
    icon: "success",
    confirmButtonText: "OK",
  });
}
