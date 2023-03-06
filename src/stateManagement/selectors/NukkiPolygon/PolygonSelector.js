import {selector} from "recoil";
import {csState, pointsState} from "../../atoms/Nukki/nukkiAtom";

export const pointsByCsSelector = selector({
  key: 'polygonSelector/pointsByCsSelector',
  get: ({get}) => (get(csState)[0].points),
});

export const plgObjListByCsSelector = selector({
  key: 'polygonSelector/plgObjListByCsSelector',
  get: ({get}) => {
    get()
  }
})