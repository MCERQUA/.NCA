/**
 * Geocode an address using Google Maps Geocoding API
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zipCode?: string,
  apiKey?: string
): Promise<{ lat: number; lng: number } | null> {
  if (!apiKey) {
    console.error('Google Maps API key not provided for geocoding');
    return null;
  }

  try {
    const fullAddress = [address, city, state, zipCode]
      .filter(Boolean)
      .join(', ');

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    console.error('Geocoding failed:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}
