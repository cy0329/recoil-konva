import React, {useEffect} from 'react'
import Slider from "rc-slider";
import './ImageFilters.css'
import 'rc-slider/assets/index.css';
import {useRecoilState, useRecoilValue, useResetRecoilState} from "recoil";
import {
  brightnessState,
  contrastState, filterState,
  hueState,
  saturationState
} from "../../stateManagement/atoms/canvasFilter/canvasFilterAtom";
import {toolbarIsOpenState} from "../../stateManagement/atoms/layout/toolbarAtom";

function ImageFilters() {
  const toolbarIsOpen = useRecoilValue(toolbarIsOpenState)

  const [contrast, setContrast] = useRecoilState(contrastState)
  const [hue, setHue] = useRecoilState(hueState)
  const [brightness, setBrightness] = useRecoilState(brightnessState)
  const [saturation, setSaturation] = useRecoilState(saturationState)
  const [filter, setFilter] = useRecoilState(filterState)

  const resetContrast = useResetRecoilState(contrastState)
  const resetHue = useResetRecoilState(hueState)
  const resetBrightness = useResetRecoilState(brightnessState)
  const resetSaturation = useResetRecoilState(saturationState)

  function resetFilters() {
    resetContrast()
    resetHue()
    resetBrightness()
    resetSaturation()
  }

  useEffect(() => {
    setFilter(`contrast(${contrast}%) hue-rotate(${hue}DEG) brightness(${brightness}%) saturate(${saturation}%)`)
  }, [contrast, hue, brightness, saturation])

  return (
    <div id="image-filter">
      <label htmlFor="contrast">대비 {contrast}%</label>
      <Slider id="contrast" min={0} max={200} startPoint={100} defaultValue={100} value={contrast}
              disabled={!toolbarIsOpen}
              onChange={e => setContrast(e)}/>
      <label htmlFor="brightness">밝기 {brightness}%</label>
      <Slider id="brightness" min={0} max={200} startPoint={100} defaultValue={100} value={brightness}
              disabled={!toolbarIsOpen}
              onChange={e => setBrightness(e)}/>
      <label htmlFor="hue">색상 {hue}º</label>
      <Slider id="hue" min={0} max={360} startPoint={0} defaultValue={0} value={hue}
              disabled={!toolbarIsOpen}
              onChange={e => setHue(e)}/>
      <label htmlFor="saturation">채도 {saturation}%</label>
      <Slider id="saturation" min={0} max={100} startPoint={100} defaultValue={100} value={saturation}
              disabled={!toolbarIsOpen}
              onChange={e => setSaturation(e)}/>
      <button onClick={resetFilters}>resetFilter</button>
    </div>
  )
}

export default ImageFilters