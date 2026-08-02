// Initialize map centered over India at the national overview level
var map = L.map('map').setView([22.5937, 78.9629], 5);

// Add OpenStreetMap base tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Centralized registry for available state files and their bounds/metadata
const stateRegistry = {
    "gujarat": {
        name: "Gujarat",
        file: "data/states/gujarat.json",
        center: [22.2587, 71.1924],
        zoom: 7
    }
    // Future states will be added here seamlessly as files are uploaded
};

let currentGeoJsonLayer = null;
let administrativeData = null;

// Create floating UI Control Container for hierarchical dropdowns
var uiControl = L.control({position: 'topright'});
uiControl.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'geo-ui-control');
    div.style.background = 'white';
    div.style.padding = '12px';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    div.style.fontFamily = 'sans-serif';
    div.style.minWidth = '220px';

    div.innerHTML = `
        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #2c3e50;">Administrative Navigation</h4>
        <div style="margin-bottom: 8px;">
            <label style="font-size: 12px; display: block; font-weight: bold; margin-bottom: 2px;">State</label>
            <select id="state-select" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
                <option value="">Select State...</option>
                <option value="gujarat">Gujarat</option>
            </select>
        </div>
        <div style="margin-bottom: 8px;">
            <label style="font-size: 12px; display: block; font-weight: bold; margin-bottom: 2px;">District</label>
            <select id="district-select" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #ccc;" disabled>
                <option value="">Select District...</option>
            </select>
        </div>
        <div>
            <label style="font-size: 12px; display: block; font-weight: bold; margin-bottom: 2px;">Taluka / Village</label>
            <select id="taluka-select" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #ccc;" disabled>
                <option value="">Select Taluka...</option>
            </select>
        </div>
    `;
    
    // Prevent map click events from triggering underneath the UI box on touch devices and desktop
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);
    return div;
};
uiControl.addTo(map);

// Event Listeners for Cascading Dropdowns
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'state-select') {
        let stateKey = e.target.value;
        if (stateKey) {
            loadState(stateKey);
        } else {
            resetViewToIndia();
        }
    } else if (e.target && e.target.id === 'district-select') {
        let districtName = e.target.value;
        filterByDistrict(districtName);
    } else if (e.target && e.target.id === 'taluka-select') {
        let talukaName = e.target.value;
        filterByTaluka(talukaName);
    }
});

function loadState(stateKey) {
    let config = stateRegistry[stateKey];
    if (!config) return;

    // Fetch the state file dynamically
    fetch(config.file)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            administrativeData = data;
            
            if (currentGeoJsonLayer) {
                map.removeLayer(currentGeoJsonLayer);
            }

            // Render GeoJSON onto the map
            currentGeoJsonLayer = L.geoJSON(data, {
                style: {
                    color: '#2c3e50',
                    weight: 2,
                    fillColor: '#3498db',
                    fillOpacity: 0.15
                },
                onEachFeature: function (feature, layer) {
                    let props = feature.properties || {};
                    let name = props.name || props.NAME || props.DISTRICT || props.district || "Region";
                    layer.bindPopup("<b>" + name + "</b>");
                    
                    layer.on('click', function (e) {
                        layer.openPopup();
                    });
                }
            }).addTo(map);

            // Center map on the state bounds safely
            try {
                let bounds = currentGeoJsonLayer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds);
                } else {
                    map.setView(config.center, config.zoom);
                }
            } catch (e) {
                map.setView(config.center, config.zoom);
            }

            // Populate District Dropdown
            populateDistricts(data);
        })
        .catch(err => console.error("Error loading state data:", err));
}

function populateDistricts(data) {
    let districtSelect = document.getElementById('district-select');
    if (!districtSelect) return;
    districtSelect.innerHTML = '<option value="">Select District...</option>';
    districtSelect.disabled = false;

    let talukaSelect = document.getElementById('taluka-select');
    if (talukaSelect) {
        talukaSelect.innerHTML = '<option value="">Select Taluka...</option>';
        talukaSelect.disabled = true;
    }

    // Extract unique districts from properties with proper casing/trimming support
    let districts = new Set();
    if (data && data.features) {
        data.features.forEach(feature => {
            let props = feature.properties || {};
            let dist = props.DISTRICT || props.district || props.DIST_NAME;
            if (dist) districts.add(String(dist).trim());
        });
    }

    // Sort alphabetically for clean UI presentation
    Array.from(districts).sort().forEach(dist => {
        let opt = document.createElement('option');
        opt.value = dist;
        opt.textContent = dist;
        districtSelect.appendChild(opt);
    });
}

