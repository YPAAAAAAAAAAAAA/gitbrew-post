(function (root) {
  var canvas = document.getElementById("stage");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  function size() {
    var n = Math.max(32, Math.floor(Math.min(canvas.clientWidth || 128, canvas.clientHeight || 128)));
    canvas.width = n;
    canvas.height = n;
  }
  function frame(t) {
    var n = canvas.width;
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, n, n);
    ctx.strokeStyle = "#ee9501";
    ctx.lineWidth = 4;
    var o = 12 + Math.sin(t / 500) * 6;
    ctx.strokeRect(o, o, n - o * 2, n - o * 2);
    root.__tileRaf = requestAnimationFrame(frame);
  }
  size();
  window.addEventListener("resize", size);
  frame(0);
})(window);
