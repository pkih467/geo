document.addEventListener("DOMContentLoaded", function() {
    // 1. Initialize the map centered over Gujarat
    var map = L.map('map', {
        maxZoom: 19,
        minZoom: 7
    }).setView([22.2587, 71.1924], 7);

    // 2. Add the background map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 3. Attach the floating HTML panel to the top right of the map interface
    var PanelControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function() {
            return document.getElementById('ui-container');
        }
    });
    map.addControl(new PanelControl());

    var globalData = null;
    var currentMarkersLayer = L.layerGroup().addTo(map);

    function clearMarkers() {
        currentMarkersLayer.clearLayers();
    }

    // 4. Load your gujarat.json data file automatically
    fetch('data/states/gujarat.json')
        .then(function(response) {
            if (!response.ok) throw new Error('Could not find gujarat.json file.');
            return response.json();
        })
        .then(function(data) {
            globalData = data;
            var districtSelect = document.getElementById('district-select');
            
            districtSelect.innerHTML = '<option value="">-- Select District --</option>';
            for (var districtName in data.districts) {
                if (data.districts.hasOwnProperty(districtName)) {
                    var opt = document.createElement('option');
                    opt.value = districtName;
                    opt.textContent = districtName;
                    districtSelect.appendChild(opt);
                }
            }
            districtSelect.disabled = false;
        })
        .catch(function(error) {
            console.error('Data loading error:', error);
            document.getElementById('district-select').innerHTML = '<option value="">Error Loading Data</option>';
        });

    // 5. Handle District Selection Changes
    document.getElementById('district-select').addEventListener('change', function() {
        var districtName = this.value;
        var talukaSelect = document.getElementById('taluka-select');
        var villageSelect = document.getElementById('village-select');

        talukaSelect.innerHTML = '<option value="">-- Select Taluka --</option>';
        talukaSelect.disabled = true;
        villageSelect.innerHTML = '<option value="">-- Select Village/Panchayat --</option>';
        villageSelect.disabled = true;
        
        clearMarkers();

        if (!districtName) return;

        var district = globalData.districts[districtName];
        var bounds = [];

        for (var talukaName in district.talukas) {
            if (district.talukas.hasOwnProperty(talukaName)) {
                var taluka = district.talukas[talukaName];
                
                var opt = document.createElement('option');
                opt.value = talukaName;
                opt.textContent = talukaName;
                talukaSelect.appendChild(opt);

                if (taluka.lat && taluka.lng) {
                    var marker = L.marker([taluka.lat, taluka.lng]).bindPopup("<b>Taluka:</b> " + talukaName);
                    marker.on('click', (function(tName) {
                        return function() {
                            talukaSelect.value = tName;
                            talukaSelect.dispatchEvent(new Event('change'));
                        };
                    })(talukaName));
                    
                    currentMarkersLayer.addLayer(marker);
                    bounds.push([taluka.lat, taluka.lng]);
                }
            }
        }
        talukaSelect.disabled = false;

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
        }
    });

    // 6. Handle Taluka Selection Changes
    document.getElementById('taluka-select').addEventListener('change', function() {
        var districtName = document.getElementById('district-select').value;
        var talukaName = this.value;
        var villageSelect = document.getElementById('village-select');

        villageSelect.innerHTML = '<option value="">-- Select Village/Panchayat --</option>';
        villageSelect.disabled = true;
        clearMarkers();

        if (!talukaName) return;

        var taluka = globalData.districts[districtName].talukas[talukaName];
        var villagesData = taluka.villages || taluka.vills || taluka.village_list;

        if (villagesData) {
            var bounds = [];
            for (var villageName in villagesData) {
                if (villagesData.hasOwnProperty(villageName)) {
                    var village = villagesData[villageName];

                    var opt = document.createElement('option');
                    opt.value = villageName;
                    opt.textContent = villageName;
                    villageSelect.appendChild(opt);

                    if (village && village.lat && village.lng) {
                        var marker = L.marker([village.lat, village.lng]).bindPopup("<b>Village/Panchayat:</b> " + villageName);
                        marker.on('click', (function(vName) {
                            return function() {
                                villageSelect.value = vName;
                                villageSelect.dispatchEvent(new Event('change'));
                            };
                        })(villageName));

                        currentMarkersLayer.addLayer(marker);
                        bounds.push([village.lat, village.lng]);
                    }
                }
            }
            villageSelect.disabled = false;

            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
            }
        } else {
            if (taluka.lat && taluka.lng) {
                map.setView([taluka.lat, taluka.lng], 12);
            }
            villageSelect.innerHTML = '<option value="">-- No Village Nodes Added Yet --</option>';
        }
    });

    // 7. Handle Village Selection Changes (Deep Zoom)
    document.getElementById('village-select').addEventListener('change', function() {
        var districtName = document.getElementById('district-select').value;
        var talukaName = document.getElementById('taluka-select').value;
        var villageName = this.value;

        if (!villageName) return;

        var taluka = globalData.districts[districtName].talukas[talukaName];
        var villagesData = taluka.villages || taluka.vills || taluka.village_list;
        var village = villagesData ? villagesData[villageName] : null;

        if (village && village.lat && village.lng) {
            map.setView([village.lat, village.lng], 16);
            
            currentMarkersLayer.eachLayer(function(layer) {
                if (layer instanceof L.Marker) {
                    var latLng = layer.getLatLng();
                    if (Math.abs(latLng.lat - village.lat) < 0.0001 && Math.abs(latLng.lng - village.lng) < 0.0001) {
                        layer.openPopup();
                    }
                }
            });
        }
    });
});
