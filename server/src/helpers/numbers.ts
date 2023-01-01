import { Chance } from "chance";

const CHANCE = new Chance();

export function randomInteger(min: number, max: number) {
  return CHANCE.integer({ min, max });
}

export function guid() {
  return CHANCE.guid();
}
