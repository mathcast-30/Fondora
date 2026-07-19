// /src/components/ExportButton.jsx
import React from 'react';
import { Download } from 'lucide-react';

const ExportButton = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`bg-navy hover:bg-opacity-90 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition ${className}`}
    >
      <Download size={18} />
      Exporter en Excel
    </button>
  );
};

export default ExportButton;
