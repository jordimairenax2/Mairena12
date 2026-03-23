const flowersContainer = document.getElementById('flowers');
const branchesContainer = document.getElementById('branches');
const sparklesContainer = document.getElementById('sparkles');

const BRANCHES = [
  { left: 178, bottom: 140, rotate: -32, length: 168, delay: 0.55 },
  { left: 178, bottom: 140, rotate: 32, length: 168, delay: 0.7 },
  { left: 160, bottom: 172, rotate: -48, length: 132, delay: 0.85 },
  { left: 196, bottom: 172, rotate: 48, length: 132, delay: 0.95 },
  { left: 165, bottom: 178, rotate: -13, length: 120, delay: 1.05 },
  { left: 191, bottom: 178, rotate: 13, length: 120, delay: 1.15 },
  { left: 182, bottom: 205, rotate: 0, length: 120, delay: 1.25 },
  { left: 145, bottom: 210, rotate: -61, length: 92, delay: 1.35 },
  { left: 215, bottom: 210, rotate: 61, length: 92, delay: 1.45 },
];

function createBranches() {
  BRANCHES.forEach((branchData) => {
    const branch = document.createElement('div');
    branch.className = 'branch';
    branch.style.left = `${branchData.left}px`;
    branch.style.bottom = `${branchData.bottom}px`;
    branch.style.height = `${branchData.length}px`;
    branch.style.setProperty('--branch-rotation', `${branchData.rotate}deg`);
    branch.style.animationDelay = `${branchData.delay}s`;
    branchesContainer.appendChild(branch);
  });
}

function tulipPositionsByHeart(total = 44) {
  const points = [];

  for (let i = 0; i < total; i += 1) {
    const t = (Math.PI * 2 * i) / total;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    const normalizedX = 180 + x * 8.1;
    const normalizedY = 205 + y * 8.2;
    points.push([normalizedX, normalizedY]);
  }

  points.push([180, 178], [166, 193], [194, 193], [180, 222], [146, 210], [214, 210]);
  return points;
}

function createTulips() {
  const tulipPositions = tulipPositionsByHeart();

  tulipPositions.forEach(([left, bottom], index) => {
    const tulip = document.createElement('div');
    tulip.className = 'tulip';
    tulip.style.left = `${left}px`;
    tulip.style.bottom = `${bottom}px`;
    tulip.style.animationDelay = `${1.45 + index * 0.055}s`;
    tulip.innerHTML = '<span class="stem"></span><span class="bud"><span class="petal"></span></span>';
    flowersContainer.appendChild(tulip);
  });
}

function createSparkles() {
  for (let i = 0; i < 34; i += 1) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${Math.random() * 95}%`;
    sparkle.style.top = `${Math.random() * 74 + 8}%`;
    sparkle.style.animationDelay = `${Math.random() * 3.2}s`;
    sparkle.style.animationDuration = `${2.8 + Math.random() * 2.2}s`;
    sparklesContainer.appendChild(sparkle);
  }
}

createBranches();
createTulips();
createSparkles();
