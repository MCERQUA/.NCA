import React, { useEffect, useRef, useState } from 'react';

interface Contractor {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  verified: boolean;
  specialties: string[];
  yearsInBusiness: number;
}

// Declare global google maps types
declare global {
  interface Window {
    google: any;
  }
  // eslint-disable-next-line no-var
  var google: any;
}

interface InteractiveContractorMapProps {
  contractors: Contractor[];
  apiKey: string;
}

export const InteractiveContractorMap: React.FC<InteractiveContractorMapProps> = ({ contractors, apiKey }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!apiKey) {
      console.error('Google Maps API key is required');
      setIsLoading(false);
      return;
    }

    // Check if Google Maps is already loaded or loading
    if (window.google && window.google.maps) {
      // Already loaded, just init the map
      initMap();
    } else {
      // Wait for it to load (the hero map component loads it first)
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          initMap();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google) {
          console.error('Google Maps failed to load');
          setIsLoading(false);
        }
      }, 10000);
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
      zoom: 5, // Focused on USA only
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(newMap);
    setIsLoading(false);
  };

  const updateMarkers = () => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Only create markers for contractors with coordinates
    const contractorsWithCoords = contractors.filter(contractor => contractor.coordinates);

    const newMarkers = contractorsWithCoords.map(contractor => {
      const marker = new google.maps.Marker({
        position: contractor.coordinates!,
        map: map,
        title: contractor.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
              <path fill="#ea580c" d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16zm0 22c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/>
              ${contractor.verified ? '<circle cx="16" cy="16" r="4" fill="white"/>' : ''}
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 40),
          anchor: new google.maps.Point(16, 40)
        }
      });

      // Create info window with clickable link
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 280px;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1e293b;">
              ${contractor.name}
              ${contractor.verified ? '<span style="color: #ea580c; margin-left: 4px;">✓</span>' : ''}
            </h3>
            <p style="margin: 4px 0; color: #ea580c; font-size: 14px; font-weight: 500;">
              ${contractor.category}
            </p>
            <p style="margin: 4px 0; color: #64748b; font-size: 13px;">
              📍 ${contractor.location}
            </p>
            <div style="margin: 8px 0; display: flex; align-items: center; gap: 4px;">
              <span style="color: #fbbf24;">★</span>
              <span style="font-weight: 600; font-size: 14px;">${contractor.rating}</span>
              <span style="color: #64748b; font-size: 13px;">(${contractor.reviewCount} reviews)</span>
            </div>
            <p style="margin: 8px 0 12px 0; color: #475569; font-size: 13px; line-height: 1.4;">
              ${contractor.description.substring(0, 100)}...
            </p>
            <a href="/directory?contractor=${contractor.id}"
               style="display: inline-block; margin-top: 8px; padding: 8px 16px; background: #ea580c; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
              View Full Profile
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
    <div style={{ position: 'relative', width: '100%', height: '600px' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f1f5f9',
          zIndex: 10,
          borderRadius: '12px'
        }}>
          <p style={{ color: '#64748b' }}>Loading interactive map...</p>
        </div>
      )}
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        className="shadow-xl"
      />
    </div>
  );
};
