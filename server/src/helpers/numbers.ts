import { Chance } from "chance";

const CHANCE = new Chance();

export function guid() {
  return CHANCE.guid();
}
