import React, { useEffect, useRef, useState } from 'react';
import './weather.css';
import { IoSearchOutline, IoLocationOutline } from 'react-icons/io5';
import { WiHumidity, WiStrongWind, WiBarometer, WiSunrise, WiSunset } from 'react-icons/wi';

const APP_KEY = "a6e4c399a5a444f16c8d407a0a26c203";

const WeatherIcon = ({ icon, size = 80 }) => (
  <img
    src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
    alt="weather"
    width={size}
    height={size}
    style={{ imageRendering: 'auto' }}
  />
);

const fmtTime = (ts) =>
  new Date(ts * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const fmtDay = (ts) =>
  new Date(ts * 1000).toLocaleDateString('en-IN', { weekday: 'short' });

const tempGradient = (temp) => {
  if (temp >= 38) return 'linear-gradient(160deg, #b91c1c, #c2410c, #92400e)';
  if (temp >= 30) return 'linear-gradient(160deg, #c2410c, #d97706, #b45309)';
  if (temp >= 22) return 'linear-gradient(160deg, #0369a1, #0891b2, #059669)';
  if (temp >= 12) return 'linear-gradient(160deg, #1d4ed8, #4338ca, #6d28d9)';
  return 'linear-gradient(160deg, #1e3a5f, #1d4ed8, #0e7490)';
};

const Main = () => {
  const inputRef = useRef();
  const [cityName, setCityName] = useState("New Delhi");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [city, setCity] = useState({});
  const [wind, setWind] = useState({});

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&APPID=${APP_KEY}&units=metric`
        );
        if (!res.ok) { setError(true); return; }
        const data = await res.json();

        setCity(data.city);
        setCurrent(data.list[0].main);
        setWeather(data.list[0].weather[0]);
        setWind(data.list[0].wind);

        // One entry per unique day
        const seen = new Set();
        const daily = data.list.filter(item => {
          const day = new Date(item.dt * 1000).toDateString();
          if (!seen.has(day)) { seen.add(day); return true; }
          return false;
        }).slice(0, 5);
        setForecast(daily);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [cityName]);

  const handleSearch = (e) => {
    e?.preventDefault();
    const val = inputRef.current?.value?.trim();
    if (val) setCityName(val);
  };

  const gradient = current ? tempGradient(current.temp) : 'linear-gradient(160deg, #1e3a5f, #1d4ed8)';

  return (
    <div className="wx-page">
      <div className="wx-container" style={{ background: gradient }}>

        {/* Search */}
        <form className="wx-search-form" onSubmit={handleSearch}>
          <div className="wx-search-wrap">
            <IoLocationOutline className="wx-search-loc" />
            <input
              ref={inputRef}
              className="wx-search-input"
              placeholder="Search city…"
              defaultValue={cityName}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button type="submit" className="wx-search-btn">
              <IoSearchOutline />
            </button>
          </div>
        </form>

        {loading && (
          <div className="wx-loading">
            <div className="wx-spinner" />
            <span style={{ opacity: .6, fontSize: '.85rem' }}>Fetching weather…</span>
          </div>
        )}

        {error && !loading && (
          <div className="wx-error">
            <div className="wx-error-icon">🌩️</div>
            <p>City not found.<br />Try a different spelling.</p>
          </div>
        )}

        {!loading && !error && current && (
          <div className="wx-content">

            {/* City */}
            <div className="wx-city">
              <IoLocationOutline />
              {city.name}, {city.country}
            </div>

            {/* Hero */}
            <div className="wx-hero">
              {weather && (
                <div className="wx-hero-icon">
                  <WeatherIcon icon={weather.icon} size={110} />
                </div>
              )}
              <div className="wx-temp">{Math.round(current.temp)}°</div>
              <div className="wx-desc">{weather?.description}</div>
              <div className="wx-feels">Feels like {Math.round(current.feels_like)}°C</div>
              <div className="wx-minmax">
                <span className="wx-max">↑ {Math.round(current.temp_max)}°</span>
                <span className="wx-min">↓ {Math.round(current.temp_min)}°</span>
              </div>
            </div>

            {/* Stat pills */}
            <div className="wx-pills">
              <div className="wx-pill">
                <WiHumidity className="wx-pill-icon" style={{ fontSize: '1.4rem' }} />
                {current.humidity}% Humidity
              </div>
              <div className="wx-pill">
                <WiStrongWind className="wx-pill-icon" style={{ fontSize: '1.3rem' }} />
                {Math.round(wind.speed)} m/s Wind
              </div>
              <div className="wx-pill">
                <WiBarometer className="wx-pill-icon" style={{ fontSize: '1.4rem' }} />
                {current.pressure} hPa
              </div>
            </div>

            {/* Sunrise / Sunset */}
            {city.sunrise && (
              <div className="wx-sun-row">
                <div className="wx-sun-card">
                  <WiSunrise className="wx-sun-icon" />
                  <div>
                    <div className="wx-sun-label">Sunrise</div>
                    <div className="wx-sun-time">{fmtTime(city.sunrise)}</div>
                  </div>
                </div>
                <div className="wx-sun-card">
                  <WiSunset className="wx-sun-icon" />
                  <div>
                    <div className="wx-sun-label">Sunset</div>
                    <div className="wx-sun-time">{fmtTime(city.sunset)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 5-day forecast */}
            <div className="wx-section-title">5-Day Forecast</div>
            <div className="wx-forecast-grid">
              {forecast.map((item, i) => (
                <div key={i} className={`wx-forecast-card ${i === 0 ? 'today' : ''}`}>
                  <div className="wx-forecast-day">{i === 0 ? 'Today' : fmtDay(item.dt)}</div>
                  <div className="wx-forecast-icon">
                    <WeatherIcon icon={item.weather[0].icon} size={40} />
                  </div>
                  <div className="wx-forecast-temp">{Math.round(item.main.temp)}°</div>
                  <div className="wx-forecast-desc">{item.weather[0].main}</div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Main;
