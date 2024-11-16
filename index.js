const API_ID = '487bb67fdb01130093630ab5518b64c5';
const DEFAULT_VALUE = "N/A";

// DOM elements
const searchInput = document.querySelector('#search-input');
const cityName = document.querySelector('.city-name');
const weatherState = document.querySelector('.weather-state');
const weatherIcon = document.querySelector('.weather-icon');
const temperature = document.querySelector('.temperature');
const currentDate = document.querySelector('.current-date');

const sunrise = document.querySelector('.sunrise');
const sunset = document.querySelector('.sunset');
const humidity = document.querySelector('.humidity');
const windSpeed = document.querySelector('.wind-speed');

const hourlyForecastContainer = document.querySelector('.hourly-forecast-items');
const dailyForecastContainer = document.querySelector('.daily-forecast-items');
const weatherAlert = document.querySelector('#weather-alert');

// Background colors for different weather states
const weatherColors = {
    Clear: "linear-gradient(to bottom, #ffefba, #ffc107)",
    Rain: "linear-gradient(to bottom, #4e54c8, #8f94fb)",
    Clouds: "linear-gradient(to bottom, #bdc3c7, #2c3e50)",
    Snow: "linear-gradient(to bottom, #e0eafc, #cfdef3)",
    Thunderstorm: "linear-gradient(to bottom, #434343, #000000)"
};

// Display weather alert based on temperature and conditions
function showWeatherAlert(temp, condition, aqi, uvIndex) {
    let message = "";

    // Kiểm tra nhiệt độ
    if (temp > 30) {
        message = "🌞 Trời rất nóng! Uống nhiều nước nhé!";
    } else if (temp < 15) {
        message = "❄️ Trời lạnh! Hãy mặc ấm nhé!";
    }

    // Kiểm tra điều kiện thời tiết
    if (condition.includes('mưa')) {
        message += " ☔ Nhớ mang ô vì trời mưa!";
    } else if (condition.includes('tuyết')) {
        message += " ❄️ Có tuyết rơi! Cẩn thận trơn trượt!";
    }

    // Kiểm tra chất lượng không khí
    if (aqi !== undefined) {
        let airQualityMessage = "";
        if (aqi <= 50) {
            airQualityMessage = "🌱 Chất lượng không khí tốt!";
        } else if (aqi <= 100) {
            airQualityMessage = "🌾 Chất lượng không khí trung bình!";
        } else if (aqi <= 150) {
            airQualityMessage = "🌳 Chất lượng không khí kém!";
        } else {
            airQualityMessage = "💨 Chất lượng không khí nguy hiểm!";
        }
        message += "<br>" + airQualityMessage;
    }

    // Kiểm tra chỉ số UV
    if (uvIndex !== undefined) {
        let uvMessage = "";
        if (uvIndex <= 2) {
            uvMessage = "🌞 Chỉ số UV thấp. An toàn!";
        } else if (uvIndex <= 5) {
            uvMessage = "☀️ Chỉ số UV trung bình. Cẩn thận!";
        } else if (uvIndex <= 7) {
            uvMessage = "🌞 Chỉ số UV cao. Đừng quên kem chống nắng!";
        } else {
            uvMessage = "🌞 Chỉ số UV rất cao. Tránh tiếp xúc với nắng!";
        }
        message += "<br>" + uvMessage;
    }

    // Hiển thị thông báo
    weatherAlert.innerHTML = message;
    weatherAlert.style.display = message ? 'block' : 'none';
}

