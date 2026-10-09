import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { ComplaintMapItem, Urgency } from '../types';
import { UrgencyBadge } from './UrgencyBadge';
import { StatusBadge } from './StatusBadge';
import { Layers, Flame, Eye, EyeOff, MapPinOff, ArrowRight } from 'lucide-react';

interface HotspotMapProps {
  items: ComplaintMapItem[];
  unmappedCount?: number;
  center?: [number, number];
  onSelectTicket?: (id: string) => void;
  className?: string;
}

const URGENCY_COLOR_MAP: Record<Urgency, string> = {
  Critical: '#EF4444',
  High: '#F59E0B',
  Medium: '#3B82F6',
  Low: '#22C55E',
};

const URGENCY_WEIGHT_MAP: Record<Urgency, number> = {
  Critical: 1.0,
  High: 0.7,
  Medium: 0.4,
  Low: 0.2,
};

// Subcomponent to render Leaflet.heat layer
const HeatmapLayerComponent: React.FC<{ points: [number, number, number][] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;
    try {
      const heatFactory = (L as any).heatLayer;
      if (typeof heatFactory === 'function') {
        const layer = heatFactory(points, {
          radius: 28,
          blur: 20,
          maxZoom: 16,
          max: 1.0,
          gradient: {
            0.2: '#22C55E',
            0.4: '#3B82F6',
            0.7: '#F59E0B',
            1.0: '#EF4444',
          },
        });
        layer.addTo(map);
        return () => {
          map.removeLayer(layer);
        };
      }
    } catch (e) {
      console.warn('Leaflet heat layer initialisation failed:', e);
    }
  }, [map, points]);

  return null;
};

export const HotspotMap: React.FC<HotspotMapProps> = ({
  items,
  unmappedCount = 0,
  center = [28.6139, 77.2090],
  onSelectTicket,
  className = 'h-[580px]',
}) => {
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');
  const [showResolved, setShowResolved] = useState(false);

  // Filter items based on resolved toggle
  const visibleItems = items.filter((item) => {
    if (!item.latitude || !item.longitude) return false;
    if (!showResolved && item.status === 'Resolved') return false;
    return true;
  });

  // Prepare heatmap points: [lat, lng, weight]
  const heatPoints: [number, number, number][] = visibleItems.map((item) => [
    item.latitude!,
    item.longitude!,
    URGENCY_WEIGHT_MAP[item.urgency] || 0.4,
  ]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-slate-300 shadow-md ${className}`}>
      {/* Top Map Controls Bar */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-wrap items-center gap-2">
        
        {/* Toggle View: Markers vs Heatmap */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-1 shadow border border-slate-200 flex items-center gap-1 text-xs font-semibold text-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('markers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              viewMode === 'markers'
                ? 'bg-[#0B1F3A] text-white shadow-sm'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Urgency Markers
          </button>
          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              viewMode === 'heatmap'
                ? 'bg-red-600 text-white shadow-sm'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Density Heatmap
          </button>
        </div>

        {/* Toggle Resolved */}
        <button
          type="button"
          onClick={() => setShowResolved(!showResolved)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shadow border transition-all ${
            showResolved
              ? 'bg-slate-800 text-white border-slate-700'
              : 'bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-slate-50 border-slate-200'
          }`}
        >
          {showResolved ? <Eye className="w-3.5 h-3.5 text-teal-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          {showResolved ? 'Resolved Included' : 'Hide Resolved'}
        </button>

      </div>

      {/* Unmapped count badge in top-left */}
      {unmappedCount > 0 && (
        <div className="absolute top-3 left-14 z-[1000] bg-amber-50/95 backdrop-blur-sm border border-amber-300 text-amber-800 text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
          <MapPinOff className="w-3.5 h-3.5 text-amber-600" />
          <span><strong>{unmappedCount}</strong> tickets lack GPS coordinates</span>
        </div>
      )}

      {/* Leaflet Map Container */}
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Heatmap Layer */}
        {viewMode === 'heatmap' && <HeatmapLayerComponent points={heatPoints} />}

        {/* Circle Markers */}
        {viewMode === 'markers' &&
          visibleItems.map((item) => {
            const color = URGENCY_COLOR_MAP[item.urgency] || '#3B82F6';
            const radius = item.urgency === 'Critical' ? 10 : item.urgency === 'High' ? 8 : 6;

            return (
              <CircleMarker
                key={item.id}
                center={[item.latitude!, item.longitude!]}
                radius={radius}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.85,
                }}
              >
                <Popup className="civic-popup">
                  <div className="p-1 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
                      <span className="font-mono font-bold text-xs text-[#0B1F3A]">{item.id}</span>
                      <UrgencyBadge urgency={item.urgency} showIcon={false} />
                    </div>

                    <div className="mb-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {item.category} • {item.issue_type}
                      </span>
                      <p className="text-xs text-slate-800 font-medium line-clamp-2 mt-0.5 leading-snug">
                        {item.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <StatusBadge status={item.status} showIcon={false} />
                      {onSelectTicket && (
                        <button
                          type="button"
                          onClick={() => onSelectTicket(item.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-[#14B8A6] hover:text-[#0B1F3A] transition-colors"
                        >
                          Open ticket
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* Legend in bottom-left */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200 text-xs">
        <div className="font-bold text-slate-800 mb-2 flex items-center justify-between gap-4">
          <span>Map Legend</span>
          <span className="text-[10px] text-slate-500 font-normal">{visibleItems.length} plotted</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200" />
            <span className="text-slate-700">Critical (1.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200" />
            <span className="text-slate-700">High (0.7)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200" />
            <span className="text-slate-700">Medium (0.4)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span className="text-slate-700">Low (0.2)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
