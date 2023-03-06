import React from 'react';
import $ from '../../../node_modules/jquery/dist/jquery.min.js';

import './TopMenu.css';
import appear3 from "../../assets/appear3.png";
import appear4 from "../../assets/appear4.png";
import {useRecoilState} from "recoil";
import {topMenuIsOpenState} from "../../stateManagement/atoms/layout/topmenuAtom";



function TopMenu() {
  const [tmIsOpen, setTmIsOpen] = useRecoilState(topMenuIsOpenState)

  const toggleHandler = () => {
    if (!tmIsOpen) {
      $('#top-menu').css({
        'top': 0
      })
      setTmIsOpen(true)
    } else {
      $('#top-menu').css({
        'top': -300
      })
      setTmIsOpen(false)
    }
  }

  return (
    <div id="top-menu">
      <div className="tmbody">
        <h2>들어갈 내용</h2>
        <p>이전/이후 작업</p>
        <p>라벨 선택 라디오박스</p>
      </div>
      <div className="tmbottom">
        <div className="wrapper" onClick={toggleHandler}>
          <img src={tmIsOpen ? appear4 : appear3} alt=""/>
          <p>메뉴</p>
          <img src={tmIsOpen ? appear4 : appear3} alt=""/>
        </div>
      </div>
    </div>
  )
}

export default TopMenu;
  