document.addEventListener("DOMContentLoaded", function() {
    var map = L.map('map').setView([22.2587, 71.1924], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var globalData = null;
    var currentMarker = null;

    function setMapFocus(lat, lng, zoomLevel, popupText) {
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        map.setView([lat, lng], zoomLevel);
        currentMarker = L.marker([lat, lng]).addTo(map);
        currentMarker.bindPopup(popupText).openPopup();
    }

    fetch('data/states/gujarat.json')
        .then(function(response) {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(function(data) {
            globalData = data;
            var districtSelect = document.getElementById('district-select');
            
            // Populate Districts
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
            console.error('Failed to load map data:', error);
        });

    // District Change Handler
    document.getElementById('district-select').addEventListener('change', function() {
        var districtName = this.value;
        var talukaSelect = document.getElementById('taluka-select');
        var villageSelect = document.getElementById('village-select');

        talukaSelect.innerHTML = '<option value="">-- Select Taluka --</option>';
        talukaSelect.disabled = true;
        villageSelect.innerHTML = '<option value="">-- Select Village --</option>';
        villageSelect.disabled = true;

        if (!districtName) return;

        var district = globalData.districts[districtName];
        
        // Zoom out to district level center (approximate using first taluka or default)
        // Populate Talukas
        for (var talukaName in district.talukas) {
            if (district.talukas.hasOwnProperty(talukaName)) {
                var opt = document.createElement('option');
                opt.value = talukaName;
                opt.textContent = talukaName;
                talukaSelect.appendChild(opt);
            }
        }
        talukaSelect.disabled = false;

        // Auto-zoom to first available taluka or center point if coordinates exist
        var firstTalukaKey = Object.keys(district.talukas)[0];
        if (firstTalukaKey) {
            var t = district.talukas[firstTalukaKey];
            setMapFocus(t.lat, t.lng, 9, "<b>District:</b> " + districtName);
        }
    });

    // Taluka Change Handler
    document.getElementById('taluka-select').addEventListener('change', function() {
        var districtName = document.getElementById('district-select').value;
        var talukaName = this.value;
        var villageSelect = document.getElementById('village-select');

        villageSelect.innerHTML = '<option value="">-- Select Village --</option>';
        villageSelect.disabled = true;

        if (!talukaName) return;

        var taluka = globalData.districts[districtName].talukas[talukaName];
        setMapFocus(taluka.lat, taluka.lng, 11, "<b>Taluka:</b> " + talukaName + "<br><b>Code:</b> " + taluka.code);

        // If your JSON includes nested villages, populate them here:
        if (taluka.villages) {
            for (var villageName in taluka.villages) {
                if (taluka.villages.hasOwnProperty(villageName)) {
                    var opt = document.createElement('option');
                    opt.value = villageName;
                    opt.textContent = villageName;
                    villageSelect.appendChild(opt);
                }
            }
            villageSelect.disabled = false;
        }
    });

    // Village Change Handler (if village data structure exists)
    document.getElementById('village-select').addEventListener('change', function() {
        var districtName = document.getElementById('district-select').value;
        var talukaName = document.getElementById('taluka-select').value;
        var villageName = this.value;

        if (!villageName) return;

        var village = globalData.districts[districtName].talukas[talukaName].villages[villageName];
        if (village && village.lat && village.lng) {
            setMapFocus(village.lat, village.lng, 14, "<b>Village:</b> " + villageName);
        }
    });
});
