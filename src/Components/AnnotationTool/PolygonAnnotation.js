import React, {useEffect, useState} from "react";
import {Line, Circle, Group} from "react-konva";
import {minMax, dragBoundFunc} from "../../utils/canvas";
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {
  imageInfoState,
  nukkiModeState,
} from "../../stateManagement/atoms/Nukki/nukkiAtom";
import maskingCursor from "../../assets/masking-cursor.png";
import {polygonObjListState, selectedIndexState} from "../../stateManagement/atoms/Nukki/polygonAtom";


/**
 *
 * @param {minMaxX} props
 * minMaxX[0]=>minX
 * minMaxX[1]=>maxX
 *
 */
const PolygonAnnotation = (props) => {
  const {
    plgObj,
    points,
    flattenedPoints,
    handlePointDragMove,
    handlePolygonClick,
    // handleMouseOverStartPoint,
    // handleMouseOutStartPoint,
  } = props;

  const vertexRadius = 4;

  const [stage, setStage] = useState();
  const [flatPoints, setFlatPoints] = useState([]);
  // const [minDist, setMinDist] = useState(0);

  const [plgObjList, setPlgObjList] = useRecoilState(polygonObjListState)
  const [selIndex, setSelIndex] = useRecoilState(selectedIndexState);
  const imageInfo = useRecoilValue(imageInfoState)
  const nukkiMode = useRecoilValue(nukkiModeState)



  // ========= console.log 영역 =========
  // console.log(plgObj && plgObj.key)
  // console.log("flattenedPoints : ", flattenedPoints)
  // console.log("points: ", points)
  // console.log(stage)
  // ===================================


  // console.log('end', flattenedPoints)
  // console.log(flatPoints)

  useEffect(() => {
    let flatList = []
    for (let a of points) {
      flatList.push(a.x, a.y)
    }
    setFlatPoints(flatList);
  }, [points])

  const handleGroupMouseOver = (e) => {
    setStage(e.target.getStage());
  }

  const handlePolygonMouseOver = (e) => {
    e.target.getStage().container().style.cursor = "pointer";
  };

  const handlePolygonMouseOut = (e) => {
    e.target.getStage().container().style.cursor = "default";
  };

  const handleCircleMouseOver = (e) => {
    e.target.scale({x: 2, y: 2});
    e.target.getStage().container().style.cursor = "grabbing"
  }

  const handleCircleMouseOut = (e) => {
    e.target.scale({x: 1, y: 1});
    e.target.getStage().container().style.cursor = "default"
  }

  const handleCircleClick = (e) => {
    setSelIndex(e.target.index - 1)
  }


  const [minMaxX, setMinMaxX] = useState([0, 0]); //min and max in x axis
  const [minMaxY, setMinMaxY] = useState([0, 0]); //min and max in y axis

  const handleGroupDragStart = (e) => {
    let arrX = points.map((p) => p.x);
    let arrY = points.map((p) => p.y);
    // console.log("arrX: ", arrX, "arrY: ", arrY)
    setMinMaxX(minMax(arrX));
    setMinMaxY(minMax(arrY));
  };

  const groupDragBound = (pos) => {
    // console.log("pos in groupDragBound: ", pos)
    let {x, y} = pos;
    const sw = stage.width();
    const sh = stage.height();
    if (minMaxY[0] + y < 0) y = -1 * minMaxY[0];
    if (minMaxX[0] + x < 0) x = -1 * minMaxX[0];
    if (minMaxY[1] + y > sh) y = sh - minMaxY[1];
    if (minMaxX[1] + x > sw) x = sw - minMaxX[1];
    return {x, y};
  };

  // console.log("flattenedPoints: ", flattenedPoints.length)
  return (
    <Group
      name="polygon"
      dragBoundFunc={groupDragBound}
      onMouseOver={handleGroupMouseOver}
    >
      <Line
        points={flatPoints.length > 0 ? flatPoints : flattenedPoints}
        stroke="#01F1FF"
        strokeWidth={2}
        closed={true}
        fill="rgb(140,30,255,0.5)"
        onClick={e => handlePolygonClick({e, key: plgObj ? plgObj.key : null})}
        onMouseOver={handlePolygonMouseOver}
        onMouseOut={handlePolygonMouseOut}
        hitStrokeWidth={4}
      />
      {points.map((point, index) => {
        const x = point.x // - vertexRadius / 2;
        const y = point.y // - vertexRadius / 2;

        // const startPointAttr =
        //   index === 0
        //     ? {
        //       hitStrokeWidth: 12,
        //       // onMouseOver: handleMouseOverStartPoint,
        //       // onMouseOut: handleMouseOutStartPoint,
        //     }
        //     : null;

        return (
          !nukkiMode && (plgObj && plgObj.selected) &&
          <Circle
            key={index}
            x={x}
            y={y}
            radius={vertexRadius}
            fill={index === selIndex ? "white" : "#FF019A"}
            stroke={index === selIndex ? "black" : "#00F1FF"}
            strokeWidth={2}
            draggable
            onDragMove={e => handlePointDragMove(e, plgObj.key)}
            onMouseOver={handleCircleMouseOver}
            onMouseOut={handleCircleMouseOut}
            onClick={handleCircleClick}
            dragBoundFunc={(pos) =>
              dragBoundFunc(stage.width(), stage.height(), vertexRadius, pos)
            }
          />
        );
      })}
    </Group>
  );
};

export default PolygonAnnotation;
