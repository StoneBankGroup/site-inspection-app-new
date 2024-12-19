'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { AlertCircle, Upload, Download, Search, Filter, Menu, X, Plus, ChevronLeft, ZoomIn, ZoomOut } from 'lucide-react';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Updated categories and colors
const categoryColors = {
  Defect: '#FF4444',          // Red for serious issues
  'Non-Conformance': '#FF8C00', // Orange for compliance issues
  Safety: '#FFD700',          // Gold for safety concerns
  Observation: '#4169E1',     // Royal Blue for general observations
  Other: '#808080'            // Gray for miscellaneous items
};

const categories = ['Defect', 'Observation', 'Safety', 'Non-Conformance', 'Other'];

export default function Home() {
  // ... [previous state declarations remain the same]

  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [pins, setPins] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [observation, setObservation] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPinMode, setIsPinMode] = useState(false);
  const [activeView, setActiveView] = useState('plan');
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  const handlePlanUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPlans = files.map(file => ({
      id: Date.now(),
      name: file.name,
      file: file,
      url: URL.createObjectURL(file),
      uploadDate: new Date().toISOString()
    }));
    setPlans([...plans, ...newPlans]);
    if (!currentPlan) setCurrentPlan(newPlans[0]);
    setActiveView('plan');
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleImageClick = (e) => {
    if (!currentPlan || !isPinMode) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPin = {
      id: Date.now(),
      planId: currentPlan.id,
      page: currentPage,
      x,
      y,
      number: pins.length + 1,
      observation: '',
      category: 'Observation', // Default to Observation
      dateCreated: new Date().toISOString()
    };
    setPins([...pins, newPin]);
    setSelectedPin(newPin);
    setActiveView('observation');
    setIsPinMode(false);
  };

  const renderPinMarker = (pin) => {
    const color = categoryColors[pin.category];
    return (
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedPin(pin);
          setObservation(pin.observation);
          setActiveView('observation');
        }}
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white"
          style={{ backgroundColor: color }}
        >
          {pin.number}
        </div>
      </div>
    );
  };

  const renderTopBar = () => (
    <div className="fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-2">
      <div className="flex items-center justify-between">
        {activeView !== 'plan' ? (
          <button onClick={() => setActiveView('plan')} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <button onClick={() => setIsMenuOpen(true)} className="p-2">
            <Menu className="w-6 h-6" />
          </button>
        )}
        <h1 className="font-semibold">
          {activeView === 'plan' && currentPlan?.name}
          {activeView === 'observation' && `Issue #${selectedPin?.number}`}
          {activeView === 'planList' && 'Select Plan'}
        </h1>
        {activeView === 'plan' && (
          <div className="flex items-center">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="p-2"
            >
              <ZoomOut className="w-6 h-6" />
            </button>
            <button
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
              className="p-2"
            >
              <ZoomIn className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsPinMode(!isPinMode)}
              className={`p-2 rounded-full ${isPinMode ? 'bg-blue-500 text-white' : ''}`}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
      {activeView === 'plan' && numPages > 1 && (
        <div className="flex justify-center items-center mt-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-sm"
          >
            Previous
          </button>
          <span className="mx-2">
            Page {currentPage} of {numPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage === numPages}
            className="px-2 py-1 text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderTopBar()}
      
      <div className="pt-16 pb-20">
        {activeView === 'plan' && (
          <div className="relative">
            {currentPlan ? (
              <div className="overflow-auto">
                <Document
                  file={currentPlan.url}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    onClick={handleImageClick}
                    className="cursor-crosshair"
                  />
                </Document>
                {pins
                  .filter(pin => pin.planId === currentPlan.id && pin.page === currentPage)
                  .map(renderPinMarker)}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Upload a PDF plan to begin inspection
              </div>
            )}
          </div>
        )}

        {activeView === 'observation' && (
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type of Issue
              </label>
              <select
                value={selectedPin?.category || 'Observation'}
                onChange={(e) => {
                  setPins(pins.map(p =>
                    p.id === selectedPin.id
                      ? { ...p, category: e.target.value }
                      : p
                  ));
                }}
                className="w-full p-3 border rounded-lg text-lg"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full p-3 border rounded-lg text-lg"
                rows="6"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Describe the issue..."
              />
            </div>
            
            <button
              className="w-full py-3 bg-blue-500 text-white rounded-lg text-lg"
              onClick={() => {
                setPins(pins.map(p =>
                  p.id === selectedPin.id
                    ? { ...p, observation }
                    : p
                ));
                setSelectedPin(null);
                setObservation('');
                setActiveView('plan');
              }}
            >
              Save Issue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}