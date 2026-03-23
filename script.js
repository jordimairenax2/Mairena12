const tree = document.getElementById('tree');

function makeBranch({ left, bottom, height, angle }) {
  const branch = document.createElement('div');
  branch.className = 'branch';
  branch.style.left = `${left}px`;
  branch.style.bottom = `${bottom}px`;
  branch.style.height = `${height}px`;
  branch.style.transform = `rotate(${angle}deg)`;
  tree.appendChild(branch);
}

function makeFlower({ left, bottom, delay }) {
  const flower = document.createElement('div');
  flower.className = 'flower';
  flower.style.left = `${left}px`;
  flower.style.bottom = `${bottom}px`;
  flower.style.animationDelay = `${delay}s`;
  tree.appendChild(flower);
}

function buildTree() {
  const trunk = document.createElement('div');
  trunk.className = 'trunk';
  tree.appendChild(trunk);

  const branches = [
    { left: 150, bottom: 110, height: 80, angle: -48 },
    { left: 178, bottom: 120, height: 90, angle: 40 },
    { left: 155, bottom: 160, height: 70, angle: -20 },
    { left: 175, bottom: 165, height: 70, angle: 22 },
    { left: 165, bottom: 210, height: 56, angle: -2 },
  ];

  branches.forEach(makeBranch);

  const flowers = [
    [92, 208], [115, 254], [140, 286], [175, 296], [205, 278],
    [234, 246], [255, 204], [76, 178], [105, 148], [240, 152],
    [196, 226], [152, 238], [168, 256], [122, 220], [218, 214],
    [150, 190], [183, 182], [132, 174], [210, 172], [165, 146],
  ];

  flowers.forEach(([left, bottom], index) => {
    makeFlower({ left, bottom, delay: (index % 5) * 0.4 });
  });
}

buildTree();
