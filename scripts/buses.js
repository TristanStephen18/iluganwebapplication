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
  setDoc,
  getDoc,
  doc,
  GeoPoint,
  onSnapshot,
  deleteDoc,
  updateDoc,
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

let apiKey = "pk.e6e28e751bd0e401a2a07cb0cbe2e6e4";
const apiKeyDistance =
  "Sh9cR5GWvUmowkE0DqpDlAUVkKXMrikyDU5twM1rbfu61tZZEuuQyiSqvkUaS1bX";

// let terminalLat;
// let terminalLng;
let userId;
// let origin;
// let terminal_address;

// async function getTerminalLocation(uid) {
//   try {
//     const docRef = doc(db, "companies", uid);
//     const docSnap = await getDoc(docRef);

//     if (docSnap.exists()) {
//       const location = docSnap.data().terminal_location;
//       terminal_address = docSnap.data().terminal;
//       console.log(terminal_address);
//       if (location) {
//         terminalLat = location.latitude;
//         terminalLng = location.longitude;
//         console.log("Terminal Location:", terminalLat, terminalLng);
//         origin = new GeoPoint(parseFloat(terminalLat), parseFloat(terminalLng));
//       } else {
//         console.log("No terminal location found");
//       }
//     } else {
//       console.log("No such document!");
//     }
//   } catch (error) {
//     console.error("Error fetching terminal location: ", error);
//   }
// }
let availableconductors = [];
let destinationcoordinates;
let distance;
let terminalcoordinates;
let eta;
let editedterminalcoordinates;
let editeddetinationcoordinates;
let editedeta;
let editeddistance;
let busnumbers = [];
let platenumbers = [];
console.log(Date());

const destinations = document.getElementById("destinations");
const terminaldiv = document.getElementById("terminal");
const editterminaldiv = document.getElementById("editTerminal");
const editDestinationdiv = document.getElementById("editDestinations");
const editbustype = document.getElementById("editBusType");

// destinations.addEventListener("change", async () => {
//   destinationcoordinates = await forwardGeocode(destinations.value);
//   const coordinates = new GeoPoint(
//     parseFloat(destinationcoordinates.lat),
//     parseFloat(destinationcoordinates.lon)
//   );
//   console.log(coordinates);
//   eta = await getEstimatedTime(origin, coordinates);
//   distance = await getDistance(origin, coordinates);
//   console.log(eta);
//   console.log(distance);
//   // console.log(destinationcoordinates);
// });

// async function forwardGeocode(address) {
//   // const apiKey = "pk.e6e28e751bd0e401a2a07cb0cbe2e6e4";
//   const url = `https://us1.locationiq.com/v1/search.php?key=${apiKey}&q=${encodeURIComponent(
//     address
//   )}&format=json`;

//   try {
//     const response = await fetch(url);
//     const data = await response.json();
//     if (data && data.length > 0) {
//       const { lat, lon } = data[0]; // Extract latitude and longitude from the first result
//       console.log(lat, lon);
//       return { lat, lon };
//     } else {
//       return "Location not found";
//     }
//   } catch (error) {
//     console.error("Error fetching coordinates:", error);
//     return "Coordinates not available";
//   }
// }

document.getElementById("toscheds").addEventListener("click", () => {
  console.log("To bus scheds");
  window.location.assign("/scheds");
});

