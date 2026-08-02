let map = L.map('map').setView([20.5937, 78.9629], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let currentLevel = 'state';
let selectedState = null;
let selectedDistrict = null;
let selectedTaluka = null;
let geoData = {};

const breadcrumb = document.getElementById('breadcrumb');
const backBtn = document.getElementById('back-btn');

fetch('/data/india_administrative.json')
  .then(res => res.json())
  .then(data => {
    geoData = data;
    renderStates();
  });

function renderStates() {
  currentLevel = 'state';
  breadcrumb.innerText = 'India > Select State';
  backBtn.style.display = 'none';
  map.setView([20.5937, 78.9629], 5);
  map.eachLayer(layer => { if (layer instanceof L.Marker || layer instanceof L.CircleMarker) map.removeLayer(layer); });

  Object.keys(geoData.states).forEach(stateName => {
    let stateObj = geoData.states[stateName];
    let marker = L.marker([stateObj.lat, stateObj.lng]).addTo(map);
    marker.bindPopup(`<b>State:</b> ${stateName}`);
    marker.on('click', () => {
      selectedState = stateName;
      renderDistricts(stateName);
    });
  });
}

function renderDistricts(stateName) {
  currentLevel = 'district';
  breadcrumb.innerText = `India > ${stateName} > Select District`;
  backBtn.style.display = 'block';
  let stateObj = geoData.states[stateName];
  map.setView([stateObj.lat, stateObj.lng], 7);
  map.eachLayer(layer => { if (layer instanceof L.Marker || layer instanceof L.CircleMarker) map.removeLayer(layer); });

  Object.keys(stateObj.districts).forEach(distName => {
    let distObj = stateObj.districts[distName];
    let marker = L.marker([distObj.lat, distObj.lng]).addTo(map);
    marker.bindPopup(`<b>District:</b> ${distName}`);
    marker.on('click', () => {
      selectedDistrict = distName;
      renderTalukas(stateName, distName);
    });
  });
}

function renderTalukas(stateName, distName) {
  currentLevel = 'taluka';
  breadcrumb.innerText = `India > ${stateName} > ${distName} > Select Taluka`;
  let distObj = geoData.states[stateName].districts[distName];
  map.setView([distObj.lat, distObj.lng], 9);
  map.eachLayer(layer => { if (layer instanceof L.Marker || layer instanceof L.CircleMarker) map.removeLayer(layer); });

  Object.keys(distObj.talukas).forEach(talukaName => {
    let talukaObj = distObj.talukas[talukaName];
    let marker = L.marker([talukaObj.lat, talukaObj.lng]).addTo(map);
    marker.bindPopup(`<b>Taluka:</b> ${talukaName}`);
    marker.on('click', () => {
      selectedTaluka = talukaName;
      renderVillages(stateName, distName, talukaName);
    });
  });
}

function renderVillages(stateName, distName, talukaName) {
  currentLevel = 'village';
  breadcrumb.innerText = `India > ${stateName} > ${distName} > ${talukaName} > Villages`;
  let talukaObj = geoData.states[stateName].districts[distName].talukas[talukaName];
  map.setView([talukaObj.lat, talukaObj.lng], 11);
  map.eachLayer(layer => { if (layer instanceof L.Marker || layer instanceof L.CircleMarker) map.removeLayer(layer); });

  talukaObj.villages.forEach(village => {
    let marker = L.circleMarker([village.lat, village.lng], { radius: 6, color: 'red' }).addTo(map);
    marker.bindPopup(`<b>Village:</b> ${village.name}`);
  });
}

backBtn.addEventListener('click', () => {
  if (currentLevel === 'district') renderStates();
  else if (currentLevel === 'taluka') renderDistricts(selectedState);
  else if (currentLevel === 'village') renderTalukas(selectedState, selectedDistrict);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => console.log('Service Worker Registered'));
}
