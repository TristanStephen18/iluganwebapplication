import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth,   onAuthStateChanged, } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
  updateDoc,
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

const typedisplayer = document.getElementById("subst");
const paybutton = document.getElementById("paybtn");
let subsprice;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User is logged in:", user.uid);
    getSubstype(user.uid)
    // getUserData(user.uid);
  }
});

async function getSubstype(uid) {
    try{
        const companydocref = doc(db, `companies/${uid}`);
        const snapshot = await getDoc(companydocref);
        if(snapshot.exists){
            console.log(snapshot.data())
            const data = snapshot.data();
            const substype = data.subscriptionType;
            let amount = '';

            if(substype == 'Annual'){
                amount = '16,000 php';
                subsprice = '16000';
            }else if(substype == 'Semi-Annual'){
                amount = '8,000 php';
                subsprice = '8000';
            }else{
                amount = '4,000 php';
                subsprice = '4000';
            }

            typedisplayer.innerHTML = `Your ${substype} subscription of our system has ended`;
            paybutton.innerHTML = `Pay ${amount}`;
        }else{
            console.log('Data does not exists')
        }
    }catch(error){
        console.log(error)
    }

}

paybutton.addEventListener("click", function () {
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
              amount: parseFloat(subsprice) * 100,
              description: "Subscription",
              remarks: 'Subscription Renewal',
            },
          },
        }),
      };

      fetch("https://api.paymongo.com/v1/links", options)
        .then((response) => response.json())
        .then((response) => {
          // Show processing modal
        //   showProcessingModal();

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
                //   showPaymentSuccessModal();

                  // Add user data and update admin data
                //   updateAdminData(
                //     userid,
                //     email,
                //     password,
                //     company,
                //     selectedPlan,
                //     expiryDate,
                //     parseFloat(selectedPrice)
                //   );
                }
              })
              .catch((err) => console.error(err));
          }, 5000); // Poll every 5 seconds
        })
        .catch((err) => console.error(err));
  });