document.addEventListener("DOMContentLoaded", () => {
  const busform = document.querySelector("#busform");

  if (busform) {
    busform.addEventListener("submit", (e) => {
      e.preventDefault();
      console.log("clicked");
      const busnum = busform["busNumber"].value;
      const platenumber = busform["plateNumber"].value;
      const destination =
        busform["destinations"].options[busform["destinations"].selectedIndex]
          .text;
      const terminaladdress =
        busform["terminal"].options[busform["terminal"].selectedIndex].text;
      const seatsavail = busform["seats"].value;
      const route = document.getElementById("route").value;
      // const departure = busform["depttime"].value;
      const bustype =
        busform["bustype"].options[busform["bustype"].selectedIndex].text;

      if (terminaladdress == destination) {
        Swal.fire({
          title: "Bus Information Error",
          text: "The terminal and destination should not be the same",
          icon: "error",
          confirmButtonText: "OK",
        });
      } else {
        const results = checkforduplicatebuses(busnum, platenumber);
        console.log(results.busnumchecker, results.platenumchecker);
        if (results.busnumchecker == true) {
          Swal.fire({
            title: "Bus Information Error",
            text: "You already have a bus with this bus number",
            icon: "error",
            confirmButtonText: "OK",
          });
        } else if (results.platenumchecker == true) {
          Swal.fire({
            title: "Bus Information Error",
            text: "You already have a bus with this plate number",
            icon: "error",
            confirmButtonText: "OK",
          });
        } else {
          addtofleet(
            userId,
            busnum,
            destination,
            destinationcoordinates,
            distance,
            eta,
            terminalcoordinates,
            terminaladdress,
            platenumber,
            seatsavail,
            bustype,
            route
          );
          busform.reset();
        }
      }
    });
  } else {
    console.error("Form with id 'busform' not found");
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      userId = user.uid;
      console.log("User is logged in: " + user.uid);
      displaybuses(user.uid);
      getAvailableConductors(user.uid);
      // getTerminalLocation(user.uid);
      getEmployees(user.uid);
      populatedestinationsandterminals(user.uid);
      busdatagetter(user.uid);
    } else {
      console.log("User is not logged in");
      // window.location.assign('/login');
    }
  });
});

async function busdatagetter(uid) {
  try {
    const busescollection = collection(db, `companies/${uid}/buses`);
    onSnapshot(busescollection, (snapshot) => {
      console.log("Snapshot" + snapshot.docs);
      busnumbers = [];
      platenumbers = [];
      snapshot.docs.forEach((doc) => {
        console.log(doc.data());
        const data = doc.data();
        busnumbers.push(doc.id);
        platenumbers.push(data.bus_number);
      });
    });
    // const querysnapshot = await getDocs(busescollection);

    // querysnapshot.docs.forEach((doc) => {
    //   const data = doc.data();
    //   busnumbers.push(doc.id);
    //   platenumbers.push(data.bus_number);
    // });
    // console.log(busnumbers);
    // console.log(platenumbers);
  } catch (error) {
    console.log(error);
  }
}

function checkforduplicatebuses(busnumber, platenumber) {
  let busnumexists = false;
  let platenumexsist = false;
  busnumbers.forEach((busnum) => {
    if (busnum == busnumber) {
      busnumexists = true;
    }
  });

  platenumbers.forEach((platenum) => {
    if (platenum == platenumber) {
      platenumexsist = true;
    }
  });

  return {
    busnumchecker: busnumexists,
    platenumchecker: platenumexsist,
  };
}

async function initializaData() {
  console.log(terminaldiv.value);
  console.log(destinations.value);
  const termialcor = JSON.parse(terminaldiv.value);
  const destinatacor = JSON.parse(destinations.value);
  const editedterminalcor = JSON.parse(editterminaldiv.value);
  const editeddestinationcor = JSON.parse(editDestinationdiv.value);
  terminalcoordinates = new GeoPoint(termialcor.lat, termialcor.lng);
  destinationcoordinates = new GeoPoint(destinatacor.lat, destinatacor.lng);
  editeddetinationcoordinates = new GeoPoint(
    editeddestinationcor.lat,
    editeddestinationcor.lng
  );
  editedterminalcoordinates = new GeoPoint(
    editedterminalcor.lat,
    editedterminalcor.lng
  );
  editedeta = await getEstimatedTime(
    editedterminalcoordinates,
    editeddetinationcoordinates
  );
  editeddistance = await getDistance(
    editedterminalcoordinates,
    editeddetinationcoordinates
  );
  eta = await getEstimatedTime(terminalcoordinates, destinationcoordinates);
  distance = await getDistance(terminalcoordinates, destinationcoordinates);
  console.log(
    "Hwllo",
    terminalcoordinates,
    destinationcoordinates,
    eta,
    distance
  );

  console.log(
    "edited data",
    "terminal coordinates: ",
    editeddetinationcoordinates,
    "edited destination coordinates: ",
    editeddetinationcoordinates,
    "edited eta:",
    editedeta,
    "edited distance:",
    editeddistance
  );
}

async function setupbusseats(seats, busid) {
  for (let index = 1; index <= seats; index++) {
    // const element = array[index];
    try {
      await setDoc(
        doc(
          db,
          `companies/${userId}/buses/${busid}/seats`,
          `${index.toString()}`
        ),
        {
          status: "available",
        }
      );
    } catch (error) {
      console.log(error);
    }
    console.log(index);
  }
}

