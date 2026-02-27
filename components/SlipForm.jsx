'use client';
import { useState, useEffect } from 'react';
import {
  COUNTRIES, DESTINATION_COUNTRIES, NATIONALITIES,
  VISA_TYPES, POSITIONS, GENDERS, MARITAL_STATUSES,
  DEFAULT_FORM_VALUES
} from '@/lib/formData';

export default function SlipForm({ initialData, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initialData || DEFAULT_FORM_VALUES);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const req = [
      'country', 'traveled_country', 'first_name', 'last_name',
      'dob', 'nationality', 'gender', 'marital_status',
      'passport', 'confirm_passport', 'email', 'phone', 'national_id',
    ];
    const errs = {};
    req.forEach(k => {
      if (!form[k]) errs[k] = 'This field is required';
    });
    if (form.passport && form.confirm_passport && form.passport !== form.confirm_passport) {
      errs.confirm_passport = 'Passport numbers do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const Field = ({ label, required, error, children }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <span className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</span>}
    </div>
  );

  const Select = ({ name, options, placeholder = 'Select...', ...props }) => (
    <select
      className={`form-select ${errors[name] ? 'border-red-400' : ''}`}
      value={form[name] || ''}
      onChange={e => set(name, e.target.value)}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  const Input = ({ name, type = 'text', placeholder, ...props }) => (
    <input
      type={type}
      className={`form-input ${errors[name] ? 'border-red-400' : ''}`}
      value={form[name] || ''}
      onChange={e => set(name, e.target.value)}
      placeholder={placeholder}
      {...props}
    />
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">

        {/* === APPOINTMENT LOCATION === */}
        <section>
          <p className="section-header">📍 Appointment Location</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Country" required error={errors.country}>
              <Select name="country" options={COUNTRIES} placeholder="Select Country" />
            </Field>
            <Field label="City" error={errors.city}>
              <Input name="city" placeholder="Enter city name" />
            </Field>
            <Field label="Country Travelling To" required error={errors.traveled_country}>
              <Select name="traveled_country" options={DESTINATION_COUNTRIES} placeholder="Select Destination" />
            </Field>
          </div>
        </section>

        {/* === APPOINTMENT TYPE === */}
        <section>
          <p className="section-header">🗓 Appointment Type</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { value: 'standard', label: 'Standard Appointment', price: '$10', desc: 'Basic appointment based on availability.' },
              { value: 'premium', label: 'Premium Appointment', price: '$25', desc: 'Choose your preferred medical center and date.' },
            ].map(type => (
              <label
                key={type.value}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.appointment_type === type.value
                    ? 'border-[#6F1D46] bg-[#fdf2f8]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="appointment_type"
                  value={type.value}
                  checked={form.appointment_type === type.value}
                  onChange={() => set('appointment_type', type.value)}
                  className="mt-1 accent-[#6F1D46]"
                />
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
                  <div className="text-sm font-bold text-[#6F1D46] mt-1">{type.price}</div>
                </div>
              </label>
            ))}
          </div>

          {form.appointment_type === 'premium' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#fdf2f8] rounded-xl border border-[#6F1D46]/20">
              <Field label="Premium Medical Center">
                <Input name="premium_medical_center" placeholder="Medical Center ID or Name" />
              </Field>
              <Field label="Appointment Date">
                <Input name="appointment_date" placeholder="DD/MM/YYYY" />
              </Field>
            </div>
          )}

          {form.appointment_type === 'standard' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <Field label="Medical Center (optional)">
                <Input name="medical_center" placeholder="Medical Center ID (if known)" />
              </Field>
            </div>
          )}
        </section>

        {/* === CANDIDATE INFORMATION === */}
        <section>
          <p className="section-header">👤 Candidate Information</p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="First Name" required error={errors.first_name}>
                <Input name="first_name" placeholder="First name" />
              </Field>
              <Field label="Last Name" required error={errors.last_name}>
                <Input name="last_name" placeholder="Last name" />
              </Field>
              <Field label="Date of Birth" required error={errors.dob}>
                <Input name="dob" placeholder="DD/MM/YYYY" />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Nationality" required error={errors.nationality}>
                <Select name="nationality" options={NATIONALITIES} placeholder="Select Nationality" />
              </Field>
              <Field label="Gender" required error={errors.gender}>
                <Select name="gender" options={GENDERS} placeholder="Select Gender" />
              </Field>
              <Field label="Marital Status" required error={errors.marital_status}>
                <Select name="marital_status" options={MARITAL_STATUSES} placeholder="Select Status" />
              </Field>
            </div>
          </div>
        </section>

        {/* === PASSPORT INFORMATION === */}
        <section>
          <p className="section-header">🛂 Passport Information</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Passport Number" required error={errors.passport}>
                <Input name="passport" placeholder="Enter passport number" />
              </Field>
              <Field label="Confirm Passport Number" required error={errors.confirm_passport}>
                <Input name="confirm_passport" placeholder="Repeat passport number" />
              </Field>
              <Field label="Passport Issue Date" error={errors.passport_issue_date}>
                <Input name="passport_issue_date" placeholder="DD/MM/YYYY" />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Passport Issue Place" error={errors.passport_issue_place}>
                <Input name="passport_issue_place" placeholder="City/Country" />
              </Field>
              <Field label="Passport Expiry Date" error={errors.passport_expiry_on}>
                <Input name="passport_expiry_on" placeholder="DD/MM/YYYY" />
              </Field>
              <Field label="Visa Type">
                <Select name="visa_type" options={VISA_TYPES} placeholder="Select Visa Type" />
              </Field>
            </div>
          </div>
        </section>

        {/* === CONTACT & POSITION === */}
        <section>
          <p className="section-header">📱 Contact & Position</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Email Address" required error={errors.email}>
                <Input name="email" type="email" placeholder="your@email.com" />
              </Field>
              <Field label="Phone Number" required error={errors.phone}>
                <Input name="phone" placeholder="+880..." />
              </Field>
              <Field label="National ID" required error={errors.national_id}>
                <Input name="national_id" placeholder="National ID number" />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Position Applied For">
                <Select name="applied_position" options={POSITIONS} placeholder="Select Position" />
              </Field>
              {form.applied_position === '108' && (
                <Field label="Other Position">
                  <Input name="applied_position_other" placeholder="Specify position" />
                </Field>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Saving...
            </>
          ) : (
            <> Save Slip ›</>
          )}
        </button>
      </div>
    </form>
  );
}
