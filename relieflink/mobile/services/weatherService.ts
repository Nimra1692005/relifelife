/**
 * ReliefLink — Weather Intelligence Service
 *
 * Architecture:
 *   - Provider-agnostic: swap MockWeatherProvider → OpenWeatherMap/WeatherAPI
 *   - All mock data is realistic for Islamabad during monsoon season
 *   - API keys configured via environment variables
 *
 * Production: Replace MockWeatherProvider with real API calls.
 * Set WEATHER_API_KEY and WEATHER_PROVIDER env vars.
 */

// ─── Types ──────────────────────────────────────────────────

export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'light_rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'drizzle'
  | 'fog';

export type WeatherSeverity = 'normal' | 'advisory' | 'warning' | 'severe';

export interface HourlyForecast {
  hour: string;       // "14:00"
  temp: number;       // °C
  condition: WeatherCondition;
  conditionLabel: string;
  rainProbability: number; // 0-100
  icon: string;       // emoji
}

export interface DailyForecast {
  day: string;        // "Mon"
  date: string;       // "Aug 28"
  highTemp: number;
  lowTemp: number;
  condition: WeatherCondition;
  conditionLabel: string;
  rainProbability: number;
  icon: string;
}

export interface WeatherWarning {
  id: string;
  severity: WeatherSeverity;
  title: string;
  description: string;
  icon: string;
  action: string;
}

export interface CurrentWeather {
  temperature: number;       // °C
  feelsLike: number;         // °C
  condition: WeatherCondition;
  conditionLabel: string;
  icon: string;
  humidity: number;          // %
  windSpeed: number;         // km/h
  windDirection: string;     // "NW"
  rainProbability: number;   // 0-100
  uvIndex: number;           // 0-11
  visibility: number;        // km
  pressure: number;          // hPa
  sunrise: string;           // "05:48"
  sunset: string;            // "18:52"
}

export interface WeatherData {
  current: CurrentWeather;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  warnings: WeatherWarning[];
  location: string;
  updatedAt: string;
  source: string;
}

export interface WeatherProvider {
  name: string;
  isAvailable(): boolean;
  getCurrentWeather(lat: number, lng: number): Promise<WeatherData>;
}

// ─── Weather Condition Icons ────────────────────────────────

const conditionIcons: Record<WeatherCondition, string> = {
  clear: '☀️',
  partly_cloudy: '⛅',
  cloudy: '☁️',
  light_rain: '🌦️',
  heavy_rain: '🌧️',
  thunderstorm: '⛈️',
  drizzle: '🌦️',
  fog: '🌫️',
};

const conditionLabels: Record<WeatherCondition, string> = {
  clear: 'Clear Sky',
  partly_cloudy: 'Partly Cloudy',
  cloudy: 'Overcast',
  light_rain: 'Light Rain',
  heavy_rain: 'Heavy Rain',
  thunderstorm: 'Thunderstorm',
  drizzle: 'Drizzle',
  fog: 'Fog / Mist',
};

// ─── Mock Weather Provider ──────────────────────────────────

class MockWeatherProvider implements WeatherProvider {
  name = 'mock';

