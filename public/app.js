const map = L.map('map', {
    zoomControl: false,
    tap: true // Optimizes touch handling for iPad Safari
}).setView([22.2587, 71.1924], 7);

// Re-add zoom control to top-right for thumb accessibility on tablet
L.control.zoom({ position: 'topright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const districtLayerGroup = L.layerGroup().addTo(map);
const talukaLayerGroup = L.layerGroup().addTo(map);

async function loadStateData() {
    try {
        const response = await fetch('public/data/states/gujarat.json');
        const data = await response.json();
        
        Object.entries(data.districts).forEach(([districtName, districtData]) => {
            if (districtData.lat && districtData.lng) {
                // District Marker
                const districtMarker = L.marker([districtData.lat, districtData.lng]);
                
                districtMarker.bindPopup(`
                    <div style="font-size: 14px; padding: 4px;">
                        <b>District:</b> ${districtName}<br>
                        <b>Code:</b> ${districtData.code}<br>
                        <span style="color: #0078D7; cursor: pointer;">Tap to inspect talukas</span>
                    </div>
                `);

                // Interactive zoom and sub-layer trigger on iPad touch
                districtMarker.on('click', () => {
                    map.setView([districtData.lat, districtData.lng], 10, {
                        animate: true,
                        pan: { duration: 0.8 }
                    });
                });

                districtLayerGroup.addLayer(districtMarker);

                // Render Talukas if available
                if (districtData.talukas) {
                    Object.entries(districtData.talukas).forEach(([talukaName, talukaData]) => {
                        if (talukaData.lat && talukaData.lng) {
                            const talukaMarker = L.circleMarker([talukaData.lat, talukaData.lng], {
                                radius: 6,
                                color: '#1E3A8A',
                                fillColor: '#3B82F6',
                                fillOpacity: 0.8,
                                weight: 1.5
                            }).bindPopup(`
                                <div style="font-size: 13px; padding: 2px;">
                                    <b>Taluka:</b> ${talukaName}<br>
                                    <b>District:</b> ${districtName}<br>
                                    <b>ID:</b> ${talukaData.code}
                                </div>
                            `);

                            talukaLayerGroup.addLayer(talukaMarker);
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.error("Error loading state mapping matrix:", error);
    }
}

loadStateData();
