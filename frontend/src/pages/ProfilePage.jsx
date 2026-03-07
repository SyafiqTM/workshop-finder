import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api';

const ENGINE_OIL_INTERVAL_KM = 10000;
const ATF_INTERVAL_KM = 40000;
const DUE_SOON_BUFFER_KM = 1000;

function formatDateForInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function parseMileageInput(value) {
  if (value === '' || value === null || value === undefined) return null;

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return null;

  return parsed;
}

function formatMileage(value) {
  if (!Number.isInteger(value)) return '—';
  return `${value.toLocaleString()} km`;
}

function normalizeMileageRecords(records) {
  if (!Array.isArray(records)) return [];

  return records
    .map((record) => ({
      mileage: Number.parseInt(record?.mileage, 10),
      recordedAt: record?.recordedAt,
      note: record?.note || null
    }))
    .filter((record) => Number.isInteger(record.mileage) && record.mileage >= 0 && record.recordedAt)
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
}

function buildMileageNote(note, serviceEngineOil, serviceAtf) {
  const trimmedNote = note.trim();
  const serviceNotes = [];

  if (serviceEngineOil) serviceNotes.push('engine oil service');
  if (serviceAtf) serviceNotes.push('ATF / gearbox oil service');

  if (trimmedNote && serviceNotes.length > 0) {
    return `${trimmedNote} • ${serviceNotes.join(' + ')}`;
  }

  if (trimmedNote) return trimmedNote;
  if (serviceNotes.length > 0) return serviceNotes.join(' + ');

  return null;
}

function createMileageEntryForm(currentMileage = null) {
  return {
    mileage: Number.isInteger(currentMileage) ? String(currentMileage) : '',
    note: '',
    serviceEngineOil: false,
    serviceAtf: false
  };
}

function getServiceDue(currentMileage, lastServiceMileage, intervalMileage) {
  if (!Number.isInteger(currentMileage)) {
    return {
      title: 'Mileage needed',
      description: 'Add your latest odometer reading to calculate the next service.',
      tone: 'slate',
      nextDueMileage: Number.isInteger(lastServiceMileage) ? lastServiceMileage + intervalMileage : null
    };
  }

  if (!Number.isInteger(lastServiceMileage)) {
    return {
      title: 'Baseline needed',
      description: 'Record the last service mileage to start tracking this item.',
      tone: 'amber',
      nextDueMileage: null
    };
  }

  const nextDueMileage = lastServiceMileage + intervalMileage;
  const remaining = nextDueMileage - currentMileage;

  if (remaining < 0) {
    return {
      title: 'Overdue',
      description: `Overdue by ${Math.abs(remaining).toLocaleString()} km`,
      tone: 'red',
      nextDueMileage
    };
  }

  if (remaining <= DUE_SOON_BUFFER_KM) {
    return {
      title: 'Due soon',
      description: `${remaining.toLocaleString()} km remaining`,
      tone: 'amber',
      nextDueMileage
    };
  }

  return {
    title: 'On track',
    description: `${remaining.toLocaleString()} km remaining`,
    tone: 'emerald',
    nextDueMileage
  };
}