async function addtofleet(
  uid,
  busnum,
  destination,
  destincoordinates,
  distance,
  eta,
  terminalloc,
  termadress,
  // terminalpoint,
  platenum,
  available,
  type,
  route
) {
  try {
    await setDoc(doc(db, `companies/${uid}/buses`, busnum), {
      destination: destination,
      destination_coordinates: destincoordinates,
      distance_from_destination: distance,
      estimated_time_of_arrival: eta,
      conductor: "",
      terminalloc: termadress,
      // end_operation_time: end_op_time,
      terminal_location: terminalloc,
      bus_number: busnum,
      plate_number: platenum,
      available_seats: parseInt(available),
      reserved_seats: 0,
      occupied_seats: 0,
      current_location: terminalloc,
      bustype: type,
      via: route,
    });
    addtosystemlogs(uid, busnum, "add");
    console.log("bus added to the fleet");
    setupbusseats(parseInt(available), busnum);

    // const modal = document.getElementById("addFleetModal");
    // if (modal) {
    //   modal.style.display = "none"; // Hide the modal
    // }
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error",
      confirmButtonText: "OK",
    });
    console.log("Error" + error.message);
  }
}

async function displaybuses(uid) {
  try {
    const busescollection = collection(db, `companies/${uid}/buses`);
    onSnapshot(busescollection, (querysnapshot) => {
      // Clear the existing table content to avoid duplicates
      document.getElementById("buses").innerHTML = "";

      querysnapshot.docs.forEach((doc) => {
        const data = doc.data();
        // setupbusseats(data.available_seats, doc.id);

        const busesrow = `
          <tr data-bus-number="${doc.id}">
            <td style = "font-weight: bold;"><img src ="/greenbusicon" style = "width: 75px; height: 50px; margin-bottom: 4px;"></img><br>${
              doc.id
            }</td>
            <td>${data.bus_number}</td>
            <td>${data.terminalloc}</td>
            <td>${data.destination}</td>
            <td>${data.via || "Missing"} </td>
            <td>${data.distance_from_destination}</td>
            <td>${data.estimated_time_of_arrival}</td>
            <td>${
              data.conductor ||
              `<button class="assign-btn" data-id="${doc.id}"><i class="fas fa-user-plus" style="margin-right: 10px;"></i>Assign</button>`
            }</td>
            <td>${data.tripcount || "0"}</td>
            <td><span><button class="delete-btn" data-id="${
              doc.id
            }" style="margin-right: 10px;">Delete</button></span><button class="update-btn" data-id="${
          doc.id
        }">Edit</button></td>
          </tr>
        `;

        document
          .getElementById("buses")
          .insertAdjacentHTML("beforeend", busesrow);
      });

      // Attach delete event listeners after rows are created
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const busId = e.target.getAttribute("data-id");
          confirmDelete(busId, uid);
        });
      });

      document.querySelectorAll(".update-btn").forEach((button) => {
        button.addEventListener("click", async (e) => {
          const busId = e.target.getAttribute("data-id");
          await populateEditModal(busId, userId);
          const editBusModal = new bootstrap.Modal(
            document.getElementById("editBusModal")
          );
          editBusModal.show();
        });
      });
      document.querySelectorAll(".assign-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const busId = e.target.getAttribute("data-id");
          const assignConductorModal = new bootstrap.Modal(
            document.getElementById("assignConductorModal")
          );
          assignConductorModal.show();
      
          // Save the busId for use when assigning
          document
            .getElementById("assignConductorButton")
            .setAttribute("data-bus-id", busId);
        });
      });
      
    });
  } catch (error) {
    console.log(error);
  }
}

function confirmDelete(busId, uid) {
  Swal.fire({
    title: "Are you sure?",
    text: "Do you really want to delete this bus?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteBus(uid, busId);
      // showNotification('Bus Deletion', {
      //   body: `You removed bus ${busId} from your fleet`,
      //   icon: '/logo'
      // });
    }
  });
}

async function deleteBus(uid, busId) {
  try {
    await deleteDoc(doc(db, `companies/${uid}/buses`, busId));
    console.log("Bus deleted successfully");
    addtosystemlogs(uid, busId, "delete");
  } catch (error) {
    console.error("Error deleting bus:", error);
  }
}

