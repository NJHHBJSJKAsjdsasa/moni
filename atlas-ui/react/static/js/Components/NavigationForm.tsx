// atlas-ui/react/static/js/Components/NavigationForm.tsx
import React, { useState } from "react";
import CoordinateSelector from "./CoordinateSelector.jsx";
import CoordinateViewer3D from "./CoordinateViewer3D.tsx";

const NavigationForm = ({ error }) => {
  const [coordinates, setCoordinates] = useState({ x: 1000000, y: 1000000, z: 1000000 });

  const handleCoordinateChange = (newCoordinates) => {
    setCoordinates(newCoordinates);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/navigate";

    Object.entries(coordinates).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value.toString();
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center mb-8">
        <div className="w-80 h-60 rounded-xl overflow-hidden">
          <CoordinateViewer3D coordinates={coordinates} className="w-full h-full" />
        </div>
      </div>

      <CoordinateSelector onCoordinateChange={handleCoordinateChange} />
      {error && <p className="error">{error}</p>}
    </form>
  );
};

export default NavigationForm;