export default function ProfilePage() {
  const { user, refreshProfile, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [mileageError, setMileageError] = useState('');
  const [mileageSuccess, setMileageSuccess] = useState('');
  const [mileageModalOpen, setMileageModalOpen] = useState(false);
  const [mileageSaving, setMileageSaving] = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    carModel: '',
    birthday: ''
  });
  const [mileageEntryForm, setMileageEntryForm] = useState(createMileageEntryForm());

  const mileageRecords = useMemo(() => normalizeMileageRecords(user?.mileageRecords), [user?.mileageRecords]);
  const savedCurrentMileage = Number.isInteger(user?.currentMileage)
    ? user.currentMileage
    : mileageRecords[0]?.mileage ?? null;
  const previewCurrentMileage = savedCurrentMileage;
  const previewEngineOilMileage = user?.lastEngineOilChangeMileage ?? null;
  const previewAtfMileage = user?.lastAtfChangeMileage ?? null;
  const engineOilDue = getServiceDue(previewCurrentMileage, previewEngineOilMileage, ENGINE_OIL_INTERVAL_KM);
  const atfDue = getServiceDue(previewCurrentMileage, previewAtfMileage, ATF_INTERVAL_KM);

  useEffect(() => {
    refreshProfile().catch((requestError) => {
      setProfileError(requestError.response?.data?.message || 'Unable to load profile');
    });

    api.get('/reviews/user/my')
      .then((res) => setMyReviews(res.data))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        carModel: user.carModel || '',
        birthday: formatDateForInput(user.birthday)
      });
      setMileageEntryForm(createMileageEntryForm(user.currentMileage));
    }
  }, [user]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleMileageEntryChange(e) {
    const { name, value, type, checked } = e.target;
    setMileageEntryForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function openMileageModal() {
    setMileageError('');
    setMileageSuccess('');
    setMileageEntryForm(createMileageEntryForm(savedCurrentMileage));
    setMileageModalOpen(true);
  }

  function closeMileageModal() {
    if (mileageSaving) return;

    setMileageModalOpen(false);
    setMileageError('');
    setMileageEntryForm(createMileageEntryForm(savedCurrentMileage));
  }

  async function handleSave(e) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSaving(true);

    try {
      await updateProfile({
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || null,
        carModel: form.carModel.trim() || null,
        birthday: form.birthday || null
      });
      setProfileSuccess('Profile updated successfully.');
      setEditing(false);
    } catch (requestError) {
      setProfileError(requestError.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleMileageSave(e) {
    e.preventDefault();
    setMileageError('');
    setMileageSuccess('');
    setMileageSaving(true);

    const nextCurrentMileage = parseMileageInput(mileageEntryForm.mileage);

    if (!Number.isInteger(nextCurrentMileage)) {
      setMileageError('Please enter the current odometer reading.');
      setMileageSaving(false);
      return;
    }

    if (Number.isInteger(savedCurrentMileage) && nextCurrentMileage < savedCurrentMileage) {
      setMileageError('Current odometer cannot be lower than your latest saved mileage.');
      setMileageSaving(false);
      return;
    }

    const nextEngineOilMileage = mileageEntryForm.serviceEngineOil
      ? nextCurrentMileage
      : user?.lastEngineOilChangeMileage ?? null;
    const nextAtfMileage = mileageEntryForm.serviceAtf
      ? nextCurrentMileage
      : user?.lastAtfChangeMileage ?? null;

    if (Number.isInteger(nextEngineOilMileage) && nextEngineOilMileage > nextCurrentMileage) {
      setMileageError('Engine oil mileage cannot be greater than the current odometer.');
      setMileageSaving(false);
      return;
    }

    if (Number.isInteger(nextAtfMileage) && nextAtfMileage > nextCurrentMileage) {
      setMileageError('ATF / gearbox oil mileage cannot be greater than the current odometer.');
      setMileageSaving(false);
      return;
    }

    const nextMileageRecords = normalizeMileageRecords([
      {
        mileage: nextCurrentMileage,
        recordedAt: new Date().toISOString(),
        note: buildMileageNote(
          mileageEntryForm.note,
          mileageEntryForm.serviceEngineOil,
          mileageEntryForm.serviceAtf
        )
      },
      ...mileageRecords
    ]);

    try {
      await updateProfile({
        currentMileage: nextCurrentMileage,
        lastEngineOilChangeMileage: nextEngineOilMileage,
        lastAtfChangeMileage: nextAtfMileage,
        mileageRecords: nextMileageRecords
      });
      setMileageSuccess('Mileage history updated successfully.');
      setMileageModalOpen(false);
      setMileageEntryForm(createMileageEntryForm(nextCurrentMileage));
    } catch (requestError) {
      setMileageError(requestError.response?.data?.message || 'Failed to save mileage entry.');
    } finally {
      setMileageSaving(false);
    }
  }

  function handleCancel() {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        carModel: user.carModel || '',
        birthday: formatDateForInput(user.birthday)
      });
    }
    setProfileError('');
    setProfileSuccess('');
    setEditing(false);
  }

  return (
    <main className="container-page space-y-6">
      <div className="mx-auto w-full max-w-6xl grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Profile</h1>
          {!editing && (
            <button
              onClick={() => {
                setProfileSuccess('');
                setProfileError('');
                setEditing(true);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {profileError && <p className="mt-3 text-sm text-red-600">{profileError}</p>}
        {profileSuccess && <p className="mt-3 text-sm text-green-600">{profileSuccess}</p>}

        {user && !editing && (
          <>
            <dl className="mt-4 divide-y divide-slate-100 text-sm text-slate-700">
              <ProfileRow label="Name" value={user.name} />
              <ProfileRow label="Email" value={user.email} note="(cannot be changed)" />
              <ProfileRow label="Phone" value={user.phone || '—'} />
              <ProfileRow label="Car Model" value={user.carModel || '—'} />
              <ProfileRow
                label="Birthday"
                value={user.birthday ? new Date(user.birthday).toLocaleDateString() : '—'}
              />
            </dl>
          </>
        )}

        {user && editing && (
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            {/* Email — read-only */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-400">Email is tied to your account and cannot be changed.</p>
            </div>

            <FormField
              label="Name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your full name"
            />

            <FormField
              label="Phone Number"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. +60 12-345 6789"
            />

            <FormField
              label="Car Model"
              name="carModel"
              type="text"
              value={form.carModel}
              onChange={handleChange}
              placeholder="e.g. Toyota Vios 2021"
            />

            <FormField
              label="Birthday"
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={handleChange}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* My Reviews */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">My Reviews</h2>

        {reviewsLoading && <p className="mt-3 text-sm text-slate-500">Loading reviews…</p>}

        {!reviewsLoading && myReviews.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">You have not submitted any reviews yet.</p>
        )}

        {!reviewsLoading && myReviews.length > 0 && (
          <div className="mt-4 space-y-3">
            {myReviews.map((review) => (
              <article key={review.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{review.workshop?.name}</span>
                  <ReviewStatusBadge status={review.status} />
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= review.rating ? 'text-yellow-400' : 'text-slate-300'}>★</span>
                  ))}
                </div>
                <p className="mt-1 text-slate-600">{review.comment}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Mileage History</h2>
            <p className="mt-1 text-sm text-slate-500">
              Track odometer updates and mark which services were done at each reading.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {mileageRecords.length} entries
            </span>
            <button
              type="button"
              onClick={openMileageModal}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            >
              + Add
            </button>
          </div>
        </div>

        {mileageError && <p className="mt-3 text-sm text-red-600">{mileageError}</p>}
        {mileageSuccess && <p className="mt-3 text-sm text-green-600">{mileageSuccess}</p>}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SummaryCard
            label="Current mileage"
            value={formatMileage(savedCurrentMileage)}
            description="Latest saved odometer reading"
          />
          <SummaryCard
            label="Engine oil last changed"
            value={formatMileage(previewEngineOilMileage)}
            description="Updates when you tick engine oil service"
          />
          <SummaryCard
            label="ATF / gearbox last changed"
            value={formatMileage(previewAtfMileage)}
            description="Updates when you tick ATF / gearbox service"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ServiceDueCard
            title="Engine oil service"
            intervalLabel="Every 10,000 km"
            due={engineOilDue}
          />
          <ServiceDueCard
            title="ATF / gearbox oil"
            intervalLabel="Every 40,000 km"
            due={atfDue}
          />
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Saved entries</h3>
              <p className="mt-1 text-sm text-slate-500">Each entry stores the odometer reading and optional service note.</p>
            </div>
          </div>

          {mileageRecords.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">No mileage records yet. Use + Add to save the first odometer reading.</p>
          )}

          {mileageRecords.length > 0 && (
            <div className={`mt-4 space-y-3 ${mileageRecords.length > 3 ? 'max-h-72 overflow-y-auto pr-1' : ''}`}>
              {mileageRecords.map((record, index) => (
                <article key={`${record.recordedAt}-${record.mileage}-${index}`} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{formatMileage(record.mileage)}</p>
                      <p className="text-xs text-slate-500">{new Date(record.recordedAt).toLocaleString()}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {index === 0 ? 'Latest' : 'History'}
                    </span>
                  </div>
                  {record.note && <p className="mt-2 text-sm text-slate-600">{record.note}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      </div>

      {mileageModalOpen && (
        <MileageEntryModal
          form={mileageEntryForm}
          error={mileageError}
          saving={mileageSaving}
          onChange={handleMileageEntryChange}
          onClose={closeMileageModal}
          onSubmit={handleMileageSave}
        />
      )}
    </main>
  );
}

function MileageEntryModal({ form, error, saving, onChange, onClose, onSubmit }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add mileage entry</h2>
            <p className="mt-1 text-sm text-slate-500">
              Save the latest odometer and tick the services completed at this reading.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <FormField
            label="Current Odometer"
            name="mileage"
            type="number"
            value={form.mileage}
            onChange={onChange}
            min={0}
            step={1}
            required
            placeholder="e.g. 48250"
          />

          <FormField
            label="Note"
            name="note"
            type="text"
            value={form.note}
            onChange={onChange}
            placeholder="Optional: service, trip, tyre change"
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services performed</p>
            <p className="mt-1 text-sm text-slate-500">
              Tick only the service items completed at this odometer reading.
            </p>

            <div className="mt-4 space-y-3">
              <CheckboxField
                name="serviceEngineOil"
                checked={form.serviceEngineOil}
                onChange={onChange}
                label="Engine oil changed at this odometer"
              />
              <CheckboxField
                name="serviceAtf"
                checked={form.serviceAtf}
                onChange={onChange}
                label="ATF / gearbox oil changed at this odometer"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save entry'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, description }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </article>
  );
}

function ServiceDueCard({ title, intervalLabel, due }) {
  const toneClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    slate: 'bg-slate-50 border-slate-200 text-slate-900'
  };

  return (
    <article className={`rounded-xl border p-4 ${toneClasses[due.tone] || toneClasses.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-xs opacity-80">{intervalLabel}</p>
        </div>
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold">
          {due.title}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium">{due.description}</p>
      <p className="mt-2 text-xs opacity-80">
        Next due at {due.nextDueMileage ? formatMileage(due.nextDueMileage) : '—'}
      </p>
    </article>
  );
}

function ReviewStatusBadge({ status }) {
  const map = {
    pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-800' },
    approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' }
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
  );
}

function ProfileRow({ label, value, note }) {
  return (
    <div className="flex items-start gap-2 py-2.5">
      <dt className="w-28 shrink-0 font-medium text-slate-500">{label}</dt>
      <dd className="text-slate-800">
        {value}
        {note && <span className="ml-1 text-xs text-slate-400">{note}</span>}
      </dd>
    </div>
  );
}

function CheckboxField({ name, checked, onChange, label }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
      />
      <span>{label}</span>
    </label>
  );
}

function FormField({ label, name, type, value, onChange, required, placeholder, min, step }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        min={min}
        step={step}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
    </div>
  );
}
