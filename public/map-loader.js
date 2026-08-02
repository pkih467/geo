document.addEventListener("DOMContentLoaded", function() {
    // 1. Initialize map with performance optimizations and zero lag settings
    var map = L.map('map', {
        maxZoom: 19,
        minZoom: 7,
        preferCanvas: true,
        fadeAnimation: false,
        zoomAnimation: false
    }).setView([22.2587, 71.1924], 7);

    // 2. Add high-detail OpenStreetMap tile layer with expanded tile buffering
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 7,
        keepBuffer: 12,
        updateWhenIdle: false,
        updateWhenZooming: false,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 3. Mount Panel securely
    var PanelControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function() {
            var container = document.getElementById('ui-container');
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            return container;
        }
    });
    map.addControl(new PanelControl());

    var globalData = null;
    var currentMarkersLayer = L.layerGroup().addTo(map);

    function clearMarkers() {
        currentMarkersLayer.clearLayers();
    }

    // 4. Fetch JSON Data
    fetch('data/states/gujarat.json')
        .then(function(response) {
            if (!response.ok) throw new Error('Could not find gujarat.json file.');
            return response.json();
        })
        .then(function(data) {
            globalData = data;
            var districtSelect = document.getElementById('district-select');
            
            districtSelect.innerHTML = '<option value="">-- Select District --</option>';
            var districts = data.districts || data.states || data;
            
            for (var districtName in districts) {
                if (districts.hasOwnProperty(districtName)) {
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

    // Helper to extract talukas safely
    function getTalukas(districtObj) {
        return districtObj.talukas || districtObj.subdistricts || districtObj.blocks || {};
    }

    // Helper to extract villages safely across various schema formats
    function getVillages(talukaObj) {
        if (!talukaObj) return null;
        return talukaObj.villages || talukaObj.vills || talukaObj.village_list || talukaObj.panchayats || talukaObj.panchayat_list || null;
    }

    // 5. District Change Handler
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

        var districtsContainer = globalData.districts || globalData.states || globalData;
        var district = districtsContainer[districtName];
        var talukas = getTalukas(district);
        var bounds = [];

        for (var talukaName in talukas) {
            if (talukas.hasOwnProperty(talukaName)) {
                var taluka = talukas[talukaName];
                
                var opt = document.createElement('option');
                opt.value = talukaName;
                opt.textContent = talukaName;
                talukaSelect.appendChild(opt);

                if (taluka && taluka.lat && taluka.lng) {
                    var marker = L.marker([taluka.lat, taluka.lng]).bindPopup("<b>Taluka:</b> " + talukaName);
                    marker.on('click', (function(dName, tName) {
                        return function() {
                            loadTaluka(dName, tName);
                        };
                    })(districtName, talukaName));
                    
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

    // 6. Taluka Loader Logic
    function loadTaluka(districtName, talukaName) {
        var talukaSelect = document.getElementById('taluka-select');
        var villageSelect = document.getElementById('village-select');
        talukaSelect.value = talukaName;

        villageSelect.innerHTML = '<option value="">-- Select Village/Panchayat --</option>';
        villageSelect.disabled = true;
        clearMarkers();

        if (!talukaName) return;

        var districtsContainer = globalData.districts || globalData.states || globalData;
        var talukas = getTalukas(districtsContainer[districtName]);
        var taluka = talukas[talukaName];
        var villagesData = getVillages(taluka);

        if (villagesData && Object.keys(villagesData).length > 0) {
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
                        marker.on('click', (function(dName, tName, vName) {
                            return function() {
                                loadVillage(dName, tName, vName);
                            };
                        })(districtName, talukaName, villageName));

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
            if (taluka && taluka.lat && taluka.lng) {
                map.setView([taluka.lat, taluka.lng], 12);
            }
            villageSelect.innerHTML = '<option value="">-- No Village Nodes Added Yet --</option>';
        }
    }

    document.getElementById('taluka-select').addEventListener('change', function() {
        var districtName = document.getElementById('district-select').value;
        var talukaName = this.value;
        loadTaluka(districtName, talukaName);
    });

    // 7. Village Loader Logic
    function loadVillage(districtName, talukaName, villageName) {
        var villageSelect = document.getElementById('village-select');
        villageSelect.value = villageName;

        if (!villageName) return;

        var districtsContainer = globalData.districts || globalData.states || globalData;
        var talukas = getTalukas(districtsContainer[districtName]);
        var villagesData = getVillages(talukas[talukaName]);
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
    }

    document.getElementById('village-select').addEventListener('change', function() {
        var districtName = document.getElementById('district-select').value;
        var talukaName = document.getElementById('taluka-select').value;
        var villageName = this.value;
        loadVillage(districtName, talukaName, villageName);
    });
});
