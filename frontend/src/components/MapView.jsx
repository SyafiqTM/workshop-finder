import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { getOpenStatus, getWeeklySchedule } from '../utils/openingHours.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

function FlyToExternalLocation({ externalUserCoords }) {
  const map = useMap();

  useEffect(() => {
    if (!externalUserCoords) {
      return;
    }

    map.flyTo([externalUserCoords.lat, externalUserCoords.lng], 13);
  }, [externalUserCoords, map]);

  return null;
}

export default function MapView({
  workshops,
  externalUserCoords = null
}) {
  const displayUserPosition = externalUserCoords ? [externalUserCoords.lat, externalUserCoords.lng] : null;

  const setapakCenter = [3.1982, 101.7305];
  const mapCenter = displayUserPosition || setapakCenter;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="h-[360px] w-full">
        <FlyToExternalLocation externalUserCoords={externalUserCoords} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {displayUserPosition && (
          <>
            <Marker position={displayUserPosition}>
              <Popup>Your current location</Popup>
            </Marker>
            <Circle center={displayUserPosition} radius={5000} />
          </>
        )}

        {workshops.map((workshop) => {
          const openStatus = getOpenStatus(workshop.opensAt, workshop.closesAt);
          const weeklySchedule = getWeeklySchedule(workshop.opensAt, workshop.closesAt);
          const statusColorClass =
            openStatus.isOpen === null ? 'text-slate-600' : openStatus.isOpen ? 'text-emerald-600' : 'text-red-600';

          return (
            <Marker key={workshop.id} position={[workshop.latitude, workshop.longitude]}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{workshop.name}</p>
                  <p className="text-xs">{workshop.address}</p>
                  <p className={`text-xs font-medium ${statusColorClass}`}>{openStatus.message}</p>
                  <div className="mt-2 text-xs text-slate-600">
                    <p className="font-medium text-slate-700">Hours</p>
                    {weeklySchedule.map((day) => (
                      <ul key={day.key}>
                        <li>
                          {day.label}: {day.isClosed ? 'Closed' : `${day.opensAt} - ${day.closesAt}`}
                        </li>
                      </ul>
                    ))}
                    {!weeklySchedule.length && <p className="mt-1">Hours not available</p>}
                  </div>
                  <Link to={`/workshops/${workshop.id}`} className="text-xs text-blue-600 underline">
                    Open details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => {
            if (isTracking) {
              setIsTracking(false);
              onTrackingToggle(false);
              return;
            }

            setLocationError('');
            setIsTracking(true);
            onTrackingToggle(true);
          }}
          className="pointer-events-auto rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow"
        >
          {isTracking ? 'Stop Tracking' : 'My Location'}
        </button>
        {locationError && (
          <p className="pointer-events-auto rounded-md bg-red-50 px-2 py-1 text-xs text-red-600">{locationError}</p>
        )}
      </div> */}
    </div>
  );
}
