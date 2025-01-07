import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  onSnapshot,
  setDoc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  onAuthStateChanged,
  getAuth,
  signOut
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userid;

const apiKeyDistance =
  "nyzqD57jQHRFOngNQDn5F16EBQ4wCX4lbIw3TUj55UcJmCQHjls4ZMlVo0Ac1yUL";

async function requestNotificationPermission() {
  console.log("sample");
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Notification permission granted.");
        // checkfornewsubscription();
      } else {
        console.log("Notification permission denied.");
      }
    });
  } else {
    console.log("Browser does not support notifications.");
  }
}

// function monitorexpiry() {
//   setInterval(() => {
//     if (isExpired(firebaseTimestamp)) {
//       console.log("The product has expired!");
//       clearInterval(timer); // Stop polling after expiry
//     } else {
//       console.log("The product is still valid. Checking again in 5 seconds...");
//     }
//   }, 5000); // Poll every 5 seconds
// }

async function getExpiry(uid) {
  try {
    const companyref = doc(db, `companies/${uid}`);
    const companysnapshot = await getDoc(companyref);

    if (companysnapshot.exists()) {
      const expiredDate = new Date(
        `${companysnapshot.data().subscribedAt.toDate()}`
      );
      setInterval(() => {
        if (isExpired(expiredDate)) {
          console.log("The product has expired!");
          // clearInterval(timer);
          signOut(auth)
            .then(() => {
              Swal.fire({
                title: "Ilugan",
                text: "Your subscription has expired",
                icon: "info",
              }).then(async (result) => {
                // await updateDoc(userDocRef, { status: "offline" });
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
        } else {
          console.log(
            "The product is still valid. Checking again in 5 seconds..."
          );
        }
      }, 3000);
      console.log(
        "Company data" +
          new Date(`${companysnapshot.data().subscribedAt.toDate()}`)
      );
    } else {
      console.log("Company data does not exists");
    }
  } catch (error) {}
}

function isExpired(dateString) {
  const expiryDate = new Date(dateString); // Parse the date string into a Date object
  const now = new Date(); // Get the current date and time
  return now > expiryDate; // Check if current date is after expiry date
}

// Function to show a notification
function showNotification(title, options) {
  if (Notification.permission === "granted") {
    new Notification(title, options).addEventListener("click", () => {
      window.location.assign("/notifications");
    });
  }
}

function busalertnotif(title, options) {
  if (Notification.permission === "granted") {
    new Notification(title, options).addEventListener("click", () => {
      window.location.assign("/busalerts");
    });
  }
}

async function checkuser() {
  // seatsmonitoring();
  sensorlistener();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is logged in:", user.uid);
      userid = user.uid;
      listentobusupdates(user.uid);
      getExpiry(user.uid);
      // getUserData(user.uid);
      // console.log("hello");

      try {
        // Reference to the current user's company document
        //   console.log(hello);
        const companyDocRef = doc(db, "companies", user.uid);
        const companyDocSnap = await getDoc(companyDocRef);

        if (companyDocSnap.exists()) {
          const companyData = companyDocSnap.data();
          // console.log(companyData);
          const notificationsCount = companyData.notifications || 0;
          // console.log(notificationsCount);

          // Reference to the busalerts subcollection
          const busAlertsRef = collection(
            db,
            "companies",
            user.uid,
            "busalerts"
          );
          // console.log(busAlertsRef);

          // Set up a real-time listener on the busalerts collection
          onSnapshot(busAlertsRef, async (snapshot) => {
            const busAlertsCount = snapshot.size; // Number of bus alerts
            console.log(busAlertsCount);
            console.log(notificationsCount);

            // Compare with the stored notifications count
            if (busAlertsCount > notificationsCount) {
              console.log(notificationsCount);
              console.log("New bus alert detected!");

              // Display a notification if there are new bus alerts
              busalertnotif("New Bus Alert", {
                body: "You have new bus alerts! Check your alerts.",
                icon: "/bicon",
              });

              // Update the notifications count in the company document
              await updateDoc(companyDocRef, { notifications: busAlertsCount });
            }
          });
        } else {
          console.log("No such company document for this user.");
        }
      } catch (error) {
        console.error("Error setting up bus alerts listener:", error);
      }
      //inspectionalerts
      try {
        // Reference to the current user's company document
        const companyDocRef = doc(db, "companies", user.uid);
        const companyDocSnap = await getDoc(companyDocRef);

        if (companyDocSnap.exists()) {
          const companyData = companyDocSnap.data();
          const notificationsCount = companyData.inspectionnotifications || 0;

          // Reference to the busalerts subcollection
          const busAlertsRef = collection(
            db,
            "companies",
            user.uid,
            "inspectionalerts"
          );

          // Set up a real-time listener on the busalerts collection
          onSnapshot(busAlertsRef, async (snapshot) => {
            const busAlertsCount = snapshot.size; // Number of bus alerts

            // Compare with the stored notifications count
            if (busAlertsCount > notificationsCount) {
              console.log("New bus inspection detected!");

              // Display a notification if there are new bus alerts
              showNotification("Inspection Alert", {
                body: "A bus was inspeted",
                icon: "/bicon",
              });

              // Update the notifications count in the company document
              await updateDoc(companyDocRef, {
                inspectionnotifications: busAlertsCount,
              });
            }
          });
        } else {
          console.log("No such company document for this user.");
        }
      } catch (error) {
        console.error("Error setting up bus alerts listener:", error);
      }
      //busnotifs
      try {
        // Reference to the current user's company document
        const companyDocRef = doc(db, "companies", user.uid);
        const companyDocSnap = await getDoc(companyDocRef);

        if (companyDocSnap.exists()) {
          const companyData = companyDocSnap.data();
          const notificationsCount = companyData.notificationsCount || 0;

          // Reference to the busalerts subcollection
          const busNotifsRef = collection(
            db,
            "companies",
            user.uid,
            "busnotifications"
          );

          // Set up a real-time listener on the busalerts collection
          onSnapshot(busNotifsRef, async (snapshot) => {
            const busnotifscount = snapshot.size; // Number of bus alerts

            // Compare with the stored notifications count
            if (busnotifscount > notificationsCount) {
              console.log("New bus notification detected!");

              // Display a notification if there are new bus alerts
              showNotification("Bus Update", {
                body: "You have a new bus notification",
                icon: "/bicon",
              });

              // Update the notifications count in the company document
              await updateDoc(companyDocRef, {
                notificationsCount: busnotifscount,
              });
            }
          });
        } else {
          console.log("No such company document for this user.");
        }
      } catch (error) {
        console.error("Error setting up bus alerts listener:", error);
      }
    } else {
      console.log("No user is signed in.");
      // window.location.assign("/login");
    }
  });
}

async function listentobusupdates(uid) {
  const busesRef = collection(db, `companies/${uid}/buses`);

  // Listen for real-time updates on each bus in the 'buses' collection
  onSnapshot(busesRef, (snapshot) => {
    snapshot.docs.forEach(async (docSnapshot) => {
      const busData = docSnapshot.data();
      const busDocRef = doc(db, `companies/${uid}/buses`, docSnapshot.id);

      const currentLocation = busData.current_location;
      const destinationCoordinates = busData.destination_coordinates;

      // Calculate the distance between the current location and the destination
      let distance = await getDistance(currentLocation, destinationCoordinates);
      console.log(distance);
      if (distance) {
        const label = distance.split(" ")[1];
        distance = distance.split(" ")[0];
        console.log(`${docSnapshot.id} distance from destination: ${distance}`);
        console.log(label);

        const busNotifsRef = collection(
          db,
          `companies/${uid}/busnotifications`
        );

        // Check if the notification has already been sent for this trip
        if (distance && parseFloat(distance) <= 10 && label === "m") {
          if (!busData.arrivalNotified) {
            await addDoc(busNotifsRef, {
              notification: `Bus ${docSnapshot.id} has reached its destination.`,
              dateNtime: new Date(),
            });
          }

          // Notify that the bus has reached its destination
          console.log(`Bus ${docSnapshot.id} has reached its destination.`);

          // Increment the trip count
          const tripCount = (busData.tripcount || 0) + 1;

          // Swap the terminal and destination locations
          const updatedData = {
            tripcount: tripCount,
            terminal_location: busData.destination_coordinates,
            destination_coordinates: busData.terminal_location,
            destination: busData.terminalloc,
            terminalloc: busData.destination,
            arrivalNotified: true, // Set 'arrivalNotified' to true
          };

          // Update Firestore with new data
          try {
            await updateDoc(busDocRef, updatedData);
            console.log(
              `Updated bus ${docSnapshot.id}: trip count incremented, locations swapped, and arrivalNotified set to true.`
            );
          } catch (error) {
            console.error("Error updating bus document:", error);
          }
        } else {
          await updateDoc(busDocRef, {
            arrivalNotified: false,
          });
        }
      }
    });
  });
}

async function getDistance(origin, end) {
  try {
    const response = await fetch(
      `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${end.latitude},${end.longitude}&key=${apiKeyDistance}`
    );
    const data = await response.json();
    return data.rows[0].elements[0].distance.text;
  } catch (error) {
    console.error("Error fetching distance:", error);
    return null;
  }
}

async function seatsmonitoring() {
  try {
    const documentpath = doc(db, "bus/seatStatus");
    const testbusref = doc(
      db,
      "companies/zAx8lj0OrgMUutxScdIf5rI818P2/buses/TEST BUS 0001"
    );
    console.log(documentpath);

    onSnapshot(documentpath, async (snapshot) => {
      console.log(snapshot.data());
      await updateDoc(testbusref, {
        available_seats: snapshot.data().available,
        occupied_seats: snapshot.data().occupied,
      });
    });
  } catch (error) {
    console.log(error);
  }
}

async function sensorlistener() {
  const today = new Date();
  console.log(today);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(today);
  console.log(formattedDate); //
  try {
    const sensordoc = doc(db, "bus/seatStatus");
    const toupdate = doc(
      db,
      "companies/1CzPhECXc8PFJQP4rfGzwW77gKp1/buses/BUS 6318"
    );
    const busdataref = doc(
      db,
      `companies/1CzPhECXc8PFJQP4rfGzwW77gKp1/buses/BUS 6318/data/${formattedDate}`
    );
    const companydataref = doc(
      db,
      `companies/1CzPhECXc8PFJQP4rfGzwW77gKp1/data/${formattedDate}`
    );
    onSnapshot(sensordoc, async (snapshot) => {
      const snapshot2 = await getDoc(toupdate);
      const snapshot3 = await getDoc(busdataref);
      const snapshot4 = await getDoc(companydataref);
      if (!snapshot3.exists() && !snapshot4.exists()) {
        await setDoc(
          doc(
            db,
            `companies/1CzPhECXc8PFJQP4rfGzwW77gKp1/buses/BUS 6318/data`,
            formattedDate
          ),
          {
            total_passengers: 0,
            total_reservations: 0,
          }
        );
        await setDoc(
          doc(db, `companies/1CzPhECXc8PFJQP4rfGzwW77gKp1/data`, formattedDate),
          {
            total_passengers: 0,
            total_reservation: 0,
          }
        );
      } else {
        console.log("BUs data: " + snapshot3.data().total_passengers);
        const passengerstotalindata = snapshot3.data().total_passengers;
        const companypassengertotal = snapshot4.data().total_passengers;
        console.log("COmpany total passengers: ", companypassengertotal);
        console.log(snapshot2);
        const data2 = snapshot2.data();
        console.log("To update avail:", data2.available_seats);
        const data = snapshot.data();
        console.log(data);
        console.log("Available: ", data.available);
        console.log("Occupied:", data.occupied);

        if (data.available < data.original_available) {
          await updateDoc(toupdate, {
            available_seats: data2.available_seats - 1,
            occupied_seats: data2.occupied_seats + 1,
          });
          await updateDoc(busdataref, {
            total_passengers: passengerstotalindata + 1,
          });
          await updateDoc(companydataref, {
            total_passengers: companypassengertotal + 1,
          });
        } else if (data.available > data.original_available) {
          await updateDoc(toupdate, {
            available_seats: data2.available_seats + 1,
            occupied_seats: data2.occupied_seats - 1,
          });
        } else {
          console.log("The data are equals");
        }

        await updateDoc(sensordoc, {
          original_available: data.available,
          original_occupied: data.occupied,
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
}

checkuser();
// const docref = co(db, "admin", "admin1");