function filterByDistrict(districtName) {
    let talukaSelect = document.getElementById('taluka-select');
    
    if (!districtName) {
        // Reset taluka dropdown and revert layer styles back to state default
        if (talukaSelect) {
            talukaSelect.innerHTML = '<option value="">Select Taluka...</option>';
            talukaSelect.disabled = true;
        }
        if (currentGeoJsonLayer) {
            currentGeoJsonLayer.setStyle({
                color: '#2c3e50',
                weight: 2,
                fillColor: '#3498db',
                fillOpacity: 0.15
            });
            map.fitBounds(currentGeoJsonLayer.getBounds());
        }
        return;
    }

    if (!currentGeoJsonLayer) return;

    if (talukaSelect) {
        talukaSelect.innerHTML = '<option value="">Select Taluka...</option>';
        talukaSelect.disabled = false;
    }

    let talukas = new Set();
    let group = new L.FeatureGroup();
    
    currentGeoJsonLayer.eachLayer(layer => {
        let props = layer.feature.properties || {};
        let dist = props.DISTRICT || props.district || props.DIST_NAME;
        
        if (dist && String(dist).trim() === String(districtName).trim()) {
            layer.setStyle({ fillColor: '#e67e22', fillOpacity: 0.4, weight: 3 });
            group.addLayer(layer);
            
            let tal = props.TALUKA || props.taluka || props.SUB_DIST || props.sub_district || props.NAME || props.name;
            if (tal) talukas.add(String(tal).trim());
        } else {
            layer.setStyle({ fillColor: '#bdc3c7', fillOpacity: 0.05, weight: 1 });
        }
    });

    if (talukaSelect) {
        Array.from(talukas).sort().forEach(tal => {
            let opt = document.createElement('option');
            opt.value = tal;
            opt.textContent = tal;
            talukaSelect.appendChild(opt);
        });
    }

    // Zoom bounds to the filtered district shapes safely
    if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds());
    }
}

function filterByTaluka(talukaName) {
    if (!talukaName || !currentGeoJsonLayer) return;

    let group = new L.FeatureGroup();
    currentGeoJsonLayer.eachLayer(layer => {
        let props = layer.feature.properties || {};
        let tal = props.TALUKA || props.taluka || props.SUB_DIST || props.sub_district || props.NAME || props.name;
        
        if (tal && String(tal).trim() === String(talukaName).trim()) {
            layer.setStyle({ fillColor: '#e74c3c', fillOpacity: 0.6, weight: 4 });
            group.addLayer(layer);
            layer.openPopup();
        } else {
            // Keep non-matching features muted
            let dist = props.DISTRICT || props.district || props.DIST_NAME;
            let currentSelectedDist = document.getElementById('district-select').value;
            if (dist && String(dist).trim() === String(currentSelectedDist).trim()) {
                layer.setStyle({ fillColor: '#e67e22', fillOpacity: 0.2, weight: 2 });
            } else {
                layer.setStyle({ fillColor: '#bdc3c7', fillOpacity: 0.05, weight: 1 });
            }
        }
    });

    if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds(), { maxZoom: 13 }); // Zoom deep down close to sub-district level
    }
}

function resetViewToIndia() {
    map.setView([22.5937, 78.9629], 5);
    if (currentGeoJsonLayer) {
        map.removeLayer(currentGeoJsonLayer);
        currentGeoJsonLayer = null;
    }
    let distSelect = document.getElementById('district-select');
    if (distSelect) {
        distSelect.innerHTML = '<option value="">Select District...</option>';
        distSelect.disabled = true;
    }
    let talukaSelect = document.getElementById('taluka-select');
    if (talukaSelect) {
        talukaSelect.innerHTML = '<option value="">Select Taluka...</option>';
        talukaSelect.disabled = true;
    }
}