// Update current weather data
function updateWeatherData(data) {
    if (!data || !data.weather || !data.weather[0]) return;

    const weather = data.weather[0].main;
    document.body.style.background = weatherColors[weather] || "linear-gradient(to bottom, #89f7fe, #66a6ff)";
    cityName.textContent = data.name || DEFAULT_VALUE;
    weatherState.textContent = data.weather[0].description || DEFAULT_VALUE;
    weatherIcon.setAttribute('src', `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`);
    temperature.textContent = Math.round(data.main.temp) || DEFAULT_VALUE;

    sunrise.textContent = data.sys.sunrise ? moment.unix(data.sys.sunrise).format('H:mm') : DEFAULT_VALUE;
    sunset.textContent = data.sys.sunset ? moment.unix(data.sys.sunset).format('H:mm') : DEFAULT_VALUE;
    humidity.textContent = data.main.humidity || DEFAULT_VALUE;
    windSpeed.textContent = (data.wind.speed * 3.6).toFixed(2) || DEFAULT_VALUE;
    
    const temp = Math.round(data.main.temp);
    const condition = data.weather[0].description;
    
    // Call air pollution API for AQI
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${API_ID}`)
        .then(res => res.json())
        .then(airData => {
            const aqi = airData.list[0].main.aqi;
            const uvIndex = airData.list[0].components.uvi;
            showWeatherAlert(temp, condition, aqi, uvIndex);
        })
        .catch(() => alert("❌ Không thể lấy dữ liệu chất lượng không khí."));

    currentDate.textContent = moment().format('dddd, MMMM Do YYYY');
}

// Update hourly forecast
function updateHourlyForecast(data) {
    if (!data || !data.list) return;

    hourlyForecastContainer.innerHTML = '';
    const currentTime = moment();
    const hourlyData = data.list.filter(item => moment(item.dt_txt).isAfter(currentTime));

    hourlyData.slice(0, 8).forEach(item => {
        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        forecastItem.innerHTML = `
            <div class="time">${moment(item.dt_txt).format('HH:mm')}</div>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="weather-icon">
            <div class="temperature">${Math.round(item.main.temp)}°</div>
        `;
        hourlyForecastContainer.appendChild(forecastItem);
    });
}

// Update daily forecast
function updateDailyForecast(data) {
    if (!data || !data.list) return;

    dailyForecastContainer.innerHTML = '';
    const today = moment().startOf('day');

    const tomorrow = moment().add(1, 'days').startOf('day');

    const dailyData = data.list.filter((_, index) => {
        const forecastDate = moment(data.list[index].dt_txt);
        return forecastDate.isSameOrAfter(today, 'day');
    }).filter((_, index) => index % 8 === 0);

    dailyData.forEach(item => {
        const forecastDate = moment(item.dt_txt).startOf('day');
        let dayLabel = forecastDate.isSame(today, 'day') ? "Hôm nay" : forecastDate.isSame(tomorrow, 'day') ? "Ngày mai" : moment(forecastDate).format('dddd');

        const forecastItem = document.createElement('div');
        forecastItem.classList.add('daily-forecast-item');
        forecastItem.innerHTML = `
            <div class="time">${dayLabel}</div>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="weather-icon">
            <div class="temperature">${Math.round(item.main.temp)}°</div>
        `;
        dailyForecastContainer.appendChild(forecastItem);
    });
}

// Fetch weather data based on user's location
function fetchWeatherByLocation(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_ID}&units=metric&lang=vi`)
        .then(res => res.json())
        .then(data => {
            updateWeatherData(data);
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_ID}&units=metric&lang=vi`)
                .then(res => res.json())
                .then(forecastData => {
                    updateHourlyForecast(forecastData);
                    updateDailyForecast(forecastData);
                })
                .catch(() => alert("❌ Không thể lấy dữ liệu dự báo."));
        })
        .catch(() => alert("❌ Không thể lấy dữ liệu thời tiết hiện tại."));
}
// Get user's location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchWeatherByLocation, showError);
    } else {
        alert("Trình duyệt của bạn không hỗ trợ định vị.");
    }
}

// Handle geolocation errors
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("❌ Người dùng đã từ chối cấp quyền truy cập vị trí.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("❌ Vị trí không khả dụng.");
            break;
        case error.TIMEOUT:
            alert("❌ Quá thời gian để lấy vị trí.");
            break;
        default:
            alert("❌ Đã xảy ra lỗi khi lấy vị trí.");
    }
}

// Event listener for search input
searchInput.addEventListener('change', (e) => {
    const city = e.target.value;

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_ID}&units=metric&lang=vi`)
        .then(res => res.json())
        .then(data => {
            if (data.cod === "404") {
                alert("❌ Thành phố không tồn tại. Vui lòng nhập lại.");
                return;
            }
            updateWeatherData(data);

            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_ID}&units=metric&lang=vi`)
                .then(res => res.json())
                .then(data => {
                    updateHourlyForecast(data);
                    updateDailyForecast(data);
                })
                .catch(() => alert("❌ Không thể lấy dữ liệu dự báo."));
        })
        .catch(() => alert("❌ Không thể lấy dữ liệu thời tiết cho thành phố này."));
});

// Load weather data when page is loaded
getUserLocation();
