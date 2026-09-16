import React from 'react';
import { RadarBody, RadarBodyProps } from './RadarBody';

export interface WeatherRadarScreenProps extends RadarBodyProps {}

export const WeatherRadarScreen: React.FC<WeatherRadarScreenProps> = (props) => {
  return <RadarBody {...props} />;
};

export { RadarBody };
