import React from 'react';
import { WeatherBody, WeatherBodyProps } from './WeatherBody';

export interface WeatherForecastScreenProps extends WeatherBodyProps {
  onOpenRadar?: () => void;
}

export const WeatherForecastScreen: React.FC<WeatherForecastScreenProps> = (props) => {
  return <WeatherBody {...props} />;
};

export { WeatherBody };
