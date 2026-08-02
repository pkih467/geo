document.addEventListener("DOMContentLoaded", function() {
    // Initialize map centered over Gujarat
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

    // Load the JSON data structure
    fetch('data/states/gujarat.json')
        .then(function(response) {
            if (!response.ok) throw new Error('Network response was not ok');
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
            console.error('Failed to load map data:', error);
        });

    // District Dropdown Change Event
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
        
        for (var talukaName in district.talukas) {
            if (district.talukas.hasOwnProperty(talukaName)) {
                var opt = document.createElement('option');
                opt.value = talukaName;
                opt.textContent = talukaName;
                talukaSelect.appendChild(opt);
            }
        }
        talukaSelect.disabled = false;

        // Zoom into district level if coordinates are present
        if (district.lat && district.lng) {
            setMapFocus(district.lat, district.lng, 9, "<b>District:</b> " + districtName);
        }
    });

    // Taluka Dropdown Change Event
    document.getElementById('taluka-select').addEventListener('change', function() {
        var districtName = document.getElementById('district-select').value;
        var talukaName = this.value;
        var villageSelect = document.getElementById('village-select');

        villageSelect.innerHTML = '<option value="">-- Select Village --</option>';
        villageSelect.disabled = true;

        if (!talukaName) return;

        var taluka = globalData.districts[districtName].talukas[talukaName];
        setMapFocus(taluka.lat, taluka.lng, 11, "<b>Taluka:</b> " + talukaName);

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

    // Village Dropdown Change Event
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
