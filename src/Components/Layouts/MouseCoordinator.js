import React, {useEffect, useRef} from "react";
import $ from '../../../node_modules/jquery/dist/jquery.min.js';
import "./MouseCoordinator.css"


function MouseCoordinator({imgRef}) {

  function getCordinates(event, element) {
    let rect = element[0].getBoundingClientRect();
    // console.log(rect)
    // console.log(event)
    let x = event.pageX - Math.ceil(rect.left);
    let y = event.pageY - Math.ceil(rect.top);
    return {
      x: x,
      y: y
    };
  }

  const hLineRef = useRef(null)
  const vLineRef = useRef(null)

  useEffect(() => {
    const imageCanvas = imgRef.current;
    const imgCtx = imageCanvas.getContext('2d')

    let mouseCd = $('#mouse-coordinator')


    hLineRef.current.width = imgCtx.canvas.width;
    vLineRef.current.height = imgCtx.canvas.height;

    console.log()

    mouseCd.mousemove(function (event) {

      $("#tooltip-span").show();
      $("#vLine").show();
      $("#hLine").show()
      let cordinates = getCordinates(event, mouseCd);
      let tooltipSpanLeft = cordinates.x + $("#tooltip-span").width() + 25 < imgCtx.canvas.width ? cordinates.x + 15 + "px" : cordinates.x - 15 - $("#tooltip-span").width() + "px"
      let tooltipSpanTop = cordinates.y + $("#tooltip-span").height() + 20 < imgCtx.canvas.height ? cordinates.y + 15 + "px" : cordinates.y - 15 - $("#tooltip-span").height() + "px"


      $("#tooltip-span").css({
        "left": tooltipSpanLeft,
        "top": tooltipSpanTop
      });
      $("#tooltip-span").html("x:" + cordinates.x + "<br> y:" + cordinates.y);
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
  }, [imgRef.current])

  return (
    <>
      <span id="tooltip-span"></span>
      <div id="vLine" className="trackingline" ref={vLineRef}></div>
      <div id="hLine" className="trackingline" ref={hLineRef}></div>
    </>
  )
}

export default MouseCoordinator