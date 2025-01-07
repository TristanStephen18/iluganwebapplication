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
  onSnapshot,
  setDoc,
  GeoPoint,
  addDoc,
  deleteDoc
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

checkuser();
let companyId;
let terminals = [];


async function checkuser() {
    // requestNotificationPermission();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        companyId = user.uid;
        console.log("User is logged in:", user.uid);
        fetchterminals(user.uid);
        addTerminalstoMap(user.uid);
  
      } else {
        console.log("No user is signed in.");
        // location.assign("/login");
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
    const userDocRef = doc(db, "companies", companyId);
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

  async function fetchAutocomplete(query) {
    const apiKey = "pk.b0f5e288ece5a120e06b41f5b56d7d12";
    const apiUrl = `https://api.locationiq.com/v1/autocomplete.php?key=${apiKey}&q=${encodeURIComponent(
      query
    )}&limit=5`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok)
        throw new Error("Failed to fetch autocomplete data.");
      const data = await response.json();
      return data; // Return the list of suggestions
    } catch (error) {
      console.error("Error fetching autocomplete results:", error);
      return [];
    }
  }

  const searchdiv = document
  .getElementById("searchLocation");

  // Handle Autocomplete Input
  
    searchdiv.addEventListener("input", async (e) => {
      const query = e.target.value.trim();
      const resultsContainer = document.getElementById(
        "autocompleteResults"
      );

      if (query.length < 2) {
        resultsContainer.style.display = "none";
        return;
      }

      const results = await fetchAutocomplete(query);
      resultsContainer.innerHTML = ""; // Clear old results
      resultsContainer.style.display =
        results.length > 0 ? "block" : "none";

      results.forEach((result) => {
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action";
        li.textContent = result.display_name;

        li.addEventListener("click", () => {
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);

          // Pan modal map to selected location
          modalMap.panTo({ lat, lng: lon });
          modalMap.setZoom(15);

          // Update marker
          if (modalMarker) modalMarker.setMap(null);
          modalMarker = new google.maps.Marker({
            position: { lat, lng: lon },
            map: modalMap,
          });

          // Clear autocomplete and close suggestions
          resultsContainer.style.display = "none";
          document.getElementById("searchLocation").value =
            result.display_name;
        });

        resultsContainer.appendChild(li);
      });
    });

  // Add Terminal Button Logic
document
.getElementById("addTerminalBtn")
.addEventListener("click", async () => {
  if (modalMarker) {
    const position = modalMarker.getPosition();
    const terminalcoordinates = {
        lat: position.lat(),
        long: position.lng()
    }
    const address = await reverseGeocode(position.lat(), position.lng());
    const checker = checkforduplicateterminals(address);

    if(checker == true){
      Swal.fire({
        title: "Terminal Selection Error",
        text: "You already have a terminal in this city or place",
        icon: "error",
      });
    }else{
      addtocompanyterminal(companyId, terminalcoordinates, address);
    }

    // Add logic to update the database or table here
  } else {
    Swal.fire({
      title: "Error",
      text: "You have not yet selected a location",
      icon: "error",
    });
  }
});

async function reverseGeocode(lat, lng) {
    try {
      const apiKey = "pk.e6e28e751bd0e401a2a07cb0cbe2e6e4";
      const apiUrl = `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`;
  
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      // Extract city from the address
      const city = data.address.city || data.address.town || data.address.village || "City not available";
      return city;
    } catch (error) {
      console.error("Error with reverse geocoding: ", error);
      return "City not available";
    }
  }
  
async function addtocompanyterminal(compID, terminalcoordinates, terminaladdress) {
    // const terminalref = doc()
    const convertedpoints = new GeoPoint(terminalcoordinates.lat, terminalcoordinates.long);
    const terminalsCollection = collection(db, `companies/${compID}/terminals`);    
    await addDoc(terminalsCollection, {
        address: terminaladdress,
        coordinates: convertedpoints,
    }).then(async() =>{
        Swal.fire({
            title: "Terminal Added",
            text: `A new terminal was added`,
            icon: "success",
          }).then(() => {
            modalMarker.setMap(null);
            modalMarker = null;
      
            document.getElementById("searchLocation").value = "";
      
            const resultsContainer = document.getElementById("autocompleteResults");
            resultsContainer.innerHTML = "";
            resultsContainer.style.display = "none";
      
            // Reset map center and zoom
            modalMap.panTo({ lat: 14.5995, lng: 120.9842 }); // Reset to Manila
            modalMap.setZoom(12);
      
            // Hide the modal
            const modal = bootstrap.Modal.getInstance(
              document.getElementById("addTerminalModal")
            );
            modal.hide();
          });
    });
}

