const flowersContainer = document.getElementById('flowers');
const sparklesContainer = document.getElementById('sparkles');

const tulipPositions = [
  [72, 168], [91, 199], [114, 226], [142, 250], [174, 265], [206, 265],
  [237, 250], [264, 226], [286, 199], [305, 168], [100, 164], [126, 189],
  [154, 205], [183, 212], [212, 205], [240, 189], [266, 164], [122, 273],
  [152, 289], [183, 304], [214, 289], [244, 273], [183, 336], [82, 236],
  [284, 236], [72, 205], [294, 205], [183, 238], [143, 235], [223, 235],
];

tulipPositions.forEach(([left, bottom], index) => {
  const tulip = document.createElement('div');
  tulip.className = 'tulip';
  tulip.style.left = `${left}px`;
  tulip.style.bottom = `${bottom}px`;
  tulip.style.animationDelay = `${1.6 + index * 0.08}s`;
  tulip.innerHTML = '<span class="stem"></span><span class="bud"><span class="petal"></span></span>';
  flowersContainer.appendChild(tulip);
});

for (let i = 0; i < 28; i += 1) {
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  sparkle.style.left = `${Math.random() * 95}%`;
  sparkle.style.top = `${Math.random() * 74 + 8}%`;
  sparkle.style.animationDelay = `${Math.random() * 3.2}s`;
  sparkle.style.animationDuration = `${2.8 + Math.random() * 2.2}s`;
  sparklesContainer.appendChild(sparkle);
}
