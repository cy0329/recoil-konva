import {Rect} from "react-konva";

function TestRect({x, y}) {
  return (
    <Rect x={x} y={y} width={50} height={50} fill={'red'}/>
  )
}

export default TestRect