  isAvailable(): boolean {
    return true;
  }

  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300));

    const current: CurrentWeather = {
      temperature: 28,
      feelsLike: 32,
      condition: 'heavy_rain',
      conditionLabel: 'Heavy Rain',
      icon: '🌧️',
      humidity: 89,
      windSpeed: 24,
      windDirection: 'SW',
      rainProbability: 85,
      uvIndex: 2,
      visibility: 4,
      pressure: 1004,
      sunrise: '05:48',
      sunset: '18:52',
    };

    // Generate 24-hour forecast starting from "now"
    const hourlyForecast: HourlyForecast[] = [
      { hour: '14:00', temp: 28, condition: 'heavy_rain', conditionLabel: 'Heavy Rain', rainProbability: 85, icon: '🌧️' },
      { hour: '15:00', temp: 27, condition: 'heavy_rain', conditionLabel: 'Heavy Rain', rainProbability: 80, icon: '🌧️' },
      { hour: '16:00', temp: 27, condition: 'thunderstorm', conditionLabel: 'Thunderstorm', rainProbability: 90, icon: '⛈️' },
      { hour: '17:00', temp: 26, condition: 'heavy_rain', conditionLabel: 'Heavy Rain', rainProbability: 85, icon: '🌧️' },
      { hour: '18:00', temp: 25, condition: 'light_rain', conditionLabel: 'Light Rain', rainProbability: 70, icon: '🌦️' },
      { hour: '19:00', temp: 24, condition: 'light_rain', conditionLabel: 'Light Rain', rainProbability: 60, icon: '🌦️' },
      { hour: '20:00', temp: 23, condition: 'drizzle', conditionLabel: 'Drizzle', rainProbability: 50, icon: '🌦️' },
      { hour: '21:00', temp: 22, condition: 'cloudy', conditionLabel: 'Overcast', rainProbability: 40, icon: '☁️' },
      { hour: '22:00', temp: 22, condition: 'cloudy', conditionLabel: 'Overcast', rainProbability: 35, icon: '☁️' },
      { hour: '23:00', temp: 21, condition: 'partly_cloudy', conditionLabel: 'Partly Cloudy', rainProbability: 25, icon: '⛅' },
      { hour: '00:00', temp: 21, condition: 'partly_cloudy', conditionLabel: 'Partly Cloudy', rainProbability: 20, icon: '⛅' },
      { hour: '01:00', temp: 20, condition: 'partly_cloudy', conditionLabel: 'Partly Cloudy', rainProbability: 15, icon: '⛅' },
    ];

    const dailyForecast: DailyForecast[] = [
      { day: 'Today', date: 'Aug 27', highTemp: 29, lowTemp: 20, condition: 'heavy_rain', conditionLabel: 'Heavy Rain', rainProbability: 85, icon: '🌧️' },
      { day: 'Thu', date: 'Aug 28', highTemp: 31, lowTemp: 22, condition: 'thunderstorm', conditionLabel: 'Thunderstorm', rainProbability: 75, icon: '⛈️' },
      { day: 'Fri', date: 'Aug 29', highTemp: 30, lowTemp: 21, condition: 'light_rain', conditionLabel: 'Light Rain', rainProbability: 60, icon: '🌦️' },
      { day: 'Sat', date: 'Aug 30', highTemp: 32, lowTemp: 23, condition: 'partly_cloudy', conditionLabel: 'Partly Cloudy', rainProbability: 30, icon: '⛅' },
      { day: 'Sun', date: 'Aug 31', highTemp: 34, lowTemp: 24, condition: 'clear', conditionLabel: 'Clear Sky', rainProbability: 10, icon: '☀️' },
    ];

    const warnings: WeatherWarning[] = [
      {
        id: 'ww-001',
        severity: 'severe',
        title: 'Flash Flood Risk',
        description: 'Heavy rainfall expected to continue for next 4 hours. Low-lying areas at high risk of flash flooding.',
        icon: '🌊',
        action: 'Move to higher ground. Avoid areas near Nullah Lei and Rawal Dam downstream.',
      },
      {
        id: 'ww-002',
        severity: 'warning',
        title: 'Thunderstorm Advisory',
        description: 'Thunderstorms expected between 4 PM — 8 PM with wind gusts up to 60 km/h.',
        icon: '⛈️',
        action: 'Secure outdoor objects. Avoid open areas and tall structures.',
      },
      {
        id: 'ww-003',
        severity: 'advisory',
        title: 'Reduced Visibility',
        description: 'Heavy rain reducing visibility to under 4 km. Drive carefully.',
        icon: '👁️',
        action: 'Use headlights. Maintain safe following distance.',
      },
    ];

    return {
      current,
      hourlyForecast,
      dailyForecast,
      warnings,
      location: 'Sector G-11, Islamabad',
      updatedAt: new Date().toISOString(),
      source: 'Mock Data — No API connected',
    };
  }
}

// ─── Service Layer ──────────────────────────────────────────

class WeatherService {
  private provider: WeatherProvider;
  private cachedData: WeatherData | null = null;
  private cacheTime: number = 0;
  private cacheDurationMs = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.provider = new MockWeatherProvider();
  }

  setProvider(provider: WeatherProvider): void {
    this.provider = provider;
    this.cachedData = null;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  async getWeather(lat: number = 33.6844, lng: number = 73.0479): Promise<WeatherData> {
    // Return cached data if fresh
    if (
      this.cachedData &&
      Date.now() - this.cacheTime < this.cacheDurationMs
    ) {
      return this.cachedData;
    }

    const data = await this.provider.getCurrentWeather(lat, lng);
    this.cachedData = data;
    this.cacheTime = Date.now();
    return data;
  }

  async getWeatherWarnings(): Promise<WeatherWarning[]> {
    const data = await this.getWeather();
    return data.warnings;
  }

  /** Get the most critical warning severity */
  getHighestWarningSeverity(warnings: WeatherWarning[]): WeatherSeverity {
    const order: Record<WeatherSeverity, number> = {
      normal: 0,
      advisory: 1,
      warning: 2,
      severe: 3,
    };
    let highest: WeatherSeverity = 'normal';
    for (const w of warnings) {
      if (order[w.severity] > order[highest]) highest = w.severity;
    }
    return highest;
  }

  /** Compute rain risk from weather data (0-100) */
  computeRainRisk(weather: WeatherData): number {
    const rain = weather.current.rainProbability;
    const wind = Math.min(weather.current.windSpeed, 60) / 60;
    const condition = weather.current.condition;
    let conditionRisk = 0;
    if (condition === 'thunderstorm') conditionRisk = 40;
    else if (condition === 'heavy_rain') conditionRisk = 30;
    else if (condition === 'light_rain') conditionRisk = 15;
    else if (condition === 'drizzle') conditionRisk = 5;

    return Math.min(100, Math.round(rain * 0.5 + wind * 20 + conditionRisk));
  }

  clearCache(): void {
    this.cachedData = null;
    this.cacheTime = 0;
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const weatherService = new WeatherService();
export { conditionIcons, conditionLabels };
