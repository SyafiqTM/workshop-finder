import { useRef } from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['places'];

/**
 * Address autocomplete powered by Google Places API.
 *
 * Props:
 *   value       – controlled string value shown in the input
 *   onChange    – called with the raw string as the user types
 *   onSelect    – called with { address, latitude, longitude, region }
 *                 when the user picks a suggestion
 *   placeholder – optional input placeholder
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search address or place name…',
}) {
  const autocompleteRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_KEY ?? '',
    libraries: LIBRARIES,
  });

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry) return;

    const latitude = place.geometry.location.lat();
    const longitude = place.geometry.location.lng();
    const address = place.formatted_address ?? place.name ?? '';
    const name = place.name ?? '';

    // Extract state/region from address_components
    const regionComp = place.address_components?.find((c) =>
      c.types.includes('administrative_area_level_1'),
    );
    const region = regionComp?.long_name ?? '';

    onChange?.(address);
    onSelect?.({ address, name, latitude, longitude, region });
  };

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="relative">
        <span className="material-icons pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">location_on</span>
        <input
          type="text"
          required
          placeholder="Add VITE_GOOGLE_MAPS_API_KEY to .env to enable autocomplete"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-slate-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-amber-600">⚠ Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> to enable autocomplete.</p>
      </div>
    );
  }

  if (loadError) {
    return <p className="text-sm text-red-500">Failed to load Google Maps.</p>;
  }

  if (!isLoaded) {
    return (
      <div className="relative">
        <span className="material-icons pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">location_on</span>
        <input disabled placeholder="Loading…" className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-400" />
      </div>
    );
  }

  return (
    <Autocomplete
      onLoad={(ref) => { autocompleteRef.current = ref; }}
      onPlaceChanged={handlePlaceChanged}
      options={{ componentRestrictions: { country: 'my' }, fields: ['formatted_address', 'name', 'geometry', 'address_components'] }}
    >
      <div className="relative">
        <span className="material-icons pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">location_on</span>
        <input
          type="text"
          required
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
    </Autocomplete>
  );
}
