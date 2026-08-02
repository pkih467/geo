document.addEventListener("DOMContentLoaded", function() {
    var map = L.map('map').setView([22.2587, 71.1924], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    fetch('data/states/gujarat.json')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(function(data) {
            var districts = data.districts;
            for (var districtName in districts) {
                if (districts.hasOwnProperty(districtName)) {
                    var district = districts[districtName];
                    var talukas = district.talukas;
                    
                    for (var talukaName in talukas) {
                        if (talukas.hasOwnProperty(talukaName)) {
                            var taluka = talukas[talukaName];
                            
                            var marker = L.marker([taluka.lat, taluka.lng]).addTo(map);
                            
                            var popupContent = "<b>Taluka:</b> " + talukaName + 
                                               "<br><b>District:</b> " + districtName + 
                                               "<br><b>Code:</b> " + taluka.code;
                            marker.bindPopup(popupContent);
                            
                            (function(lat, lng) {
                                marker.on('click', function() {
                                    map.setView([lat, lng], 11);
                                });
                            })(taluka.lat, taluka.lng);
                        }
                    }
                }
            }
        })
        .catch(function(error) {
            console.error('Failed to load map data:', error);
        });
});