const terminaltbody = document.getElementById('terminaltable');
// Fetch terminals and render in the table
async function fetchterminals(compId) {
    const companyterminalcollection = collection(db, `companies/${compId}/terminals`);
  
    // Real-time listener
    onSnapshot(
      companyterminalcollection,
      (snapshot) => {
        // Clear existing rows to avoid duplication
        terminaltbody.innerHTML = "";
        let counter = 1;
  
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(data);
  
          const terminalsrow = `
            <tr data-terminal-id="${doc.id}">
                <td>${counter}</td>
                <td>${data.address}</td>
                <td>${data.coordinates._lat}, ${data.coordinates._long}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-terminal" data-terminal-id="${doc.id}">Delete</button>
                </td>
            </tr>
          `;
  
          terminaltbody.insertAdjacentHTML("beforeend", terminalsrow);
          counter++;
        });
  
        // Attach delete event listeners to the buttons
        attachDeleteHandlers(compId);
      },
      (error) => {
        console.error("Error listening to terminals: ", error);
      }
    );
  }
  
  // Function to attach delete event handlers to delete buttons
  function attachDeleteHandlers(compId) {
    const deleteButtons = document.querySelectorAll(".delete-terminal");
  
    deleteButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        const terminalId = e.target.getAttribute("data-terminal-id");
  
        // Show confirmation prompt
        const result = await Swal.fire({
          title: "Are you sure?",
          text: "Do you want to delete this terminal? This action cannot be undone.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "Cancel",
        });
  
        if (result.isConfirmed) {
          try {
            // Delete terminal from Firestore
            const terminalDocRef = doc(db, `companies/${compId}/terminals/${terminalId}`);
            await deleteDoc(terminalDocRef);
  
            // Show success message
            Swal.fire({
              title: "Deleted!",
              text: "The terminal has been deleted successfully.",
              icon: "success",
            });
          } catch (error) {
            console.error("Error deleting terminal:", error);
            Swal.fire({
              title: "Error",
              text: error,
              icon: "error",
            });
          }
        } else {
          // Action canceled
          Swal.fire({
            title: "Canceled",
            text: "The terminal was not deleted.",
            icon: "info",
          });
        }
      });
    });
  }
  
  async function addTerminalstoMap(companyId) {
    const terminalsCollection = collection(db, `companies/${companyId}/terminals`);
  
    // Real-time listener for terminals collection
    onSnapshot(
      terminalsCollection,
      (snapshot) => {
        // Remove all existing markers to avoid duplication
        if (window.terminalMarkers) {
          window.terminalMarkers.forEach((marker) => marker.setMap(null));
        }
        window.terminalMarkers = [];
  
        snapshot.forEach((doc) => {
          const terminalData = doc.data();
          const terminalId = doc.id;
  
          if (!terminalData.coordinates) {
            console.warn(`Terminal ${terminalId} is missing coordinates.`);
            return;
          }

          terminals.push(terminalData.address);
  
          // Create marker for each terminal
          const marker = new google.maps.Marker({
            position: {
              lat: terminalData.coordinates._lat,
              lng: terminalData.coordinates._long,
            },
            map: window.mainMap, // Explicitly set to the main map
            title: terminalData.address || "Unknown Address",
          });
  
          // Save marker reference
          window.terminalMarkers.push(marker);
  
          // Create info window for marker
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="min-width: 50px;">
                <strong>Terminal Location:</strong>
                ${terminalData.address || "Unknown Address"}
              </div>
            `,
          });
  
          // Add click event listener for marker to show info window
          marker.addListener("click", () => {
            infoWindow.open(marker.getMap(), marker);
          });
        });
      },
      (error) => {
        console.error("Error listening to terminals for map:", error);
      }
    );
  }
  
  function checkforduplicateterminals(selectedterminal){
    let alreadyexists = false;
    terminals.forEach((address) => {
      if(address == selectedterminal){
        alreadyexists = true;
      }
    });

    return alreadyexists;
  }