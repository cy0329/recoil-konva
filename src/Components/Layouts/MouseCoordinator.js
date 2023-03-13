import React, {useEffect, useRef} from "react";
import $ from '../../../node_modules/jquery/dist/jquery.min.js';
import "./MouseCoordinator.css"
import {useRecoilValue} from "recoil";
import {nukkiModeState} from "../../stateManagement/atoms/Nukki/nukkiAtom";


function MouseCoordinator({imgRef}) {
  const hLineRef = useRef(null)
  const vLineRef = useRef(null)

  const nukkiMode = useRecoilValue(nukkiModeState)

  useEffect(() => {
    const imgEl = imgRef.current;
    let mouseCd = $('#mouse-coordinator')

    hLineRef.current.width = imgEl.width;
    vLineRef.current.height = imgEl.height;

    console.log()

    mouseCd.mousemove(function (event) {

      $("#tooltip-span").show();
      $("#vLine").show();
      $("#hLine").show()

      let cordinates = getCordinates(event, mouseCd);

      $("#tooltip-span").html("x : " + cordinates.x + "<br>y : " + cordinates.y + "<br>" + (nukkiMode ? "마스킹 모드" : "선택/수정 모드"));

      let tooltipSpanLeft = (cordinates.x + $("#tooltip-span").width() + 25 < imgEl.width) ? (cordinates.x + 15 + "px") : (cordinates.x - 25 - $("#tooltip-span").width() + "px")
      let tooltipSpanTop = (cordinates.y + $("#tooltip-span").height() + 20 < imgEl.height) ? (cordinates.y + 15 + "px") : (cordinates.y - 20 - $("#tooltip-span").height() + "px")

      $("#tooltip-span").css({
        "left": tooltipSpanLeft,
        "top": tooltipSpanTop,
        // "overflow":"hidden",
        "white-space":"nowrap"
      });
      $("#vLine").css({
        left: cordinates.x
      });
      $("#hLine").css({
        top: cordinates.y
      })
    })

    mouseCd.mouseout(function (event) {
      $("#tooltip-span").hide();
      $("#vLine").hide();
      $("#hLine").hide();
      // hLineRef.current.style.visibility = "hidden";
      // vLineRef.current.style.visibility = "hidden";
    });
  }, [imgRef.current, nukkiMode])


  function getCordinates(event, element) {
    // console.log(event)
    // console.log(element)
    let rect = element[0].getBoundingClientRect();
    // console.log(rect)
    // console.log(event)
    let x = event.pageX - Math.ceil(rect.left);
    let y = event.pageY - Math.ceil(rect.top);
    // console.log(x, y)
    return {
      x: x,
      y: y
    };
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