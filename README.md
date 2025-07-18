# Polished Weather Dashboard 🌦️

> A personal project by **Snehahis** > _([github.com/snehashis842](https://github.com/snehashis842))_

**➡️ [Live Demo](https://snehashis-weather-app.vercel.app/)** ⬅️

## About The Project

This project was developed as a comprehensive exercise in front-end web development, focusing on API integration, modern JavaScript (ES6+), advanced CSS styling, and creating a polished user experience. It started as a simple weather checker and evolved to include numerous advanced features, making it a robust and visually appealing application.

## Features

This isn't just a basic weather app. It's packed with features designed to be both useful and impressive:

- **Real-time Weather Data:** Instantly fetches and displays current temperature, "feels like" temperature, wind speed, humidity, pressure, and more.
- **Geolocation:** Automatically detects the user's location on page load to provide instant local weather.
- **Dynamic UI:**
  - **Animated Icons:** Uses the Skycons.js library to render beautiful, animated weather icons that match the conditions.
  - **Responsive Backgrounds:** The background gradient and accent colors of the UI change dynamically based on the current weather (e.g., sunny, rainy, cloudy, night).
- **Detailed Forecasts:**
  - **5-Day Forecast:** See the weather outlook for the next five days.
  - **Hourly Forecast:** A scrollable view of the weather for the next 8 hours.
- **Robust Search:**
  - Search for any city in the world.
  - Provides search suggestions as you type.
- **User Preferences:**
  - **Dark/Light Mode:** A theme toggle that saves the user's preference in `localStorage`.
  - **Unit Conversion:** Switch between Celsius and Fahrenheit, with the choice saved locally.
  - **Search History:** Saves the last 5 searched cities for quick access.
- **Modern & Responsive Design:**
  - Built with a mobile-first approach.
  - Uses modern CSS features like Grid, Flexbox, and Custom Properties for a clean and maintainable layout.
  - Features a sleek "glassmorphism" effect on all cards.

## Technologies Used

- **HTML5:** For the core structure and semantics.
- **CSS3:** For all styling, including:
  - CSS Grid & Flexbox
  - CSS Custom Properties (Variables)
  - Transitions & Animations
- **JavaScript (ES6+):**
  - Object-Oriented approach with Classes (`WeatherApp`).
  - Asynchronous programming with `async/await` for API calls.
  - `localStorage` for saving user preferences.
  - DOM Manipulation.
- **APIs & Libraries:**
  - **OpenWeatherMap API:** To source all weather and forecast data.
  - **Skycons.js:** For procedurally generated, animated weather icons on HTML canvas.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need a modern web browser and a code editor.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/snehashis842/weather-app.git](https://github.com/snehashis842/weather-app.git)
    ```
2.  **Get a free API Key** from [OpenWeatherMap](https://openweathermap.org/api).
3.  **Add your API Key:**
    Open the `script.js` file and find the following line at the bottom:
    ```javascript
    const API_KEY = "YOUR_API_KEY_HERE";
    ```
    Replace `'YOUR_API_KEY_HERE'` with your own OpenWeatherMap API key.
4.  **Open `index.html`** in your web browser. Using a tool like VS Code's "Live Server" extension is recommended for the best experience.

## License

Distributed under the MIT License.

## Acknowledgements

- [OpenWeatherMap](https://openweathermap.org/api) for providing the weather data API.
- [The Dark Sky Company](https://darksky.net) for creating the original Skycons.
