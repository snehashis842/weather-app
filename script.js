class WeatherApp {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiBaseUrl = 'https://api.openweathermap.org/';

        this.skycons = new Skycons({ 'color': 'white' });
        this.skycons.play();

        this.state = {
            units: localStorage.getItem('weatherUnits') || 'metric',
            theme: localStorage.getItem('weatherTheme') || 'dark',
            searchHistory: JSON.parse(localStorage.getItem('weatherSearchHistory')) || [],
        };
        this.dom = this._getDomElements();
        this.debouncedFetchSuggestions = this._debounce(this._fetchSearchSuggestions.bind(this), 300);
        this._init();
    }

    _getDomElements() {
        return {
            weatherIconCanvas: document.getElementById('main-weather-icon'),
            themeToggleBtn: document.getElementById('themeToggleBtn'),
            searchSection: document.querySelector('.search-section'),
            cityInput: document.getElementById('cityInput'),
            searchBtn: document.getElementById('searchBtn'),
            currentLocationBtn: document.getElementById('currentLocationBtn'),
            unitToggle: document.getElementById('unitToggle'),
            errorMessage: document.getElementById('errorMessage'),
            successMessage: document.getElementById('successMessage'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            weatherDisplay: document.getElementById('weatherDisplay'),
            searchHistory: document.getElementById('searchHistory'),
            suggestionsContainer: document.getElementById('searchSuggestions'),
            cityName: document.getElementById('cityName'),
            currentDate: document.getElementById('currentDate'),
            temperature: document.getElementById('temperature'),
            feelsLike: document.getElementById('feelsLike'),
            tempRange: document.getElementById('tempRange'),
            weatherDescription: document.getElementById('weatherDescription'),
            windSpeed: document.getElementById('windSpeed'),
            humidity: document.getElementById('humidity'),
            pressure: document.getElementById('pressure'),
            sunrise: document.getElementById('sunrise'),
            sunset: document.getElementById('sunset'),
            aqi: document.getElementById('aqi'),
            hourlyContainer: document.querySelector('.hourly-container'),
            forecastContainer: document.querySelector('.forecast-container'),
        };
    }

    _init() {
        this._addEventListeners();
        this.dom.unitToggle.checked = this.state.units === 'imperial';
        this._applyTheme();
        this._renderSearchHistory();
        this._getUserLocation();
    }

    _addEventListeners() {
        this.dom.themeToggleBtn.addEventListener('click', () => this._handleThemeToggle());
        this.dom.searchBtn.addEventListener('click', () => this._handleSearch());
        this.dom.currentLocationBtn.addEventListener('click', () => this._getUserLocation());
        this.dom.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this._handleSearch();
        });
        this.dom.cityInput.addEventListener('input', () => {
            const query = this.dom.cityInput.value.trim();
            if (query.length > 2) {
                this.debouncedFetchSuggestions(query);
            } else {
                this.dom.suggestionsContainer.innerHTML = '';
            }
        });
        this.dom.unitToggle.addEventListener('change', () => this._handleUnitToggle());
        this.dom.searchHistory.addEventListener('click', (e) => {
            if (e.target.classList.contains('history-btn')) {
                this.fetchDataByCity(e.target.dataset.city);
            }
        });
        document.addEventListener('click', (e) => {
            if (!this.dom.searchSection.contains(e.target)) {
                this.dom.suggestionsContainer.innerHTML = '';
            }
        });
    }

    _getSkyconIdentifier(iconCode) {
        const iconMap = {
            '01d': 'CLEAR_DAY', '01n': 'CLEAR_NIGHT',
            '02d': 'PARTLY_CLOUDY_DAY', '02n': 'PARTLY_CLOUDY_NIGHT',
            '03d': 'CLOUDY', '03n': 'CLOUDY',
            '04d': 'CLOUDY', '04n': 'CLOUDY',
            '09d': 'RAIN', '09n': 'RAIN',
            '10d': 'RAIN', '10n': 'RAIN',
            '11d': 'RAIN', '11n': 'RAIN',
            '13d': 'SNOW', '13n': 'SNOW',
            '50d': 'FOG', '50n': 'FOG',
        };
        return iconMap[iconCode] || 'CLOUDY';
    }

    _renderAll() {
        const { weather, forecast, airQuality } = this.currentData;
        this._renderCurrentWeather(weather);
        this._renderHourlyForecast(forecast.list);
        this._renderDailyForecast(forecast.list);
        this._renderAirQuality(airQuality.list[0]);
        this._updateDynamicTheme(weather.weather[0]);

        this.dom.weatherDisplay.classList.remove('hidden');
        this.dom.weatherDisplay.classList.add('fade-in');
    }

    _renderCurrentWeather(data) {
        const skyconIdentifier = this._getSkyconIdentifier(data.weather[0].icon);
        this.skycons.set(this.dom.weatherIconCanvas, Skycons[skyconIdentifier]);

        const isMetric = this.state.units === 'metric';
        const tempUnit = isMetric ? '°C' : '°F';
        const windUnit = isMetric ? 'km/h' : 'mph';
        const toFahrenheit = (c) => (c * 9 / 5) + 32;
        const toMph = (mps) => mps * 2.237;

        // NEW LOGIC: Calculate today's true high and low from the forecast list
        const today = new Date().toISOString().split('T')[0];
        const todaysForecasts = this.currentData.forecast.list.filter(item => {
            return new Date(item.dt * 1000).toISOString().split('T')[0] === today;
        });

        let highTemp = -Infinity;
        let lowTemp = Infinity;

        if (todaysForecasts.length > 0) {
            highTemp = Math.max(...todaysForecasts.map(item => item.main.temp_max));
            lowTemp = Math.min(...todaysForecasts.map(item => item.main.temp_min));
        } else {
            // Fallback to current weather data if no forecast for today is available
            highTemp = data.main.temp_max;
            lowTemp = data.main.temp_min;
        }

        this.dom.cityName.textContent = `${data.name}, ${data.sys.country}`;
        this.dom.currentDate.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
        this.dom.temperature.textContent = `${(isMetric ? data.main.temp : toFahrenheit(data.main.temp)).toFixed(0)}${tempUnit}`;
        this.dom.feelsLike.textContent = `Feels like: ${(isMetric ? data.main.feels_like : toFahrenheit(data.main.feels_like)).toFixed(0)}${tempUnit}`;
        this.dom.weatherDescription.textContent = data.weather[0].description;
        // UPDATED: Use the new calculated high and low temps
        this.dom.tempRange.textContent = `${(isMetric ? highTemp : toFahrenheit(highTemp)).toFixed(0)}° / ${(isMetric ? lowTemp : toFahrenheit(lowTemp)).toFixed(0)}°`;
        this.dom.windSpeed.textContent = `${(isMetric ? data.wind.speed * 3.6 : toMph(data.wind.speed)).toFixed(1)} ${windUnit}`;
        this.dom.humidity.textContent = `${data.main.humidity}%`;
        this.dom.pressure.textContent = `${data.main.pressure} hPa`;
        this.dom.sunrise.textContent = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.dom.sunset.textContent = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    _renderDailyForecast(list) {
        const dailyForecasts = {};
        list.forEach(item => {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0];
            if (!dailyForecasts[date]) dailyForecasts[date] = [];
            dailyForecasts[date].push(item);
        });

        this.dom.forecastContainer.innerHTML = Object.keys(dailyForecasts).slice(1, 6).map((date, index) => {
            const dayData = dailyForecasts[date];
            const maxTemp = Math.max(...dayData.map(item => item.main.temp_max));
            const minTemp = Math.min(...dayData.map(item => item.main.temp_min));
            const iconData = dayData.find(d => d.dt_txt.includes("12:00:00")) || dayData[0];
            const isMetric = this.state.units === 'metric';
            const toFahrenheit = (c) => (c * 9 / 5) + 32;
            const displayMax = isMetric ? maxTemp : toFahrenheit(maxTemp);
            const displayMin = isMetric ? minTemp : toFahrenheit(minTemp);

            return `
                <div class="forecast-card fade-in" style="animation-delay: ${index * 100}ms">
                    <p class="forecast-date">${new Date(date).toLocaleDateString([], { weekday: 'short' })}</p>
                    <canvas id="forecast-icon-${index}" class="forecast-icon" width="50" height="50"></canvas>
                    <p class="forecast-temp">${displayMax.toFixed(0)}° / ${displayMin.toFixed(0)}°</p>
                    <p class="forecast-desc">${iconData.weather[0].description}</p>
                </div>
            `;
        }).join('');

        Object.keys(dailyForecasts).slice(1, 6).forEach((date, index) => {
            const dayData = dailyForecasts[date];
            const iconData = dayData.find(d => d.dt_txt.includes("12:00:00")) || dayData[0];
            const skyconIdentifier = this._getSkyconIdentifier(iconData.weather[0].icon);
            this.skycons.add(`forecast-icon-${index}`, Skycons[skyconIdentifier]);
        });
    }

    // THIS FUNCTION IS NOW FIXED
    _renderHourlyForecast(list) {
        const hourlyData = list.slice(0, 8);
        const isMetric = this.state.units === 'metric';
        const tempUnit = isMetric ? '°C' : '°F';
        const toFahrenheit = (c) => (c * 9 / 5) + 32;

        this.dom.hourlyContainer.innerHTML = hourlyData.map((item, index) => {
            const temp = isMetric ? item.main.temp : toFahrenheit(item.main.temp);
            const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true });

            return `
                <div class="hourly-card fade-in" style="animation-delay: ${index * 100}ms">
                    <p class="hourly-time">${time}</p>
                    <canvas id="hourly-icon-${index}" class="forecast-icon" width="40" height="40"></canvas>
                    <p class="hourly-temp">${temp.toFixed(0)}${tempUnit}</p>
                </div>
            `;
        }).join('');

        hourlyData.forEach((item, index) => {
            const skyconIdentifier = this._getSkyconIdentifier(item.weather[0].icon);
            this.skycons.add(`hourly-icon-${index}`, Skycons[skyconIdentifier]);
        });
    }

    _applyTheme() {
        const isDark = this.state.theme === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        this.dom.themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
        this.skycons.color = isDark ? 'white' : '#1a1a1a';

        if (this.currentData) {
            this._updateDynamicTheme(this.currentData.weather.weather[0]);
        }
    }

    async _fetchApi(endpoint, params) {
        this._setLoading(true);
        this.dom.errorMessage.classList.add('hidden');
        const url = new URL(`${this.apiBaseUrl}${endpoint}`);
        url.search = new URLSearchParams({ ...params, appid: this.apiKey });
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            this._showError(error.message);
            throw error;
        } finally {
            this._setLoading(false);
        }
    }

    async _fetchWeatherData(lat, lon) {
        this.dom.suggestionsContainer.innerHTML = '';
        try {
            const weatherPromise = this._fetchApi('data/2.5/weather', { lat, lon, units: 'metric' });
            const forecastPromise = this._fetchApi('data/2.5/forecast', { lat, lon, units: 'metric' });
            const airQualityPromise = this._fetchApi('data/2.5/air_pollution', { lat, lon });
            const [weather, forecast, airQuality] = await Promise.all([weatherPromise, forecastPromise, airQualityPromise]);
            this.currentData = { weather, forecast, airQuality };
            this._addToSearchHistory(weather.name);
            this._renderAll();
        } catch (error) {
            console.error("Failed to fetch weather data:", error);
        }
    }

    async _fetchSearchSuggestions(query) {
        try {
            const suggestions = await this._fetchApi('geo/1.0/direct', { q: query, limit: 5 });
            this._renderSearchSuggestions(suggestions);
        } catch (error) {
            console.error("Suggestion fetch failed:", error);
            this.dom.suggestionsContainer.innerHTML = '';
        }
    }

    _handleSearch() {
        const city = this.dom.cityInput.value.trim();
        if (city) this.fetchDataByCity(city);
    }

    async fetchDataByCity(city) {
        try {
            const geocodingData = await this._fetchApi('geo/1.0/direct', { q: city, limit: 1 });
            if (geocodingData.length === 0) throw new Error(`City not found: ${city}`);
            const { lat, lon } = geocodingData[0];
            await this._fetchWeatherData(lat, lon);
            this.dom.cityInput.value = '';
        } catch (error) { }
    }

    _getUserLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => this._fetchWeatherData(pos.coords.latitude, pos.coords.longitude),
                () => {
                    this._showError('Location access denied. Showing default city.');
                    const lastCity = this.state.searchHistory[0] || 'London';
                    this.fetchDataByCity(lastCity);
                }
            );
        } else {
            this.fetchDataByCity(this.state.searchHistory[0] || 'London');
        }
    }

    _renderAirQuality(data) {
        const aqi = data.main.aqi;
        const aqiLevels = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
        this.dom.aqi.textContent = aqiLevels[aqi] || "N/A";
    }

    _renderSearchSuggestions(suggestions) {
        if (suggestions.length === 0) {
            this.dom.suggestionsContainer.innerHTML = '';
            return;
        }
        this.dom.suggestionsContainer.innerHTML = suggestions.map(s =>
            `<div class="suggestion-item" data-city="${s.name}, ${s.country}">${s.name}, ${s.state || ''} ${s.country}</div>`
        ).join('');
        this.dom.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.fetchDataByCity(item.dataset.city);
                this.dom.suggestionsContainer.innerHTML = '';
            });
        });
    }

    _handleThemeToggle() {
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('weatherTheme', this.state.theme);
        this._applyTheme();
    }

    _handleUnitToggle() {
        this.state.units = this.dom.unitToggle.checked ? 'imperial' : 'metric';
        localStorage.setItem('weatherUnits', this.state.units);
        if (this.currentData) {
            this._renderAll();
        }
    }

    _addToSearchHistory(city) {
        const cityName = city.toLowerCase();
        this.state.searchHistory = this.state.searchHistory.filter(c => c.toLowerCase() !== cityName);
        this.state.searchHistory.unshift(city);
        if (this.state.searchHistory.length > 5) this.state.searchHistory.pop();
        localStorage.setItem('weatherSearchHistory', JSON.stringify(this.state.searchHistory));
        this._renderSearchHistory();
    }

    _renderSearchHistory() {
        this.dom.searchHistory.innerHTML = this.state.searchHistory
            .map(city => `<button class="history-btn" data-city="${city}">${city}</button>`)
            .join('');
    }

    _updateDynamicTheme(weather) {
        const root = document.body;
        const icon = weather.icon;
        let primaryGradient = '';
        let secondaryGradient = '';

        if (this.state.theme === 'light') {
            primaryGradient = 'linear-gradient(135deg, #f5f7fa, #c3cfe2)';
            secondaryGradient = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
        } else {
            if (icon.includes('n')) {
                primaryGradient = 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)';
                secondaryGradient = 'linear-gradient(135deg, #667eea, #764ba2)';
            } else if (weather.id < 300) {
                primaryGradient = 'linear-gradient(135deg, #1F1C2C, #928DAB)';
                secondaryGradient = 'linear-gradient(135deg, #D31027, #EA384D)';
            } else if (weather.id < 600) {
                primaryGradient = 'linear-gradient(135deg, #005AA7, #a8c1d1)';
                secondaryGradient = 'linear-gradient(135deg, #4ecdc4, #44a08d)';
            } else if (weather.id < 700) {
                primaryGradient = 'linear-gradient(135deg, #7DE2FC, #B9B6E5)';
                secondaryGradient = 'linear-gradient(135deg, #a8edea, #fed6e3)';
            } else if (weather.id === 800) {
                primaryGradient = 'linear-gradient(135deg, #2980B9, #6DD5FA)';
                secondaryGradient = 'linear-gradient(135deg, #ff9a9e, #fecfef)';
            } else if (weather.id > 800) {
                primaryGradient = 'linear-gradient(135deg, #616161, #9bc5c3)';
                secondaryGradient = 'linear-gradient(135deg, #ff7e5f, #feb47b)';
            }
        }

        if (primaryGradient) root.style.setProperty('--primary-gradient', primaryGradient);
        if (secondaryGradient) root.style.setProperty('--secondary-gradient', secondaryGradient);
    }

    _setLoading(isLoading) {
        this.dom.loadingSpinner.classList.toggle('hidden', !isLoading);
        this.dom.searchBtn.disabled = isLoading;
        this.dom.currentLocationBtn.disabled = isLoading;
    }

    _showError(message) {
        this.dom.errorMessage.textContent = `Error: ${message}. Please try again.`;
        this.dom.errorMessage.classList.remove('hidden');
    }

    _debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'c08cb5cd7433622a507d2bac5a7cb966';
    new WeatherApp(API_KEY);
});