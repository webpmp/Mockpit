/**
 * Weather Alert Thresholds
 * Centralized, configurable thresholds for detecting weather conditions from forecast data.
 * All thresholds are defined in standard units (US: °F, mph, inches; Metric: °C, km/h, mm)
 * and can be easily tuned or extended.
 */

export interface WeatherAlertThresholdConfig {
  heavyRain: {
    hourlyInchesModerate: number;
    hourlyInchesHigh: number;
    sustained3HrInchesMin: number;
    dailySumInchesMin: number;
    precipProbabilityMin: number;
  };
  heavySnow: {
    hourlyInchesModerate: number;
    hourlyInchesHigh: number;
    dailySumInchesMin: number;
    snowCodes: number[];
  };
  highWind: {
    sustainedMphModerate: number;
    sustainedMphHigh: number;
    sustainedMphExtreme: number;
  };
  strongGusts: {
    gustsMphModerate: number;
    gustsMphHigh: number;
    gustsMphExtreme: number;
  };
  lowVisibility: {
    visibilityMilesModerate: number; // e.g. <= 2.5 miles
    visibilityMilesHigh: number;     // e.g. <= 1.0 mile
    visibilityMilesExtreme: number;  // e.g. <= 0.25 mile
    fogCodes: number[];
  };
  thunderstorm: {
    codes: number[];
    severeCodes: number[];
    capeJkgModerate: number;
    capeJkgHigh: number;
  };
  extremeHeat: {
    tempFHigh: number;
    tempFExtreme: number;
    apparentTempFHigh: number;
    apparentTempFExtreme: number;
  };
  extremeCold: {
    tempFLow: number;
    tempFExtremeLow: number;
    apparentTempFLow: number;
    apparentTempFExtremeLow: number;
  };
  freezingConditions: {
    freezingTempF: number;
    hardFreezeTempF: number;
  };
  highUV: {
    uvIndexHigh: number;
    uvIndexExtreme: number;
  };
  severeWeatherPotential: {
    minSevereConditionsCount: number;
  };
}

export const DEFAULT_WEATHER_ALERT_THRESHOLDS: WeatherAlertThresholdConfig = {
  heavyRain: {
    hourlyInchesModerate: 0.25,
    hourlyInchesHigh: 0.50,
    sustained3HrInchesMin: 0.60,
    dailySumInchesMin: 1.20,
    precipProbabilityMin: 50,
  },
  heavySnow: {
    hourlyInchesModerate: 0.25,
    hourlyInchesHigh: 0.50,
    dailySumInchesMin: 1.50,
    snowCodes: [71, 73, 75, 77, 85, 86],
  },
  highWind: {
    sustainedMphModerate: 25,
    sustainedMphHigh: 35,
    sustainedMphExtreme: 48,
  },
  strongGusts: {
    gustsMphModerate: 35,
    gustsMphHigh: 45,
    gustsMphExtreme: 58,
  },
  lowVisibility: {
    visibilityMilesModerate: 2.5,
    visibilityMilesHigh: 1.0,
    visibilityMilesExtreme: 0.25,
    fogCodes: [45, 48],
  },
  thunderstorm: {
    codes: [95],
    severeCodes: [96, 99], // thunderstorm with hail
    capeJkgModerate: 1000,
    capeJkgHigh: 2000,
  },
  extremeHeat: {
    tempFHigh: 98,
    tempFExtreme: 106,
    apparentTempFHigh: 100,
    apparentTempFExtreme: 110,
  },
  extremeCold: {
    tempFLow: 20,
    tempFExtremeLow: 0,
    apparentTempFLow: 15,
    apparentTempFExtremeLow: -10,
  },
  freezingConditions: {
    freezingTempF: 32,
    hardFreezeTempF: 25,
  },
  highUV: {
    uvIndexHigh: 8,
    uvIndexExtreme: 11,
  },
  severeWeatherPotential: {
    minSevereConditionsCount: 2,
  },
};
