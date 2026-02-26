import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AddressAutocomplete from '../components/AddressAutocomplete';
import api from '../services/api';

// Map Mapbox region names → MALAYSIA_STATES values
const REGION_MAP = {
  'Wilayah Persekutuan Kuala Lumpur': 'Kuala Lumpur',
  'Federal Territory of Kuala Lumpur': 'Kuala Lumpur',
  'Wilayah Persekutuan Labuan': 'Labuan',
  'Federal Territory of Labuan': 'Labuan',
  'Wilayah Persekutuan Putrajaya': 'Putrajaya',
  'Federal Territory of Putrajaya': 'Putrajaya',
  'Pulau Pinang': 'Penang',
  'Penang Island': 'Penang',
};

function matchState(region) {
  if (!region) return '';
  if (REGION_MAP[region]) return REGION_MAP[region];
  // Direct match
  const found = MALAYSIA_STATES.find(
    (s) => s.toLowerCase() === region.toLowerCase() || region.toLowerCase().includes(s.toLowerCase()),
  );
  return found ?? '';
}

const MALAYSIA_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan',
  'Melaka', 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak',
  'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SERVICES = [
  'Oil Change', 'Major Service', 'Tyre Change', 'Accessories',
  'General Repairs', 'Diagnostics', 'Brake Service', 'Engine Tuning',
  'Aircond Service', 'Battery Service',
];

const defaultDay = (off = false) => ({ opensAt: '09:00', closesAt: '18:00', off });

const initialSchedule = Object.fromEntries(
  DAYS.map((day) => [day, defaultDay(day === 'Sunday')])
);

const initialForm = {
  name: '', address: '', state: '', latitude: '', longitude: '',
  phone: '', description: '', images: ''
};

function InputIcon({ icon }) {
  return (
    <span className="material-icons pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
      {icon}
    </span>
  );
}

function IconInput({ icon, className = '', ...props }) {
  return (
    <div className="relative">
      <InputIcon icon={icon} />
      <input {...props} className={`w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-slate-500 focus:outline-none ${className}`} />
    </div>
  );
}

function Dropzone({ value, onChange }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const readFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    readFile(e.dataTransfer.files[0]);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${dragging ? 'border-slate-500 bg-slate-50' : 'border-slate-300 hover:border-slate-400'}`}
      >
        {value && value.startsWith('data:image') ? (
          <img src={value} alt="Preview" className="max-h-40 rounded-lg object-cover" />
        ) : (
          <>
            <span className="material-icons text-4xl text-slate-400">cloud_upload</span>
            <p className="mt-2 text-sm text-slate-500">Drag & drop an image here, or click to select</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files[0])} />
      </div>
      <div className="relative">
        <InputIcon icon="link" />
        <input
          type="url"
          placeholder="Or paste an image URL"
          value={value && !value.startsWith('data:') ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      {value && !value.startsWith('data:') && (
        <img src={value} alt="URL Preview" className="h-32 w-full rounded-lg object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
      )}
    </div>
  );
}

export default function CreateWorkshopPage() {
  return (
    <main className="container-page">
      <section className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="mb-6 text-2xl font-semibold">Add Workshop</h1>
        <CreateWorkshopForm />
      </section>
    </main>
  );
}

export function CreateWorkshopForm({ embedded = false, onCreated }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [selectedServices, setSelectedServices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleService = (s) =>
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const setDayField = (day, key, value) =>
    setSchedule((s) => ({ ...s, [day]: { ...s[day], [key]: value } }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Derive opensAt/closesAt from first non-off weekday for legacy compat
      const firstOpen = DAYS.slice(0, 5).find((d) => !schedule[d].off);
      const opensAt = firstOpen ? schedule[firstOpen].opensAt : '09:00';
      const closesAt = firstOpen ? schedule[firstOpen].closesAt : '18:00';

      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        opensAt,
        closesAt,
        schedule: JSON.stringify(schedule),
        services: JSON.stringify(selectedServices),
      };
      const { data } = await api.post('/workshops', payload);
      if (typeof onCreated === 'function') {
        onCreated(data);
      } else {
        navigate(`/workshops/${data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create workshop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={embedded ? 'space-y-4' : 'space-y-4'}>

          {/* Basic Info */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Basic Info</p>
            <IconInput required icon="store" type="text" placeholder="Workshop name" value={form.name} onChange={setField('name')} />
            <AddressAutocomplete
              value={form.address}
              placeholder="Search address or place name…"
              onChange={(val) => setForm((f) => ({ ...f, address: val }))}
              onSelect={({ address, name, latitude, longitude, region }) => {
                setForm((f) => ({
                  ...f,
                  address,
                  name: name || f.name,
                  latitude: String(latitude),
                  longitude: String(longitude),
                  state: matchState(region) || f.state,
                }));
              }}
            />

            {/* State dropdown */}
            <div className="relative">
              <span className="material-icons pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">map</span>
              <select
                required
                value={form.state}
                onChange={setField('state')}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="" disabled>Select state</option>
                {MALAYSIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <IconInput required icon="phone" type="text" placeholder="Phone number" value={form.phone} onChange={setField('phone')} />
          </div>

          {/* Coordinates — auto-filled by address autocomplete, but still editable */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Coordinates</p>
            <div className="grid grid-cols-2 gap-3">
              <IconInput required icon="gps_fixed" type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={setField('latitude')} />
              <IconInput required icon="gps_not_fixed" type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={setField('longitude')} />
            </div>
            <p className="text-xs text-slate-400">Auto-filled when you pick an address above. You can adjust manually if needed.</p>
          </div>

          {/* Services */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Services Offered</p>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => {
                const checked = selectedServices.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      checked
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Operating Hours</p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <div className="min-w-[420px]">
                {DAYS.map((day, i) => (
                  <div key={day} className={`flex items-center gap-3 px-3 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <span className="w-24 shrink-0 text-sm font-medium text-slate-700">{day}</span>
                    {schedule[day].off ? (
                      <span className="flex-1 text-sm text-slate-400 italic">Off day</span>
                    ) : (
                      <div className="flex flex-1 items-center gap-2">
                        <span className="material-icons text-[16px] text-slate-400">schedule</span>
                        <input
                          type="time"
                          value={schedule[day].opensAt}
                          onChange={(e) => setDayField(day, 'opensAt', e.target.value)}
                          className="rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none"
                        />
                        <span className="text-slate-400">–</span>
                        <input
                          type="time"
                          value={schedule[day].closesAt}
                          onChange={(e) => setDayField(day, 'closesAt', e.target.value)}
                          className="rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setDayField(day, 'off', !schedule[day].off)}
                      className={`ml-auto shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${schedule[day].off ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                    >
                      <span className="material-icons text-[14px]">{schedule[day].off ? 'block' : 'check_circle'}</span>
                      {schedule[day].off ? 'Off' : 'Open'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Details</p>
            <div className="relative">
              <span className="material-icons pointer-events-none absolute left-3 top-3 text-[20px] text-slate-400">description</span>
              <textarea
                required
                rows={3}
                placeholder="Description of services offered"
                value={form.description}
                onChange={setField('description')}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Image */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Workshop Image</p>
            <Dropzone value={form.images} onChange={(val) => setForm((f) => ({ ...f, images: val }))} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-slate-700 transition-colors"
          >
            {loading ? 'Saving…' : 'Create Workshop'}
          </button>
        </form>
  );
}
