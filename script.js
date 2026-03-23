const flowersContainer = document.getElementById('flowers');
const branchesContainer = document.getElementById('branches');
const sparklesContainer = document.getElementById('sparkles');
const notesContainer = document.getElementById('notes');

const LOVE_NOTES = [];

const BRANCHES = [
  { left: 178, bottom: 138, rotate: -34, length: 172, delay: 0.6 },
  { left: 178, bottom: 138, rotate: 34, length: 172, delay: 0.72 },
  { left: 160, bottom: 168, rotate: -50, length: 136, delay: 0.84 },
  { left: 196, bottom: 168, rotate: 50, length: 136, delay: 0.94 },
  { left: 166, bottom: 178, rotate: -20, length: 124, delay: 1.04 },
  { left: 190, bottom: 178, rotate: 20, length: 124, delay: 1.12 },
  { left: 182, bottom: 204, rotate: 0, length: 124, delay: 1.2 },
  { left: 146, bottom: 206, rotate: -62, length: 96, delay: 1.3 },
  { left: 214, bottom: 206, rotate: 62, length: 96, delay: 1.38 },
  { left: 157, bottom: 218, rotate: -74, length: 82, delay: 1.46 },
  { left: 203, bottom: 218, rotate: 74, length: 82, delay: 1.54 },
  { left: 172, bottom: 222, rotate: -10, length: 78, delay: 1.6 },
  { left: 188, bottom: 222, rotate: 10, length: 78, delay: 1.66 },
];

function createBranches() {
  if (!branchesContainer) return;
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

function tulipPositionsByHeart(total = 56) {
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
  if (!flowersContainer) return;
  const tulipPositions = tulipPositionsByHeart();

  tulipPositions.forEach(([left, bottom], index) => {
    const tulip = document.createElement('div');
    tulip.className = 'tulip';
    tulip.style.left = `${left}px`;
    tulip.style.bottom = `${bottom}px`;
    tulip.style.animationDelay = `${1.75 + index * 0.05}s`;
    tulip.innerHTML = '<span class="stem"></span><span class="bud"><span class="petal"></span></span>';
    flowersContainer.appendChild(tulip);
  });
}

function createSparkles() {
  if (!sparklesContainer) return;
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

function createLoveNotes() {
  if (!notesContainer) return;

  LOVE_NOTES.forEach((text, index) => {
    const note = document.createElement('p');
    note.className = 'love-note-item';
    note.style.animationDelay = `${0.2 + index * 0.2}s`;
    note.textContent = text;
    notesContainer.appendChild(note);
  });
}

function createScene() {
  if (branchesContainer) branchesContainer.innerHTML = '';
  if (flowersContainer) flowersContainer.innerHTML = '';
  if (sparklesContainer) sparklesContainer.innerHTML = '';
  if (notesContainer) notesContainer.innerHTML = '';
  createBranches();
  createTulips();
  createSparkles();
  createLoveNotes();
}

window.addEventListener('load', () => {
  requestAnimationFrame(createScene);
});
