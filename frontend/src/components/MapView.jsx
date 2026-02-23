import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Link } from 'react-router-dom';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

export default function MapView({ workshops }) {
  if (!workshops.length) {
    return null;
  }

  const center = [workshops[0].latitude, workshops[0].longitude];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-[360px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {workshops.map((workshop) => (
          <Marker key={workshop.id} position={[workshop.latitude, workshop.longitude]}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{workshop.name}</p>
                <p className="text-xs">{workshop.address}</p>
                <Link to={`/workshops/${workshop.id}`} className="text-xs text-blue-600 underline">
                  Open details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
