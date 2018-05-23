'use strict';

(function() {
	var dbMsg ="index.js;"
	var socket = io();
	var canvas = document.getElementsByClassName('whiteboard')[0];
	var colors = document.getElementsByClassName('color');
	var eventComent = document.getElementById("eventComent");
	eventComent.innerHTML = "Drow OK";
	var $document = $(document);
	var $hitarea = $('#whiteboard');
var toucheX;
var toucheY;
//	var allclear = document.getElementById('allclear');

	var context = canvas.getContext('2d');

  var current = {
    color: 'black'
  };
  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

//タッチイベントとマウスイベント
//		http://yuitaku.hatenadiary.jp/entry/2017/09/16/132704

	var supportTouch = 'ontouchend' in document;  // タッチイベントが利用可能かの判別
	 dbMsg += "supportTouch="+supportTouch;
	// イベント名
	var EVENTNAME_TOUCHSTART = supportTouch ? 'touchstart' : 'mousedown';
	dbMsg += ",START="+EVENTNAME_TOUCHSTART;
	var EVENTNAME_TOUCHMOVE = supportTouch ? 'touchmove' : 'mousemove';
	dbMsg += ",MOVE="+EVENTNAME_TOUCHMOVE;
	var EVENTNAME_TOUCHEND = supportTouch ? 'touchend' : 'mouseup';
	dbMsg += ",END="+EVENTNAME_TOUCHEND;
	// 表示をアップデートする関数群
	var updateXY = function(event) {
		dbMsg += "updateXY;";
	  // jQueryのイベントはオリジナルのイベントをラップしたもの。
	  // changedTouchesが欲しいので、オリジナルのイベントオブジェクトを取得
	  var original = event.originalEvent;
	  var x, y;
	  if(original.changedTouches) {
	    x = original.changedTouches[0].pageX;
	    y = original.changedTouches[0].pageY;
	  // } else {
	  //   x = event.pageX;
	  //   y = event.pageY;
	  }
		dbMsg += "("+x+" , "+y+")";
		current.x =x;
		current.y = y;
		// console.log(dbMsg);
			eventComent.innerHTML = dbMsg;
	};
	var updateEventname = function(eventname) {
		dbMsg += "updateEventname;"+eventname;
		eventComent.innerHTML = dbMsg;
	};

	// イベント設定
	var handleStart = function(event) {
	  updateEventname(EVENTNAME_TOUCHSTART);
	  updateXY(event);
	  bindMoveAndEnd();
		dbMsg += "handleStart;";
		eventComent.innerHTML = dbMsg;
	};

	var handleMove = function(event) {
	  event.preventDefault(); // タッチによる画面スクロールを止める
	  updateEventname(EVENTNAME_TOUCHMOVE);
	  updateXY(event);
		dbMsg += "handleMove;";
		eventComent.innerHTML = dbMsg;
	};

	var handleEnd = function(event) {
	  updateEventname(EVENTNAME_TOUCHEND);
	  updateXY(event);
	  unbindMoveAndEnd();
		dbMsg += "handleEnd;";
		eventComent.innerHTML = dbMsg;
	};

	var bindMoveAndEnd = function() {
	  $document.on(EVENTNAME_TOUCHMOVE, handleMove);
	  $document.on(EVENTNAME_TOUCHEND, handleEnd);
		dbMsg += "bindMoveAndEnd;";
		eventComent.innerHTML = dbMsg;
	};

	var unbindMoveAndEnd = function() {
	  $document.off(EVENTNAME_TOUCHMOVE, handleMove);
	  $document.off(EVENTNAME_TOUCHEND, handleEnd);
		dbMsg += "unbindMoveAndEnd;";
		eventComent.innerHTML = dbMsg;
	};

	$hitarea.on(EVENTNAME_TOUCHSTART, handleStart);
	supportTouch = 'ontouchend' in document;
	dbMsg += ">>"+supportTouch;
//	canvas.on(EVENTNAME_TOUCHSTART, handleStart);	//	https://app.codegrid.net/entry/touch-mouse#toc-2
canvas.addEventListener(EVENTNAME_TOUCHSTART, onMouseDown, false);
canvas.addEventListener(EVENTNAME_TOUCHEND, onMouseUp, false);
// canvas.addEventListener('touchcancel', onMouseUp, false);
canvas.addEventListener(EVENTNAME_TOUCHMOVE, throttle(onMouseMove, 10), false);
  // canvas.addEventListener('touchstart', onMouseDown, false);
  // canvas.addEventListener('touchend', onMouseUp, false);
  // canvas.addEventListener('touchcancel', onMouseUp, false);
  // canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

	// canvas.addEventListener('touchstart', handleStart, false);
	// canvas.addEventListener('touchend', handleEnd, false);
	// // canvas.addEventListener('touchcancel', touchcancel, false);
	// canvas.addEventListener('touchmove', throttle(handleMove, 10), false);

/////////////////////////////////////////////////////////////////////////////
  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  socket.on('drawing', onDrawingEvent);						//org;描画
  socket.on('allclear', function (data) {
		dbMsg +="recive:all clear";
		console.log(dbMsg);
		eventComent.innerHTML = dbMsg;
		allClear();
	});

  window.addEventListener('resize', onResize, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, emit){
			dbMsg ="drawLine("+x0 +" , " + y0+")";
			dbMsg +="～("+x1 +" , " + y1+")";
			dbMsg +="color="+color;
		eventComent.innerHTML = dbMsg;
		context.beginPath();
    context.moveTo(x0, y0);									//サブパスの開始点
    context.lineTo(x1, y1);									//直前の座標と指定座標を結ぶ直線を引く
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });

  }

	function onMouseDown(e){
		drawing = true;
		current.x = e.clientX;
		current.y = e.clientY;
		dbMsg ="onMouseDown("+current.x +" , " + current.y+")";
		var original = e.originalEvent;
 	 	if(original != null){
 			 // dbMsg +=",original="+original.changedTouches;
 			if(original.changedTouches) {
 				current.x = original.changedTouches[0].pageX;
 				current.y = original.changedTouches[0].pageY;
				// toucheX = original.changedTouches[0].pageX;
				// toucheY= original.changedTouches[0].pageY;
		}
			dbMsg +=">>("+current.x +" , " + current.y +")";
		}
		eventComent.innerHTML = dbMsg;
	}

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
		var currentX = current.x;
		var currentY = current.y;
		dbMsg ="onMouseUp("+currentX +" , " + currentY+")";
		current.x = e.clientX;
		current.y = e.clientY;
		var original = e.originalEvent;
 	 	if(original != null){
			// dbMsg +=",original="+original.changedTouches;
			 if(original.changedTouches) {
				 current.x = original.changedTouches[0].pageX;
				 current.y = original.changedTouches[0].pageY;
				 // toucheX = original.changedTouches[0].pageX;
				 // toucheY= original.changedTouches[0].pageY;
			 }
		}
		dbMsg +=">>("+current.x +" , " + current.y +")";
		drawLine(currentX, currentY, current.x, current.y, current.color, true);
		// drawLine(currentX, currentY, e.clientX, e.clientY, current.color, true);
	 	eventComent.innerHTML = dbMsg;
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
		dbMsg ="onMouseMove("+current.x +" , " + current.y +")";
	   var original = e.originalEvent;
	 	 if(original != null){
			// dbMsg +=",original="+original.changedTouches;
			if(original.changedTouches) {
				current.x = original.changedTouches[0].pageX;
				current.y = original.changedTouches[0].pageY;
				 // toucheX = original.changedTouches[0].pageX;
				 // toucheY= original.changedTouches[0].pageY;
			}
		}
		dbMsg +=">>("+current.x +" , " + current.y +")";
		// drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
		eventComent.innerHTML = dbMsg;
  }

  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
		dbMsg ="onColorUpdate;"+current.color;
		eventComent.innerHTML = dbMsg;
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
		dbMsg ="onDrawingEvent("+data.x0 +" , " + data.y0+")";
		dbMsg +="～("+data.x1 +" , " + data.y1+")";
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
		dbMsg +=",touche("+toucheX +" , " + toucheY+")";
		eventComent.innerHTML = dbMsg;
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

	function allClear() {
		context.clearRect(0, 0,canvas.width,canvas.height);
		dbMsg ="allClear";
		eventComent.innerHTML = dbMsg;
	}


	document.getElementById("allclear").onclick = function() {
		allClear();
		socket.emit('allclear',{});
	};
	console.log(dbMsg);
	eventComent.innerHTML = dbMsg;

})();
