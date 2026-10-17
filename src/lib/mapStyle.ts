// Night-time map styling to match the page: indigo ground, quiet roads, the Ganga in deep blue.
// Shop and business pins are hidden so the pandals stand out; metro and rail stations stay.
export const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1b1846' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9d97c4' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#15123a' }, { weight: 3 }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#7e78a8' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#1f2a4c' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2661' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#352f78' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#433a8e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#7e78a8' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f2a6a' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#c9c3ea' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c2448' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5a7fb3' }] },
]
