import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Navigation, X } from 'lucide-react';
import '../utils/leafletIcons';

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  defaultCenter?: [number, number];
  height?: string;
}

const MapEventsHandler: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const RecenterMap: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
};

export const LocationPickerMap: React.FC<LocationPickerProps> = ({
  lat,
  lng,
  onChange,
  defaultCenter = [28.6139, 77.2090],
  height = '240px',
}) => {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const currentCenter: [number, number] = lat && lng ? [lat, lng] : defaultCenter;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        onChange(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(err.message || 'Unable to retrieve your location');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleClear = () => {
    onChange(null, null);
    setGeoError(null);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
          Drop pin on map or use GPS
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="flex items-center gap-1 text-[#0B1F3A] hover:text-[#14B8A6] font-semibold bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
          >
            <Navigation className="w-3 h-3 text-[#14B8A6]" />
            {geoLoading ? 'Detecting...' : 'Use My Current Location'}
          </button>
          {lat && lng && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-0.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-1.5 py-1 rounded transition-colors"
              title="Clear Pin"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {geoError && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {geoError}
        </div>
      )}

      <div style={{ height }} className="w-full relative rounded-lg border border-slate-300 overflow-hidden shadow-sm">
        <MapContainer
          center={currentCenter}
          zoom={13}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventsHandler onPick={(newLat, newLng) => onChange(newLat, newLng)} />
          {lat && lng && (
            <>
              <Marker position={[lat, lng]} />
              <RecenterMap center={[lat, lng]} />
            </>
          )}
        </MapContainer>

        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-slate-700 shadow border border-slate-200">
          {lat && lng
            ? `Pin: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
            : 'Click map to place pin'}
        </div>
      </div>
    </div>
  );
};
