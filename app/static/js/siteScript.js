// Document Elements
const resultsArea = document.getElementById("resultsArea");
const searchBar = document.getElementById("searchBar");
const searchArea = document.getElementById("searchArea");
const submitButton = document.getElementById("submitButton");
const map = L.map('map').setView([-34.37, 150.91], 7);
let cardId = 0;

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let markers = []; // Store all markers
let locations = []; // Store all locations data

// Fetch locations from the server and add markers to the map
fetch('/locations')
    .then(response => response.json())
    .then(data => {
        locations = data; // Store the data in the global variable
        locations.forEach((location, i) => {
            var result = JSON.parse(location.result);
            var iconClass = 'green-icon'; // Default color
            if (result.damaged_containers > 0) {
                iconClass = 'red-icon';
            } else if (result.overflowing_containers > 0) {
                iconClass = 'yellow-icon';
            }
            var icon = L.divIcon({
                className: 'marker-icon ' + iconClass,
                iconSize: [10, 10]
            });
            var marker = L.marker([location.latitude, location.longitude], { icon: icon })
                .addTo(map)
                .bindPopup(
                    "<b>Site:</b><br />" +
                    // <img style="height: 80px;" src="${imageAddress}" class="cardImage"></img> + 
                    "Job/Customer ID: " + location.customer_id + "<br />" +
                    "Date: " + location.datetime.split(' ')[0] + "<br />" +
                    "Time: " + location.datetime.split(' ')[1] + "<br /><br />" +
                    "<b>Container info:</b><br />" +
                    "Container total: " + result.total_containers + "<br />" +
                    (result.overflowing_containers > 0 ? "Overflowed: " + result.overflowing_containers + "<br />" : "") +
                    (result.damaged_containers > 0 ? "Damaged: " + result.damaged_containers + "<br />" : "")
                );
            marker.id = location.id; // Assign a unique ID to each marker
            markers.push(marker); // Store the marker reference
            addCard(location); // Add a card for each location
        });
    });

const addCard = (location) => {
    var result = JSON.parse(location.result);
    const resultsArea = document.getElementById('resultsArea');
    const siteDate = location.datetime.split(' ')[0];
    const siteTime = location.datetime.split(' ')[1];
    let imageAddress = "http://allotrac-hackathon-datasets.s3-website-ap-southeast-2.amazonaws.com/images/" + location.filename;

    // Create a new card element
    const card = document.createElement('div');
    card.className = 'card';

    // Create the card content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    cardContent.innerHTML = `
            <div class="card-icon">
            <img src="static/imgs/dark-logo-no-text.png" alt="Highlight Icon" class="highlight-icon">   
            </div>
            <div class="card-image">
                <img src="${imageAddress}" alt="Card Image" onclick="openPopup('${imageAddress}')">
            </div>
            <div class="card-info">
            <p class="tableText"><b>Location info</b></p>
            <p class="tableText">Customer ID: ${location.customer_id}</p>
            <p class="tableText">Date: ${siteDate}</p>
            <p class="tableText">Time: ${siteTime}</p>
            </div>
            <div class="card-stats">
            <p class="tableText"><b>Container info</b></p>
            <p class="tableText">Total: ${result.total_containers}</p>
            ${result.overflowing_containers > 0 ? `<p class="tableText">Overflowed: ${result.overflowing_containers}</p>` : ""}
            ${result.damaged_containers > 0 ? `<p class="tableText">Mishandled: ${result.damaged_containers}</p>` : ""}
            </div>
        `;
    // Append the card content to the card
    card.appendChild(cardContent);

    // Append the card to the results area
    resultsArea.appendChild(card);

    // Add the click event listener to the highlight icon
    const highlightIcon = card.querySelector('.highlight-icon');
    highlightIcon.addEventListener('click', () => {
        highlightMarker(location.id);
    });
};

const highlightMarker = (id) => {
    markers.forEach(marker => {
        if (marker.id === id) {
            // Highlight the marker, e.g., by opening its popup
            marker.openPopup();
        } else {
            // Optionally, reset other markers to their default state
            marker.closePopup(); // Example: close the popup of other markers
        }
    });
};

// Function to open the popup
const openPopup = (imageSrc) => {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.innerHTML = `<img src="${imageSrc}" class="popup-image">`;
    overlay.onclick = () => {
        document.body.removeChild(overlay);
    };
    document.body.appendChild(overlay);
    overlay.style.display = 'flex';
};

// Close the popup when the user clicks outside of the image
window.onclick = (event) => {
    const overlay = document.querySelector('.popup-overlay');
    if (event.target === overlay) {
        overlay.style.display = 'none';
    }
};

// Search and filter markers and cards
function searchMarkers() {
    let searchInput = searchBar.value.toLowerCase();

    // Hide all markers
    markers.forEach(marker => marker.remove());

    // Get all cards
    const cards = document.querySelectorAll('.card');

    // Hide all cards
    cards.forEach(card => card.style.display = 'none'); // Use 'display: none' to hide cards

    // Show markers and cards that match the search input
    locations.forEach((location, index) => {
        if (location.customer_id.toLowerCase().includes(searchInput)) {
            markers[index].addTo(map);
            cards[index].style.display = 'block'; // Show the corresponding card
        }
    });
}


// Function to clear the search results
function clearSearch() {
    markers.forEach(marker => marker.addTo(map)); // Show all markers

    // Show all cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => card.style.display = ''); // Use 'display: block' to show cards

    searchBar.value = ""; // Clear the search input
}

// Event Listeners
submitButton.addEventListener("click", searchMarkers);
searchBar.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent form submission
        searchMarkers();
    }
});
clearButton.addEventListener("click", clearSearch);