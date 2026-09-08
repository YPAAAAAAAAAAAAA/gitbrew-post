(function (root) {
  var canvas = document.getElementById("stage");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  canvas.width = 64;
  canvas.height = 64;
  function frame(t) {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ee9501";
    ctx.beginPath();
    ctx.arc(32 + Math.sin(t / 400) * 8, 32, 10, 0, Math.PI * 2);
    ctx.fill();
    root.__dotRaf = requestAnimationFrame(frame);
  }
  frame(0);
})(window);
