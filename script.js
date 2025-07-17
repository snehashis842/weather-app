// =========================================================================
// 1. DOM ELEMENT SELECTION
//    (No changes here)
// =========================================================================
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const currentWeatherSection = document.getElementById('currentWeather');
const forecastSection = document.getElementById('forecast');

const cityNameElement = document.getElementById('cityName');
const currentDateElement = document.getElementById('currentDate');
const temperatureElement = document.getElementById('temperature');
const feelsLikeElement = document.getElementById('feelsLike');
const tempRangeElement = document.getElementById('tempRange');
const weatherIconElement = document.getElementById('weatherIcon');
const weatherDescriptionElement = document.getElementById('weatherDescription');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('windSpeed');
const pressureElement = document.getElementById('pressure');
const visibilityElement = document.getElementById('visibility');
const forecastContainer = document.querySelector('.forecast-container');


// =========================================================================
// 2. API CONFIGURATION
//    IMPORTANT: Trying the 'Default' API key here.
// =========================================================================
const API_KEY = '05ba8966c4b360d157d6e7bf618a71ecd'; // <<< Changed to your 'Default' API Key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';


// =========================================================================
// 3. UTILITY FUNCTIONS
//    (No changes here)
// =========================================================================
function showElement(element) {
    element.classList.remove('hidden');
    element.classList.add('fade-in');
    element.addEventListener('animationend', () => {
        element.classList.remove('fade-in');
    }, { once: true });
}

function hideElement(element) {
    element.classList.add('hidden');
}

function displayErrorMessage(message) {
    errorMessage.textContent = message;
    showElement(errorMessage);
    setTimeout(() => {
        hideElement(errorMessage);
    }, 5000);
}

function clearWeatherDisplay() {
    hideElement(currentWeatherSection);
    hideElement(forecastSection);
    errorMessage.textContent = '';
    hideElement(errorMessage);
    forecastContainer.innerHTML = '';
}

function formatDate(date) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function kelvinToCelsius(kelvin) {
    return (kelvin - 273.15).toFixed(1);
}

function mpsToKmh(mps) {
    return (mps * 3.6).toFixed(1);
}

function metersToKm(meters) {
    return (meters / 1000).toFixed(0);
}

// =========================================================================
// 4. FETCHING WEATHER DATA
//    (No changes here)
// =========================================================================
async function getWeatherByCity(city) {
    if (!city) {
        displayErrorMessage('Please enter a city name.');
        clearWeatherDisplay();
        return;
    }

    clearWeatherDisplay();
    showElement(loadingSpinner);
    hideElement(errorMessage);

    try {
        const currentWeatherResponse = await fetch(`${BASE_URL}weather?q=${city}&appid=${API_KEY}&units=metric`);
        const currentWeatherData = await currentWeatherResponse.json();

        if (!currentWeatherResponse.ok) {
            if (currentWeatherData.cod === '404') {
                displayErrorMessage(`City not found: "${city}". Please check the spelling.`);
            } else {
                displayErrorMessage(`Error fetching current weather: ${currentWeatherData.message || 'Unknown error'}`);
            }
            hideElement(loadingSpinner);
            return;
        }

        const forecastResponse = await fetch(`${BASE_URL}forecast?q=${city}&appid=${API_KEY}&units=metric`);
        const forecastData = await forecastResponse.json();

        if (!forecastResponse.ok) {
            displayErrorMessage(`Error fetching forecast: ${forecastData.message || 'Unknown error'}`);
            hideElement(loadingSpinner);
            return;
        }

        displayCurrentWeather(currentWeatherData);
        displayForecast(forecastData);

    } catch (error) {
        console.error('Error fetching weather data:', error);
        displayErrorMessage('Could not fetch weather data. Please check your internet connection or try again later.');
    } finally {
        hideElement(loadingSpinner);
    }
}

// =========================================================================
// 5. DISPLAYING CURRENT WEATHER DATA
//    (No changes here)
// =========================================================================
function displayCurrentWeather(data) {
    const tempCelsius = data.main.temp.toFixed(1);
    const feelsLikeCelsius = data.main.feels_like.toFixed(1);
    const minTempCelsius = data.main.temp_min.toFixed(1);
    const maxTempCelsius = data.main.temp_max.toFixed(1);

    const now = new Date();

    cityNameElement.textContent = `${data.name}, ${data.sys.country}`;
    currentDateElement.textContent = formatDate(now);
    temperatureElement.textContent = `${tempCelsius}°C`;
    feelsLikeElement.textContent = `Feels like: ${feelsLikeCelsius}°C`;
    tempRangeElement.textContent = `H: ${maxTempCelsius}°C L: ${minTempCelsius}°C`;
    weatherIconElement.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    weatherIconElement.alt = data.weather[0].description;
    weatherDescriptionElement.textContent = data.weather[0].description;
    humidityElement.textContent = `${data.main.humidity}%`;
    windSpeedElement.textContent = `${mpsToKmh(data.wind.speed)} km/h`;
    pressureElement.textContent = `${data.main.pressure} hPa`;
    visibilityElement.textContent = `${metersToKm(data.visibility)} km`;

    showElement(currentWeatherSection);
    currentWeatherSection.classList.add('fade-in');
}

function displayForecast(data) {
    forecastContainer.innerHTML = '';

    const dailyForecasts = {};

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const hour = date.getHours();

        if (!dailyForecasts[day] || (hour >= 12 && hour < 15)) {
            dailyForecasts[day] = item;
        }
    });

    const forecastDays = Object.values(dailyForecasts).slice(0, 5);

    forecastDays.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = item.main.temp.toFixed(0);
        const icon = item.weather[0].icon;
        const description = item.weather[0].description;

        const forecastCard = document.createElement('div');
        forecastCard.classList.add('forecast-card');
        forecastCard.innerHTML = `
            <p class="forecast-date">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" class="forecast-icon">
            <p class="forecast-temp">${temp}°C</p>
            <p class="forecast-desc">${description}</p>
        `;
        forecastContainer.appendChild(forecastCard);
    });

    showElement(forecastSection);
    forecastSection.classList.add('fade-in');
}


// =========================================================================
// 6. EVENT LISTENERS
//    (No changes here)
// =========================================================================
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    getWeatherByCity(city);
});

cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        getWeatherByCity(city);
    }
});

// =========================================================================
// 7. INITIAL LOAD (Optional)
//    (No changes here)
// =========================================================================
// getWeatherByCity('London');
