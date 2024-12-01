// components/FormInput.js
import React from "react";

export function TextInput({ label, placeholder, maxLength, value, onChange }) {
  return (
    <div className="mb-6">
      <label className="block mb-2 text-sm font-bold text-gray-700">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        maxLength={maxLength}
        value={value} // Bind the input value to the parent state
        onChange={onChange} // Pass the onChange handler from parent
        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export function TextAreaInput({ label, placeholder, maxLength }) {
  return (
    <div className="mb-6">
      <label className="block mb-2 text-sm font-bold text-gray-700">{label}</label>
      <textarea
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full h-32 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export function SelectInput({ label, options }) {
  return (
    <div className="mb-6">
      <label className="block mb-2 text-sm font-bold text-gray-700">{label}</label>
      <select className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
