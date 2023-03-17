import $ from '../../node_modules/jquery/dist/jquery.min.js';

export const dragBoundFunc = (stageWidth, stageHeight, stagePosX, stagePosY, scaleRatio, vertexRadius, pos) => {
  // console.log("params: ", stageWidth, stageHeight, stagePosX, stagePosY, scaleRatio, vertexRadius, pos)
  let x = pos.x;
  let y = pos.y;
  if (pos.x + vertexRadius > stageWidth * scaleRatio + stagePosX) x = stageWidth * scaleRatio + stagePosX;
  if (pos.x - vertexRadius < stagePosX) x = stagePosX;
  if (pos.y + vertexRadius > stageHeight * scaleRatio + stagePosY) y = stageHeight * scaleRatio + stagePosY;
  if (pos.y - vertexRadius < stagePosY) y = stagePosY;

  // console.log("return: ", {x, y})
  return {x, y};
};


export const minMax = (points) => {
  return points.reduce((acc, val) => {
    acc[0] = acc[0] === undefined || val < acc[0] ? val : acc[0];
    acc[1] = acc[1] === undefined || val > acc[1] ? val : acc[1];

    return acc;
  }, []);
};


/**
 * 마우스 코디네이터 모듈화 작업은 나중에 하는걸로..
 */

//
export default function mouseCoordination({image, nukkiMode, stageX, stageY,scaleRatio,}) {
  $("#tooltip-span").show();
  $("#vLine").show();
  $("#hLine").show()

  let stgPntPos = image.getStage().getPointerPosition()
  let coordinates = {x: Math.round((stgPntPos.x - stageX) / scaleRatio), y: Math.round((stgPntPos.y - stageY) / scaleRatio)}
  // console.log(image)
  let childImage = image.children[0].attrs.image
  let imageSize = {w: childImage.width, h: childImage.height}
  // console.log("===================")
  // console.log("imageSize: ", imageSize)
  // console.log("stageX: ", stageX)
  // console.log("stageY: ", stageY)
  // console.log("stgPntPos: ", stgPntPos)
  // console.log("coordinates: ", coordinates)
  // console.log("$(\"#tooltip-span\").width() : ", $("#tooltip-span").width())

  $("#tooltip-span").html("x : " + coordinates.x + "<br>y : " + coordinates.y + "<br>" + (nukkiMode ? "마스킹 모드" : "컨트롤 모드") + "<br> zoom : " + scaleRatio);
  let tooltipSpanLeft = ((stgPntPos.x + 35 + $("#tooltip-span").width() > imageSize.w) || (coordinates.x + (35 + $("#tooltip-span").width()) / scaleRatio > imageSize.w) ? stgPntPos.x - $("#tooltip-span").width() - 25 : stgPntPos.x + 25)
  let tooltipSpanTop = ((stgPntPos.y + 25 + $("#tooltip-span").height() > imageSize.h) || (coordinates.y + (25 + $("#tooltip-span").height()) / scaleRatio > imageSize.h) ? stgPntPos.y - $("#tooltip-span").height() - 20 : stgPntPos.y + 20)
  $("#tooltip-span").css({
    "left": tooltipSpanLeft,
    "top": tooltipSpanTop,
    "white-space": "nowrap"
  });


  $("#vLine").css({
    left: stgPntPos.x,
    top: stageY >= 0 ? stageY : 0,
    height: stageY > 0 ? imageSize.h - stageY : imageSize.h
  });
  $("#hLine").css({
    left: stageX >= 0 ? stageX : 0,
    top: stgPntPos.y,
    width: stageX > 0 ? imageSize.w - stageX : imageSize.w
  })
}





export const getPolygonCenterPoint = (points) => {
  let totalX = 0;
  let totalY = 0;
  for (let i = 0; i < points.length; i += 2) {
    totalX += points[i];
    totalY += points[i + 1];
  }

  return {
    x: totalX / (points.length / 2),
    y: totalY / (points.length / 2),
  };
};


export const getDistance = (node1, node2) => {
  let diffX = Math.abs(node1[0] - node2[0]);
  let diffY = Math.abs(node1[1] - node2[1]);
  const distaneInPixel = Math.sqrt(diffX * diffX + diffY * diffY);

  return Number.parseFloat(distaneInPixel).toFixed(2);
};
