import React, { useEffect, useRef, useState } from 'react';
import type { Contractor } from '../data/contractors';

// Declare global google maps types
declare global {
  interface Window {
    google: any;
  }
}

interface ContractorMapProps {
  contractors: Contractor[];
  apiKey: string;
}

export const ContractorMap: React.FC<ContractorMapProps> = ({ contractors, apiKey }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        initMap();
      };
    } else {
      initMap();
    }
  }, [apiKey]);

  useEffect(() => {
    if (map) {
      updateMarkers();
    }
  }, [map, contractors]);

  const initMap = () => {
    if (!mapRef.current || !window.google) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
      zoom: 4,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(newMap);
  };

  const updateMarkers = () => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = contractors
      .filter(contractor => contractor.coordinates)
      .map(contractor => {
        const marker = new google.maps.Marker({
          position: contractor.coordinates!,
          map: map,
          title: contractor.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path fill="#2563eb" d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16zm0 22c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/>
                ${contractor.verified ? '<circle cx="16" cy="16" r="4" fill="white"/>' : ''}
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40)
          }
        });

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1e293b;">
                ${contractor.name}
                ${contractor.verified ? '<span style="color: #2563eb; margin-left: 4px;">✓</span>' : ''}
              </h3>
              <p style="margin: 4px 0; color: #2563eb; font-size: 14px; font-weight: 500;">
                ${contractor.category}
              </p>
              <p style="margin: 4px 0; color: #64748b; font-size: 13px;">
                ${contractor.location}
              </p>
              <div style="margin: 8px 0; display: flex; align-items: center; gap: 4px;">
                <span style="color: #fbbf24;">★</span>
                <span style="font-weight: 600; font-size: 14px;">${contractor.rating}</span>
                <span style="color: #64748b; font-size: 13px;">(${contractor.reviewCount} reviews)</span>
              </div>
              <a href="/directory?contractor=${contractor.id}"
                 style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
                View Profile
              </a>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        return marker;
      });

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      map.fitBounds(bounds);

      // Prevent over-zooming
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const zoom = map.getZoom();
        if (zoom && zoom > 10) map.setZoom(10);
        google.maps.event.removeListener(listener);
      });
    }
  };

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '500px', borderRadius: '12px' }}
      className="shadow-lg"
    />
  );
};
