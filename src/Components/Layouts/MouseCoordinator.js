import React, {useCallback, useEffect, useRef} from "react";
import $ from '../../../node_modules/jquery/dist/jquery.min.js';
import "./MouseCoordinator.css"
import {useRecoilState, useRecoilValue} from "recoil";
import {nukkiModeState} from "../../stateManagement/atoms/Nukki/nukkiAtom";
import {stagePositionState, stageXState, stageYState} from "../../stateManagement/atoms/Nukki/editorAtom";


function MouseCoordinator({imgRef, scaleRatio}) {
  const hLineRef = useRef(null)
  const vLineRef = useRef(null)

  const nukkiMode = useRecoilValue(nukkiModeState)
  const stageX = useRecoilValue(stageXState)
  const stageY = useRecoilValue(stageYState)
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
    $("#tooltip-span").show();
    $("#vLine").show();
    $("#hLine").show()

    let stgPntPos = image.getStage().getPointerPosition()
    let coordinates = {x: Math.round(stgPntPos.x - stageX), y: Math.round(stgPntPos.y - stageY)}
    let childImage = image.children[0].attrs.image
    let imageSize = {w: childImage.width, h: childImage.height}

    $("#tooltip-span").html("x : " + coordinates.x + "<br>y : " + coordinates.y + "<br>" + (nukkiMode ? "마스킹 모드" : "컨트롤 모드") + "<br> zoom : " + scaleRatio);
    let tooltipSpanLeft = (coordinates.x + 35 + $("#tooltip-span").width() > imageSize.w ? stgPntPos.x - $("#tooltip-span").width() - 25 : stgPntPos.x + 25)
    let tooltipSpanTop = (coordinates.y + 25 + $("#tooltip-span").height() > imageSize.h ? stgPntPos.y - $("#tooltip-span").height() - 20 : stgPntPos.y + 20)
    $("#tooltip-span").css({
      "left": tooltipSpanLeft,
      "top": tooltipSpanTop,
      "white-space": "nowrap"
    });

    const originalSize = {w: Math.round(imageSize.w / scaleRatio), h: Math.round(imageSize.h / scaleRatio)}

    $("#vLine").css({
      left: stgPntPos.x,
      top: stageY >= 0 ? stageY : 0,
      height: imageSize.h - Math.abs(stageY) > originalSize.h ? originalSize.h : imageSize.h - Math.abs(stageY)
    });
    $("#hLine").css({
      left: stageX >= 0 ? stageX : 0,
      top: stgPntPos.y,
      width: imageSize.w  - Math.abs(stageX) > originalSize.w ? originalSize.w : imageSize.w  - Math.abs(stageX)
    })

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

export default MouseCoordinator