import React, {useCallback, useEffect, useRef} from "react";
import $ from '../../../node_modules/jquery/dist/jquery.min.js';
import "./MouseCoordinator.css"
import {useRecoilState, useRecoilValue} from "recoil";
import {nukkiModeState} from "../../stateManagement/atoms/Nukki/nukkiAtom";
import {stagePositionState, stageXState, stageYState} from "../../stateManagement/atoms/Nukki/editorAtom";
import mouseCoordination from "../../utils/canvas";


function MouseCoordinator({imgRef, scaleRatio}) {
  const hLineRef = useRef(null)
  const vLineRef = useRef(null)

  const nukkiMode = useRecoilValue(nukkiModeState)
  const stageX = useRecoilValue(stageXState)
  const stageY = useRecoilValue(stageYState)

  console.log("점을 움직이는데 얘가 왜 리렌더?")

  // new
  useEffect(() => {
    const image = imgRef.current
    image.addEventListener("mousemove", e => mcMouseMove({e, image}))
    image.addEventListener("mouseout", mcMouseOut)
    return () => {
      image.removeEventListener("mousemove", e => mcMouseMove({e, image}))
      image.removeEventListener("mouseout", mcMouseOut)
    }
  }, [imgRef.current, scaleRatio, stageX, stageY, nukkiMode])

  const mcMouseMove = useCallback(({e, image}) => {
    // 모듈화
    mouseCoordination({image, nukkiMode, stageX, stageY,scaleRatio})
  }, [stageX, stageY, scaleRatio, nukkiMode])

  const mcMouseOut = () => {
    $("#tooltip-span").hide();
    $("#vLine").hide();
    $("#hLine").hide();
  }

  return (
    <>
      <span id="tooltip-span"></span>
      <div id="vLine" className="trackingline" ref={vLineRef}></div>
      <div id="hLine" className="trackingline" ref={hLineRef}></div>
    </>
  )
}

export const MemoMouseCoordinator = React.memo(MouseCoordinator)