// Initialize the Leaflet map centered on Gujarat
const map = L.map('map').setView([22.2587, 71.1924], 7);

// Add base map tiles (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Layer group to hold map markers so we can clear them easily if needed
const markersLayer = L.layerGroup().addTo(map);

// Function to load and render Gujarat data
async function loadGujaratData() {
    try {
        const response = await fetch('public/data/states/gujarat.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Gujarat data loaded successfully:", data.state);

        // Iterate through each district in Gujarat
        Object.entries(data.districts).forEach(([districtName, districtData]) => {
            // Check if coordinates exist for the district
            if (districtData.lat && districtData.lng) {
                // Add a marker for the district
                const marker = L.marker([districtData.lat, districtData.lng])
                    .bindPopup(`<b>District:</b> ${districtName}`);
                
                markersLayer.addLayer(marker);
            }

            // Optional: Loop through talukas if they have been populated
            if (districtData.talukas) {
                Object.entries(districtData.talukas).forEach(([talukaName, talukaData]) => {
                    if (talukaData.lat && talukaData.lng) {
                        const talukaMarker = L.circleMarker([talukaData.lat, talukaData.lng], {
                            radius: 4,
                            color: '#ff7800',
                            fillColor: '#ff7800',
                            fillOpacity: 0.8
                        }).bindPopup(`<b>District:</b> ${districtName}<br><b>Taluka:</b> ${talukaName}`);
                        
                        markersLayer.addLayer(talukaMarker);
                    }
                });
            }
        });

    } catch (error) {
        console.error("Failed to load Gujarat data:", error);
    }
}

// Run the function on page load
loadGujaratData();
