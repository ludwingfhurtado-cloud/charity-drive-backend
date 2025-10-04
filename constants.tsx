import React from 'react';
import { RideOption } from './types';
import { 
  RIDE_IMAGE_DATA, 
  COMFORT_IMAGE_DATA, 
  MOTO_IMAGE_DATA,
  DELIVERIES_IMAGE_DATA,
  FREIGHT_IMAGE_DATA
} from './assets/images';

export const RIDE_OPTIONS: RideOption[] = [
  {
    id: 'viaje',
    multiplier: 1.0,
    icon: RIDE_IMAGE_DATA,
  },
  {
    id: 'confort',
    multiplier: 1.5,
    icon: COMFORT_IMAGE_DATA,
  },
  {
    id: 'moto',
    multiplier: 0.8,
    icon: MOTO_IMAGE_DATA,
  },
  {
    id: 'entregas',
    multiplier: 0.9,
    icon: DELIVERIES_IMAGE_DATA,
  },
  {
    id: 'flete',
    multiplier: 2.0,
    icon: FREIGHT_IMAGE_DATA,
  },
];