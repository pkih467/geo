// Load the Gujarat administrative data payload
fetch('public/data/states/gujarat.json')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup(feature.properties.name);
                }
                
                layer.on('click', function (e) {
                    console.log("Selected region:", feature.properties.name);
                });
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading regional data:', error));
