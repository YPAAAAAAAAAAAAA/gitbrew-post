(function (root) {
  var canvas = document.getElementById("stage");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  function size() {
    var w = Math.max(1, window.innerWidth || 390);
    var h = Math.max(1, window.innerHeight || 844);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }
  function frame(t) {
    size();
    var w = canvas.width;
    var h = canvas.height;
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, w, h);
    var r = Math.min(w, h) * 0.08;
    var cx = w * 0.5 + Math.sin(t / 400) * Math.min(w, h) * 0.06;
    var cy = h * 0.5;
    ctx.fillStyle = "#ee9501";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    root.__dotRaf = requestAnimationFrame(frame);
  }
  window.addEventListener("resize", size);
  size();
  frame(0);
})(window);