function showNotification(title, options) {
  if (Notification.permission === "granted") {
    new Notification(title, options).addEventListener("click", () => {
      window.location.assign("/systemlogs");
    });
  }
}

async function populatedestinationsandterminals(uid) {
  try {
    const terminalscollection = collection(db, `companies/${uid}/terminals`);
    const querysnapshots = await getDocs(terminalscollection);

    destinations.innerHTML = ""; // Clear existing options
    terminaldiv.innerHTML = ""; // Clear existing terminal options

    querysnapshots.docs.forEach((doc) => {
      const data = doc.data();

      if (data.coordinates && data.address) {
        const coordinates = data.coordinates;

        // Populate destinations
        const destinationOption = document.createElement("option");
        destinationOption.value = JSON.stringify({
          lat: coordinates._lat,
          lng: coordinates._long,
        });
        destinationOption.textContent = data.address;
        destinations.appendChild(destinationOption);

        // Populate terminal dropdown
        const terminalOption = document.createElement("option");
        terminalOption.value = JSON.stringify({
          lat: coordinates._lat,
          lng: coordinates._long,
        });
        terminalOption.textContent = data.address;
        terminaldiv.appendChild(terminalOption);

        const editterminaloption = document.createElement("option");
        editterminaloption.value = JSON.stringify({
          lat: coordinates._lat,
          lng: coordinates._long,
        });
        editterminaloption.textContent = data.address;
        editterminaldiv.appendChild(editterminaloption);

        const editdestinationsoption = document.createElement("option");
        editdestinationsoption.value = JSON.stringify({
          lat: coordinates._lat,
          lng: coordinates._long,
        });
        editdestinationsoption.textContent = data.address;
        editDestinationdiv.appendChild(editdestinationsoption);
      }
    });

    initializaData();

    console.log("Destinations and terminals populated successfully.");
  } catch (error) {
    console.error("Error populating destinations and terminals:", error);
  }
}

//   eta = await getEstimatedTime(origin, coordinates);
//   distance = await getDistance(origin, coordinates);
// Update the onchange event listener for destinations
destinations.addEventListener("change", async () => {
  const selectedValue = destinations.value;

  if (selectedValue) {
    const coordinates = JSON.parse(selectedValue);
    console.log("Selected Coordinates:", coordinates);
    destinationcoordinates = new GeoPoint(coordinates.lat, coordinates.lng);
    console.log(destinationcoordinates);
    eta = await getEstimatedTime(destinationcoordinates, terminalcoordinates);
    distance = await getDistance(destinationcoordinates, terminalcoordinates);
  } else {
    console.log("No destination selected.");
  }
});

terminaldiv.addEventListener("change", () => {
  const selectedValue = destinations.value;

  if (selectedValue) {
    const coordinates = JSON.parse(selectedValue);
    console.log("Selected Terminal Coordinates:", coordinates);
    terminalcoordinates = new GeoPoint(coordinates.lat, coordinates.lng);
    console.log(terminalcoordinates);
  } else {
    console.log("No destination selected.");
  }
});

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

async function getEstimatedTime(origin, end) {
  try {
    const response = await fetch(
      `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${end.latitude},${end.longitude}&key=${apiKeyDistance}`
    );
    const data = await response.json();
    return data.rows[0].elements[0].duration.text;
  } catch (error) {
    console.error("Error fetching estimated time:", error);
    return null;
  }
}

async function addtosystemlogs(uid, busnum, option) {
  console.log("System logs function");
  try {
    // Create a reference to a new document in the 'systemlogs' collection
    const logRef = doc(collection(db, `companies/${uid}/systemlogs`));

    if (option == "add") {
      await setDoc(logRef, {
        log: `You added a new bus (${busnum}) to your fleet`,
        date: Date(),
      });
      console.log("A new system log was added");

      showNotification("System Log", {
        body: `You added a new bus (${busnum}) to your fleet`,
        icon: "/logo",
      });
    } else {
      await setDoc(logRef, {
        log: `You deleted (${busnum}) from your fleet`,
        date: Date(),
      });
      console.log("A new system log was added");

      showNotification("System Log", {
        body: `You deleted a bus (${busnum}) from your fleet`,
        icon: "/logo",
      });
    }
  } catch (error) {
    console.log(error);
  }
}

