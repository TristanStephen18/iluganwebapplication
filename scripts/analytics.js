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
    query,
    orderBy,
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

// --- Fetch Data Functions ---

// Check if user is authenticated and get user ID
let userId = null;
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        await populateBusDropdown();
        renderInitialChart();
    } else {
        console.log("User is not signed in");
    }
});

const logoutbtn = document.querySelector("#logout");
console.log(logoutbtn);
logoutbtn.addEventListener("click", () => {
console.log("Clicked logout btn");
logout();
});

// Fetch bus data for populating the dropdown
async function fetchBusData() {
    const busesRef = collection(db, `companies/${userId}/buses`);
    const busDocs = await getDocs(busesRef);
    return busDocs.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));
}

// Populate dropdown with buses
async function populateBusDropdown() {
    const buses = await fetchBusData();
    const busSelect = document.getElementById("busSelect");
    busSelect.innerHTML = "";  // Clear existing options

    buses.forEach((bus) => {
        const option = document.createElement("option");
        option.value = bus.id;
        option.textContent = bus.name || `Bus ${bus.id}`;
        busSelect.appendChild(option);
    });
}

// Fetch weekly revenue data for a selected bus
async function fetchWeeklyRevenueData(busId, userId) {
    const revenueData = [];
    const dateLabels = [];

    const dataRef = collection(db, `companies/${userId}/buses/${busId}/data`);
    
    // Fetch all documents in the collection, assuming doc.id is in date format like "November 19, 2024"
    const dataDocs = await getDocs(dataRef);
    
    dataDocs.forEach((doc) => {
        const data = doc.data();
        console.log("Document ID (Date):", doc.id);  // Log the document ID (date)
        console.log("Total Income:", data.total_income);  // Log the total_income field
        
        // Add to arrays
        dateLabels.push(doc.id);  // Using the document ID as the date label
        revenueData.push(data.total_income);  // Using total_income as the revenue value
    });

    // Sort by date if needed; assuming doc.id format is recognized as a date
    // This can be done if we want to enforce chronological order.

    return { revenueData, dateLabels };
}

// --- Chart Rendering ---

let totalRevenueChart;

async function renderTotalRevenueChart(busId) {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        console.error("User is not logged in");
        return;
    }

    // Fetch weekly revenue data with date labels and revenue data points
    const { revenueData, dateLabels } = await fetchWeeklyRevenueData(busId, userId);
    
    const ctx = document.getElementById('totalRevenueChart');

    // Destroy the previous instance of the chart if it exists
    if (totalRevenueChart) totalRevenueChart.destroy();

    // Create the new chart with fetched data
    totalRevenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [{
                label: 'Total Revenue',
                data: revenueData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.3,  // Smooth curve
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue (in PHP)',
                    },
                    ticks: {
                        stepSize: 500,  // Customize as needed
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                    }
                }
            }
        }
    });
}

// --- UI Interactions ---

document.addEventListener("DOMContentLoaded", async () => {
    const busSelect = document.getElementById("busSelect");

    // Listen for dropdown change to update the chart
    busSelect.addEventListener("change", () => {
        const busId = busSelect.value;
        renderTotalRevenueChart(busId);
    });
});

// Initial render for the first bus in the dropdown
async function renderInitialChart() {
    const busSelect = document.getElementById("busSelect");
    if (busSelect.options.length > 0) {
        renderTotalRevenueChart(busSelect.options[0].value);
    }
}
