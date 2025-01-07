import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth,   onAuthStateChanged, } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
  updateDoc,
  setDoc
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
let substype;
let totalrevpresent;
let userid;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User is logged in:", user.uid);
    getSubstype(user.uid)
    userid = user.uid;
    const subsdate = new Date();
    const todaydate = subsdate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
  });

  console.log(todaydate);
  totalrevpresent = await getPresenttotalrev(todaydate.toString());
  console.log(totalrevpresent);

    // getUserData(user.uid);
  }
});

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

async function getSubstype(uid) {
    try{
        const companydocref = doc(db, `companies/${uid}`);
        const snapshot = await getDoc(companydocref);
        if(snapshot.exists){
            console.log(snapshot.data())
            const data = snapshot.data();
            substype = data.subscriptionType;
            let amount = '';

            if(substype == 'Annual'){
                amount = 'PHP 16,000';
                subsprice = 16000;
            }else if(substype == 'Semi-Annual'){
                amount = 'PHP 8,000';
                subsprice = 8000;
            }else{
                amount = 'PHP 4,000';
                subsprice = 4000;
            }

            typedisplayer.innerHTML = `Your ${substype} subscription has expired. Please renew to continue using
            our services`;
            paybutton.innerHTML = `Pay ${amount}`;
        }else{
            console.log('Data does not exists')
        }
    }catch(error){
        console.log(error)
    }

}

paybutton.addEventListener("click", function () {
  // Show the modal with the loader
  $("#paymentModal").modal("show");

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
          remarks: "Subscription Renewal",
        },
      },
    }),
  };

  fetch("https://api.paymongo.com/v1/links", options)
    .then((response) => response.json())
    .then((response) => {
      // Open the payment link
      window.open(response.data.attributes.checkout_url);

      // Poll for payment status
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

              const subsdate = new Date();
              const expiryDate = getSubscriptionExpiry(substype);

              const todaydate = subsdate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "2-digit",
              });

              console.log(`Renewed at: ${subsdate}`);
              console.log(`Expiry date: ${expiryDate}`);

              updateAdminData(todaydate.toString());
              updateCompanyData(userid, subsdate, expiryDate);

              // Hide the modal
              $("#paymentModal").modal("hide");

              // Show success alert
              Swal.fire({
                icon: "success",
                title: "Subscription Renewed",
                text: "You have renewed your subscription. You can now use iLugan again.",
              }).then(()=>{
                window.location.assign('/login');
              });
            }
          })
          .catch((err) => {
            console.error(err);
            // Hide the modal if an error occurs
            $("#paymentModal").modal("hide");
          });
      }, 5000); // Poll every 5 seconds
    })
    .catch((err) => {
      console.error(err);
      // Hide the modal if an error occurs
      $("#paymentModal").modal("hide");
    });
});


// async function addtoadmindata(params) {
//   try{
//     const 
//     const adminrefilugandoc = doc(db, `admin/admin1/ilugan/`)
//   }catch(error){

//   }
// }


  async function getPresenttotalrev(id) {
    try{
      const admindataref = doc(db, `admin/admin1/ilugan/${id}`);
      const snapshot = await getDoc(admindataref);
      if(snapshot.exists){
        console.log(snapshot.data())
        return snapshot.data().totalrevenue;
      }else{
        console.log("sample")
      }
    }catch(error){
      console.error(error)
    }
  }

  async function updateAdminData(id) {
    try{
      const admindataref = doc(db, `admin/admin1/ilugan/${id}`);
      await updateDoc(admindataref, {
        totalrevenue: totalrevpresent + subsprice
      });
      
    }catch(error){
      console.error(error)
      const admindataref = doc(db, `admin/admin1/ilugan/${id}`);
      await setDoc(admindataref, {
        totalrevenue: subsprice
      })
    }
  }


  async function updateCompanyData(id, newsubsdate, newexpirydate) {
    try{
      const companyref = doc(db, `companies/${id}`);
      await updateDoc(companyref, {
        subscribedAt: newsubsdate,
        expiryDate: newexpirydate
      });
      
    }catch(error){
      console.error(error)
    }
  }