const logoutbtn = document.querySelector("#logout");
console.log(logoutbtn);
logoutbtn.addEventListener("click", () => {
  console.log("Clicked logout btn");
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
      }).then(async (result) => {
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

async function getEmployees(compId) {
  const employeecollection = collection(db, `companies/${compId}/employees`);
  const querysnapshots = await getDocs(employeecollection);

  querysnapshots.docs.forEach((doc) => {
    console.log(doc.data());
    const data = doc.data();
    console.log(data.id);
  });
}

async function populateEditModal(busId, uid) {
  try {
    const busDocRef = doc(db, `companies/${uid}/buses`, busId);
    const busSnap = await getDoc(busDocRef);

    if (busSnap.exists()) {
      const data = busSnap.data();

      // Set form fields with bus data
      document.getElementById("editBusNumber").value = busId; // Bus Number is readonly
      document.getElementById("editPlateNumber").value = data.bus_number;
      document.getElementById("editSeats").value = data.available_seats;
      // document.getElementById("editDepartureTime").value = data.departure_time;
      document.getElementById("editBusType").value = data.bustype;
      document.getElementById("editedroute").value =
        data.via || "Assign a route";

      // Set the selected option in the terminal dropdown
      const editTerminalDropdown = document.getElementById("editTerminal");
      Array.from(editTerminalDropdown.options).forEach((option) => {
        if (option.textContent === data.terminalloc) {
          option.selected = true;
        }
      });

      // Set the selected option in the destinations dropdown
      const editDestinationsDropdown =
        document.getElementById("editDestinations");
      Array.from(editDestinationsDropdown.options).forEach((option) => {
        if (option.textContent === data.destination) {
          option.selected = true;
        }
      });

      // Set the selected option in the bus type dropdown
      const editBusTypeDropdown = document.getElementById("editBusType");
      Array.from(editBusTypeDropdown.options).forEach((option) => {
        if (option.textContent === data.bustype) {
          option.selected = true;
        }
      });
    } else {
      console.error("No bus data found for the selected ID.");
    }
  } catch (error) {
    console.error("Error fetching bus data for editing:", error);
  }
}

document
  .getElementById("updateBusButton")
  .addEventListener("click", async () => {
    const busId = document.getElementById("editBusNumber").value;
    const plateNumber = document.getElementById("editPlateNumber").value;
    const terminallocationupdate =
      editterminaldiv.options[editterminaldiv.selectedIndex].text;
    const destinationlocationupdate =
      editDestinationdiv.options[editDestinationdiv.selectedIndex].text;
    const seats = parseInt(document.getElementById("editSeats").value);
    // const departureTime = document.getElementById("editDepartureTime").value;
    const route = document.getElementById("editedroute").value;
    const busType = editbustype.options[editbustype.selectedIndex].text;

    if (terminallocationupdate == destinationlocationupdate) {
      Swal.fire({
        title: "Bus Information Error",
        text: "The terminal and destination should not be the same",
        icon: "error",
        confirmButtonText: "OK",
      });
    } else {
      updatebusdata(
        busId,
        userId,
        busType,
        plateNumber,
        terminallocationupdate,
        editedterminalcoordinates,
        route,
        destinationlocationupdate,
        editeddetinationcoordinates,
        seats
      ); //
    }

    console.log(
      "edit data to be sent",
      busId,
      plateNumber,
      terminallocationupdate,
      destinationlocationupdate,
      seats,
      // departureTime,
      busType,
      editeddetinationcoordinates,
      editedterminalcoordinates
    );

    // try {
    //   await updateDoc(doc(db, `companies/${userId}/buses`, busId), {
    //     plate_number: plateNumber,
    //     terminal_location: terminal,
    //     destination_coordinates: destination,
    //     available_seats: seats,
    //     departure_time: departureTime,
    //     bustype: busType,
    //   });

    //   Swal.fire({
    //     title: "Success!",
    //     text: "Bus data has been updated.",
    //     icon: "success",
    //   });

    //   const editBusModal = bootstrap.Modal.getInstance(document.getElementById("editBusModal"));
    //   editBusModal.hide();
    // } catch (error) {
    //   Swal.fire({
    //     title: "Error",
    //     text: error.message,
    //     icon: "error",
    //   });
    //   console.error("Error updating bus data:", error);
    // }
  });

editDestinationdiv.addEventListener("change", async () => {
  const selectedValue = editDestinationdiv.value;

  if (selectedValue) {
    const coordinates = JSON.parse(selectedValue);
    console.log("Selected edited destination Coordinates:", coordinates);
    editeddetinationcoordinates = new GeoPoint(
      coordinates.lat,
      coordinates.lng
    );
    console.log(
      "Edited destination coordinates: " + editeddetinationcoordinates
    );
    editedeta = await getEstimatedTime(
      editedterminalcoordinates,
      editeddetinationcoordinates
    );
    editeddistance = await getDistance(
      editedterminalcoordinates,
      editeddetinationcoordinates
    );
    console.log(
      "ETa edited: " + editedeta + "Edited distance: " + editeddistance
    );
  } else {
    console.log("No destination selected.");
  }
});

editterminaldiv.addEventListener("change", async () => {
  const selectedValue = editterminaldiv.value;

  if (selectedValue) {
    const coordinates = JSON.parse(selectedValue);
    console.log("Selected edited terminal Coordinates:", coordinates);
    editedterminalcoordinates = new GeoPoint(coordinates.lat, coordinates.lng);
    console.log("Editer terminal coordinates: " + editedterminalcoordinates);
    // editedetaeta = await getEstimatedTime(editedterminalcoordinates, editeddetinationcoordinates);
    // editeddistancedistance = await getDistance(editedterminalcoordinates, editeddetinationcoordinates);
  } else {
    console.log("No destination selected.");
  }
});

async function updatebusdata(
  busID,
  companyID,
  btype,
  platenum,
  terminaladd,
  terminalpoint,
  viaroute,
  destinationadd,
  destinationpoint,
  seatsupdate
) {
  // const busdocref = doc(db, `companies/${companyID}/buses/${}`)
  try {
    await updateDoc(doc(db, `companies/${companyID}/buses`, busID), {
      bus_number: platenum,
      terminalloc: terminaladd,
      bustype: btype,
      terminal_location: terminalpoint,
      destination: destinationadd,
      destination_coordinates: destinationpoint,
      available_seats: seatsupdate,
      estimated_time_of_arrival: editedeta,
      distance_from_destination: editeddistance,
      via: viaroute,
    }).then(() => {
      const editBusModal = new bootstrap.Modal(
        document.getElementById("editBusModal")
      );
      editBusModal.hide();
      Swal.fire({
        title: "Bus Update",
        text: `Bus ${busID}'s info was updated successfully`,
        icon: "success",
      });
      // alert('Bus data has been updated');
    });
  } catch (error) {
    console.log(error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const routeInput = document.getElementById("route");
  const editedRouteInput = document.getElementById("editedroute");

  // Helper function to create a dropdown for suggestions
  function createSuggestions(inputElement, suggestions) {
    // Remove any existing suggestions
    let dropdown = inputElement.nextElementSibling;
    if (dropdown && dropdown.classList.contains("autocomplete-dropdown")) {
      dropdown.remove();
    }

    // Create a new dropdown
    dropdown = document.createElement("div");
    dropdown.classList.add("autocomplete-dropdown");
    dropdown.style.position = "absolute";
    dropdown.style.zIndex = "1000";
    dropdown.style.background = "#fff";
    dropdown.style.border = "1px solid #ccc";
    dropdown.style.width = inputElement.offsetWidth + "px";

    // Populate dropdown with suggestions
    suggestions.forEach((suggestion) => {
      const item = document.createElement("div");
      item.textContent = suggestion.display_name; // Use the display name from API results
      item.style.padding = "5px";
      item.style.cursor = "pointer";

      // Use mousedown to set the value before blur is triggered
      item.addEventListener("mousedown", (e) => {
        e.preventDefault(); // Prevent the input from losing focus
        inputElement.value = suggestion.display_name;
        dropdown.remove(); // Remove dropdown after selection
      });

      dropdown.appendChild(item);
    });

    // Append the dropdown to the input's parent
    inputElement.parentNode.appendChild(dropdown);
  }

  // Add input listeners for route fields
  [routeInput, editedRouteInput].forEach((input) => {
    input.addEventListener("input", async (e) => {
      const query = e.target.value;

      if (query.length > 2) {
        // Fetch only if query length is meaningful
        const suggestions = await fetchAutocomplete(query);
        createSuggestions(input, suggestions);
      }
    });

    // Hide dropdown when clicking outside
    input.addEventListener("blur", () => {
      setTimeout(() => {
        const dropdown = input.nextElementSibling;
        if (dropdown && dropdown.classList.contains("autocomplete-dropdown")) {
          dropdown.remove();
        }
      }, 200); // Delay to allow suggestion click
    });
  });
});

async function fetchAutocomplete(query) {
  const apiKey = "pk.b0f5e288ece5a120e06b41f5b56d7d12";
  const apiUrl = `https://api.locationiq.com/v1/autocomplete.php?key=${apiKey}&q=${encodeURIComponent(
    query
  )}&limit=5`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch autocomplete data.");
    const data = await response.json();
    return data; // Return the list of suggestions
  } catch (error) {
    console.error("Error fetching autocomplete results:", error);
    return [];
  }
}

async function updateConductorandBusdata(conid, busnum, conname) {
  try {
    await updateDoc(doc(db, `companies/${userId}/buses`, busnum), {
      conductor: conname
    });
    await updateDoc(doc(db, `companies/${userId}/employees`, conid), {
      inbus: busnum,
    }).then(async (val) => {
      await updateDoc(doc(db, `ilugan_mobile_users`, conid), {
        inbus: busnum,
      }).then(() => {
        Swal.fire({
          title: "Conductor assigned",
          text: `${busnum} now has a conductor`,
          icon: "success",
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
}

async function getAvailableConductors(uid) {
  try {
    const employeecollection = collection(db, `companies/${uid}/employees`);
    const conductorList = document.getElementById("conductorList");
    conductorList.innerHTML = "";

    onSnapshot(employeecollection, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        const data = doc.data();

        // Check if the employee is an available conductor
        if (data.type === "conductor" && data.inbus == null) {
          // Create a container for the conductor
          const conductorContainer = document.createElement("div");
          conductorContainer.classList.add("conductor-container");
          conductorContainer.setAttribute("data-con-id", doc.id);
          conductorContainer.setAttribute("data-con-name", data.employee_name);

          // Add the conductor's icon and name
          conductorContainer.innerHTML = `
            <img src = "/condicon" alt = "conductorimage" id = "conimage">
            <p>${data.id}</p>
            <p>Name: ${data.employee_name}</p>
          `;

          // Add click event for selection
          conductorContainer.addEventListener("click", () => {
            // Remove "selected" class from other containers
            document
              .querySelectorAll(".conductor-container")
              .forEach((el) => el.classList.remove("selected"));

            // Add "selected" class to the clicked container
            conductorContainer.classList.add("selected");
            console.log(conductorContainer.classList);

            // Enable the assign button
            document.getElementById("assignConductorButton").disabled = false;
          });

          // Append the container to the modal
          conductorList.appendChild(conductorContainer);
        }
      });

      // If no available conductors are found, show a message
      if (conductorList.innerHTML === "") {
        conductorList.innerHTML = "<p>No available conductors found.</p>";
      }
    });
  } catch (error) {
    console.log(error);
  }
}

// Handle "Assign" button click
document
  .getElementById("assignConductorButton")
  .addEventListener("click", () => {
    const selectedConductor = document.querySelector(
      ".conductor-container.selected"
    );

    if (selectedConductor) {
      const conductorId = selectedConductor.getAttribute("data-con-id");
      const conname = selectedConductor.getAttribute("data-con-name");
      console.log(`Selected Conductor ID: ${conductorId}\nName: ${conname}`);
      const busId = document
        .getElementById("assignConductorButton")
        .getAttribute("data-bus-id");

      // Replace this with Firestore update logic
      // updateBusWithConductor(busId, conductorId);

      updateConductorandBusdata(conductorId, busId, conname);

      // Close the modal
      const assignConductorModal = bootstrap.Modal.getInstance(
        document.getElementById("assignConductorModal")
      );
      assignConductorModal.hide();
    }
  });

// function updateBusWithConductor(busId, conductorId) {
//   console.log(`Assigning conductor ${conductorId} to bus ${busId}`);
//   // Firestore update logic goes here
// }

