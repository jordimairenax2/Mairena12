const flowersContainer = document.getElementById('flowers');
const sparklesContainer = document.getElementById('sparkles');

const flowerPositions = [
  [72, 168], [96, 205], [122, 235], [152, 255], [184, 266],
  [214, 255], [243, 235], [268, 205], [292, 170], [104, 166],
  [134, 192], [165, 206], [197, 206], [228, 192], [258, 166],
  [164, 292], [194, 290], [136, 276], [222, 276], [177, 320],
  [86, 236], [278, 236], [72, 198], [292, 198], [177, 236],
];

flowerPositions.forEach(([left, bottom], index) => {
  const flower = document.createElement('div');
  flower.className = 'flower';
  flower.style.left = `${left}px`;
  flower.style.bottom = `${bottom}px`;
  flower.style.animationDelay = `${(index % 6) * 0.25}s`;
  flowersContainer.appendChild(flower);
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
