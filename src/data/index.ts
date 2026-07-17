import type { Unit } from './types';
import { unitVideos } from './videos';

import orderingRestaurant from './units/ordering-restaurant';
import cafeDrinks from './units/cafe-drinks';
import foodVocab from './units/food-vocab';
import barSocial from './units/bar-social';
import rideshareTaxi from './units/rideshare-taxi';
import publicTransit from './units/public-transit';
import airportTravel from './units/airport-travel';
import hotelCheckin from './units/hotel-checkin';
import smallTalkBasics from './units/small-talk-basics';
import keepingConversation from './units/keeping-conversation';
import slangIdioms from './units/slang-idioms';
import shoppingReturns from './units/shopping-returns';
import grocerySupermarket from './units/grocery-supermarket';
import doctorPharmacy from './units/doctor-pharmacy';
import bankPhoneServices from './units/bank-phone-services';
import emergency from './units/emergency';

const rawUnits: Unit[] = [
  smallTalkBasics,
  keepingConversation,
  slangIdioms,
  orderingRestaurant,
  cafeDrinks,
  foodVocab,
  grocerySupermarket,
  rideshareTaxi,
  publicTransit,
  shoppingReturns,
  barSocial,
  airportTravel,
  hotelCheckin,
  doctorPharmacy,
  bankPhoneServices,
  emergency,
];

export const units: Unit[] = rawUnits.map((u) => ({
  ...u,
  videos: unitVideos[u.id] ?? u.videos,
}));

export const categories = ['社交', '飲食', '購物', '交通', '旅行', '生活'] as const;

export function getUnit(id: string): Unit | undefined {
  return units.find((u) => u.id === id);
}
