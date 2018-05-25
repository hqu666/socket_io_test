'use strict';

(function() {
  var dbMsg = "index.js;"
  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];				//描画領域
  var colors = document.getElementsByClassName('color');						//カラーパレット
  var eventComent = document.getElementById("eventComent");
  eventComent.innerHTML = "Drow OK";
  var $document = $(document);
  var $hitarea = $('#whiteboard');
  var context = canvas.getContext('2d');
  var current = {
    color: 'black'
  };
  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
  /////////////////////////////////////////////////////////////////////////////
  // カラーパレットからの移し替え
  for (var i = 0; i < colors.length; i++) {
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  // socket.on('drawing', onDrawingEvent); //org;描画
    socket.on('drawing', function(data) {
        dbMsg += "recive:drawing";
        onDrawingEvent(data);
        console.log(dbMsg);
        eventComent.innerHTML = dbMsg;
    });

  socket.on('allclear', function(data) {
    dbMsg += "recive:all clear";
    console.log(dbMsg);
    eventComent.innerHTML = dbMsg;
    allClear();
  });

  window.addEventListener('resize', onResize, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, emit) {
    dbMsg = "drawLine(" + x0 + " , " + y0 + ")";
    dbMsg += "～(" + x1 + " , " + y1 + ")";
    dbMsg += "color=" + color;
    eventComent.innerHTML = dbMsg;
    context.beginPath();
    context.moveTo(x0, y0); //サブパスの開始点
    context.lineTo(x1, y1); //直前の座標と指定座標を結ぶ直線を引く
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) {
      return;
    }
    var w = canvas.width;
    var h = canvas.height;

// 5/25；アクションコードと色のint値が必要
    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });

  }

  function onMouseDown(e) {
    drawing = true;
    current.x = e.clientX;
    current.y = e.clientY;
    dbMsg = "onMouseDown(" + current.x + " , " + current.y + ")";
    eventComent.innerHTML = dbMsg;
  }

  function onMouseUp(e) {
    if (!drawing) {
      return;
    }
    drawing = false;
    var currentX = current.x;
    var currentY = current.y;
    dbMsg = "onMouseUp(" + currentX + " , " + currentY + ")";
    current.x = e.clientX;
    current.y = e.clientY;
    drawLine(currentX, currentY, current.x, current.y, current.color, true);
    eventComent.innerHTML = dbMsg;
  }

  function onMouseMove(e) {
    if (!drawing) {
      return;
    }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
    dbMsg = "onMouseMove(" + current.x + " , " + current.y + ")";
    eventComent.innerHTML = dbMsg;
  }

  //スマホタッチ対応；	http://tokidoki-web.com/2015/08/html5%E3%81%A8javascript%E3%81%A7%EF%BD%90%EF%BD%83%E3%83%BB%E3%82%B9%E3%83%9E%E3%83%9B%E3%81%AE%E3%83%9E%E3%83%AB%E3%83%81%E3%82%BF%E3%83%83%E3%83%81%E5%AF%BE%E5%BF%9C%E3%81%97%E3%81%A6%E3%82%84///////
  canvas.ontouchstart = function(event) { //画面に指が触れた
    drawing = true;
    dbMsg = "ontouchstart";
    var toucheX = event.touches[0].pageX; //タッチしている湯便の本数文、イベントは発生する
    var toucheY = event.touches[0].pageY;
    dbMsg += "(" + toucheX + " , " + toucheY + ")";
    current.x = toucheX;
    current.y = toucheY;
    eventComent.innerHTML = dbMsg;
  };

  canvas.ontouchmove = function(event) { //画面に指を触れたまま動かした
    dbMsg = "ontouchmove;drawing=" + drawing;
    if (drawing) {
      event.preventDefault(); // 画面のスクロールを防止する
      var toucheX = event.touches[0].pageX;
      var toucheY = event.touches[0].pageY;
      dbMsg += "(" + toucheX + " , " + toucheY + ")";
      drawLine(current.x, current.y, toucheX, toucheY, current.color, true);
      current.x = toucheX;
      current.y = toucheY;
    }
    eventComent.innerHTML = dbMsg;
  };

  canvas.ontouchend = function(event) { //画面から指を離した
    dbMsg = "ontouchend;drawing=" + drawing;
    if (drawing) {
      drawing = false;
      var currentX = current.x;
      var currentY = current.y;
      dbMsg += "(" + currentX + " , " + currentY + ")";
      var toucheX = event.touches[0].pageX;
      var toucheY = event.touches[0].pageY;
      dbMsg += "～(" + toucheX + " , " + toucheY + ")";
      current.x = toucheX;
      current.y = toucheY;
      drawLine(currentX, currentY, current.x, current.y, current.color, true);
    }
    eventComent.innerHTML = dbMsg;
  };


  function onColorUpdate(e) {
    current.color = e.target.className.split(' ')[1];
    dbMsg = "onColorUpdate;" + current.color;
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

  function onDrawingEvent(data) {
    var w = canvas.width;
    var h = canvas.height;
    dbMsg = "onDrawingEvent(" + data.x0 + " , " + data.y0 + ")";
    dbMsg += "～(" + data.x1 + " , " + data.y1 + ")";
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    eventComent.innerHTML = dbMsg;
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function allClear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    dbMsg = "allClear";
    eventComent.innerHTML = dbMsg;
  }


  document.getElementById("allclear").onclick = function() {
    allClear();
    socket.emit('allclear', {});
  };
  console.log(dbMsg);
  eventComent.innerHTML = dbMsg;

})();
