import React, {useCallback, useEffect, useRef} from "react";
import $ from '../../../node_modules/jquery/dist/jquery.min.js';
import "./MouseCoordinator.css"
import {useRecoilValue} from "recoil";
import {nukkiModeState} from "../../stateManagement/atoms/Nukki/nukkiAtom";
import {stagePositionState} from "../../stateManagement/atoms/Nukki/editorAtom";


function MouseCoordinator({imgRef, scaleRatio}) {
  const hLineRef = useRef(null)
  const vLineRef = useRef(null)

  const nukkiMode = useRecoilValue(nukkiModeState)
  const stagePos = useRecoilValue(stagePositionState)

  // new
  useEffect(() => {
    const image = imgRef.current
    image.addEventListener("mousemove", e => mcMouseMove({e, image}))
    image.addEventListener("mouseout", mcMouseOut)
    return () => {
      image.removeEventListener("mousemove", mcMouseMove)
      image.removeEventListener("mouseout", mcMouseOut)
    }
  }, [imgRef.current, scaleRatio, stagePos, nukkiMode])

  const mcMouseMove = useCallback(({e, image}) => {
    $("#tooltip-span").show();
    $("#vLine").show();
    $("#hLine").show()

    // console.log("e", e)
    let stgPntPos = image.getStage().getPointerPosition()
    let coordinates = {x: Math.round(stgPntPos.x - stagePos.x), y: Math.round(stgPntPos.y - stagePos.y)}
    let imageSize = {w: image.attrs.image.width, h: image.attrs.image.height}
    // console.log("=====S====")
    // console.log("stgPntPos: ", stgPntPos)
    // console.log("coord: ", coordinates)
    // console.log("size: ", imageSize)
    // console.log("tooltip: ", Math.round($("#tooltip-span").width()), $("#tooltip-span").height())
    // console.log("stagePos: ", stagePos)
    // console.log("==========")


    $("#tooltip-span").html("x : " + coordinates.x + "<br>y : " + coordinates.y + "<br>" + (nukkiMode ? "마스킹 모드" : "컨트롤 모드") + "<br> zoom : " + scaleRatio);
    let tooltipSpanLeft = (coordinates.x + 35 + $("#tooltip-span").width() > imageSize.w ? stgPntPos.x - $("#tooltip-span").width() - 25 : stgPntPos.x + 25)
    let tooltipSpanTop = (coordinates.y + 25 + $("#tooltip-span").height() > imageSize.h ? stgPntPos.y - $("#tooltip-span").height() - 20 : stgPntPos.y + 20)
    $("#tooltip-span").css({
      "left": tooltipSpanLeft,
      "top": tooltipSpanTop,
      // "overflow":"hidden",
      "white-space": "nowrap"
    });

    const originalSize = {w: Math.round(imageSize.w / scaleRatio), h: Math.round(imageSize.h / scaleRatio)}

    $("#vLine").css({
      left: stgPntPos.x,
      top: stagePos.y >= 0 ? stagePos.y : 0,
      height: imageSize.h - Math.abs(stagePos.y) > originalSize.h ? originalSize.h : imageSize.h - Math.abs(stagePos.y)
    });
    $("#hLine").css({
      left: stagePos.x >= 0 ? stagePos.x : 0,
      top: stgPntPos.y,
      width: imageSize.w  - Math.abs(stagePos.x) > originalSize.w ? originalSize.w : imageSize.w  - Math.abs(stagePos.x)
    })

  }, [stagePos, scaleRatio, nukkiMode])

  const mcMouseOut = () => {
    $("#tooltip-span").hide();
    $("#vLine").hide();
    $("#hLine").hide();
  }

  // useEffect(() => {
  //   const imgEl = imgRef.current;
  //   let mouseCd = $('#mouse-coordinator')
  //   console.log("imgEl: ", imgEl)
  //   console.log("mouseCd: ", mouseCd)
  //   mouseCd.mousemove(function (event) {
  //     $("#tooltip-span").show();
  //     $("#vLine").show();
  //     $("#hLine").show()
  //
  //
  //     let coordinates = getCoordinates(event, imgEl.attrs.image);
  //
  //     $("#tooltip-span").html("x : " + Math.round(coordinates.x - stagePos.x) + "<br>y : " + Math.round(coordinates.y - stagePos.y) + "<br>" + (nukkiMode ? "마스킹 모드" : "선택/수정 모드") + "<br> zoom : " + scaleRatio);
  //
  //     let tooltipSpanLeft = (coordinates.x + $("#tooltip-span").width() + 25 < imgEl.width) ? (coordinates.x + 15 + "px") : (coordinates.x - 25 - $("#tooltip-span").width() + "px")
  //     let tooltipSpanTop = (coordinates.y + $("#tooltip-span").height() + 20 < imgEl.height) ? (coordinates.y + 15 + "px") : (coordinates.y - 20 - $("#tooltip-span").height() + "px")
  //
  //     $("#tooltip-span").css({
  //       "left": tooltipSpanLeft,
  //       "top": tooltipSpanTop,
  //       // "overflow":"hidden",
  //       "white-space":"nowrap"
  //     });
  //     $("#vLine").css({
  //       left: coordinates.x,
  //       top: stagePos.y >= 0 ? stagePos.y : 0,
  //       height: mouseCd.height() - (stagePos.y >= 0 ? stagePos.y : -stagePos.y)
  //     });
  //     $("#hLine").css({
  //       left: stagePos.x >= 0 ? stagePos.x : 0,
  //       top: coordinates.y,
  //       width: mouseCd.width() - (stagePos.x >= 0 ? stagePos.x : -stagePos.x)
  //     })
  //
  //     if (Math.round(coordinates.x - stagePos.x) < 0 || Math.round(coordinates.y - stagePos.y) < 0) {
  //       $("#tooltip-span").hide();
  //       $("#vLine").hide();
  //       $("#hLine").hide();
  //     }
  //   })
  //
  //
  //   // mouseCd.mouseout(function (event) {
  //   //   $("#tooltip-span").hide();
  //   //   $("#vLine").hide();
  //   //   $("#hLine").hide();
  //   // });
  // }, [imgRef.current, nukkiMode, stagePos])


  // function getCoordinates(event, element) {
  //   let rect = element.getBoundingClientRect();
  //   // console.log(event)
  //   // let rect = element.getClientRect();
  //
  //   let x = event.pageX - Math.ceil(rect.left);
  //   let y = event.pageY - Math.ceil(rect.top);
  //   return {
  //     x: x,
  //     y: y
  //   };
  // }

  return (
    <>
      <span id="tooltip-span"></span>
      <div id="vLine" className="trackingline" ref={vLineRef}></div>
      <div id="hLine" className="trackingline" ref={hLineRef}></div>
    </>
  )
}

export default MouseCoordinator