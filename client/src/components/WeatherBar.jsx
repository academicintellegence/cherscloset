import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { currentPosition, fetchWeather, findCity, readLocation, saveLocation } from '../lib/weather.js';

// Shows today's weather and lets the user pick a place: browser location, or a typed city as the fallback.
export default function WeatherBar({ weather, onWeather }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [city, setCity] = useState(() => readLocation()?.name?.split(',')[0] || user?.homeCity || '');

  const load = async (place) => {
    try {
      onWeather({ ...(await fetchWeather(place)), place: place.name });
      setMessage('');
    } catch {
      onWeather(null);
      setMessage('Weather is not available right now, so ideas ignore it.');
    }
  };

  const locate = async () => {
    setBusy(true);
    setMessage('');
    try {
      await load(await currentPosition());
    } catch (e) {
      setMessage(`${e.message}. Enter a city instead.`);
    } finally {
      setBusy(false);
    }
  };

  const submitCity = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const place = await findCity(city.trim());
      if (!place) setMessage('Could not find that city.');
      else { saveLocation(place); await load(place); }
    } catch {
      setMessage('City lookup is not available right now.');
    } finally {
      setBusy(false);
    }
  };

  // On first load: use the saved city, or location only if the browser already has permission (no surprise prompt).
  useEffect(() => {
    const saved = readLocation();
    if (saved) { load(saved); return; }
    navigator.permissions?.query({ name: 'geolocation' }).then((p) => p.state === 'granted' && locate()).catch(() => {});
  }, []);

  return (
    <div className="weather-bar">
      <p className="weather-now">
        {weather
          ? `${weather.place}: ${weather.now}°C now, ${weather.min}° to ${weather.max}°, ${weather.rainy ? 'rain likely' : 'dry'}`
          : 'Add your city for weather-aware ideas.'}
      </p>
      <form className="city-form" onSubmit={submitCity}>
        <input aria-label="City" placeholder="City" value={city} maxLength={80} onChange={(e) => setCity(e.target.value)} />
        <button className="secondary" disabled={busy}>Set city</button>
        <button type="button" className="link" onClick={locate} disabled={busy}>Use my location</button>
      </form>
      {message && <p className="error" role="alert">{message}</p>}
    </div>
  );
}
