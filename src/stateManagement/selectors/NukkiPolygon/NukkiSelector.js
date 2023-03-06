import {selector} from "recoil";
import {polygonObjListState} from "../../atoms/Nukki/nukkiAtom";

export const nukkiModeBySelectedPlgObjectSelector = selector({
  key: 'nukkiSelector/nukkiModeBySelectedPlgObjectSelector',
  get: ({get}) => {
    const plgObjList = get(polygonObjListState)
    for (let item of plgObjList) {
      if (item.selected) {
        return false
      }
    }
    return true
  },
});