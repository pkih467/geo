// Load and fit Gujarat GeoJSON boundaries with bold styling
fetch('data/states/gujarat.json')
    .then(response => response.json())
    .then(data => {
        let geojsonLayer = L.geoJSON(data, {
            style: {
                color: '#e74c3c',      // Bold red boundary lines for high visibility
                weight: 3,             // Thick, clear lines
                fillColor: '#3498db',  // Soft blue fill
                fillOpacity: 0.2       // Semi-transparent
            },
            onEachFeature: function (feature, layer) {
                let regionName = feature.properties.name || feature.properties.DISTRICT || "Region";
                layer.bindPopup("<b>" + regionName + "</b>");
                
                layer.on('click', function (e) {
                    console.log("Selected region:", regionName);
                    layer.openPopup();
                });
            }
        }).addTo(map);

        // Automatically zoom and center the map right onto Gujarat's boundaries
        map.fitBounds(geojsonLayer.getBounds());
    })
    .catch(error => console.error('Error loading regional data:', error));

