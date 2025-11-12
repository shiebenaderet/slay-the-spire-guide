import { SeededRandom } from './seededRandom';

export type NodeType = 'M' | 'E' | '?' | '$' | 'R' | 'T' | 'BOSS';

export interface MapNode {
  x: number; // Column (0-6)
  y: number; // Floor (0-15, where 0 is floor 1)
  type: NodeType;
  parents: number[]; // Indices of nodes that connect to this one
  children: number[]; // Indices of nodes this connects to
}

export interface ActMap {
  act: number;
  nodes: MapNode[];
  paths: Array<[number, number]>; // Pairs of node indices representing connections
}

/**
 * Generate a Slay the Spire map from a seed
 * Based on the reverse-engineered algorithm
 */
export function generateMap(seed: string | number, act: number, ascensionLevel: number): ActMap {
  const rng = new SeededRandom(seed);
  const nodes: MapNode[] = [];

  // Generate 7 columns x 15 floors
  const COLS = 7;
  const FLOORS = 15;

  // Step 1: Generate node positions and types
  for (let floor = 0; floor < FLOORS; floor++) {
    for (let col = 0; col < COLS; col++) {
      const nodeType = determineNodeType(floor, col, rng, ascensionLevel);
      if (nodeType) {
        nodes.push({
          x: col,
          y: floor,
          type: nodeType,
          parents: [],
          children: []
        });
      }
    }
  }

  // Step 2: Generate paths
  const paths = generatePaths(nodes, rng);

  // Step 3: Connect parent-child relationships
  for (const [fromIdx, toIdx] of paths) {
    nodes[fromIdx].children.push(toIdx);
    nodes[toIdx].parents.push(fromIdx);
  }

  return {
    act,
    nodes,
    paths
  };
}

/**
 * Determine what type of node should be at a given position
 */
function determineNodeType(
  floor: number,
  col: number,
  rng: SeededRandom,
  ascensionLevel: number
): NodeType | null {
  // Floor 1 (y=0): Always Monster
  if (floor === 0) {
    return 'M';
  }

  // Floor 9 (y=8): Always Treasure
  if (floor === 8) {
    return 'T';
  }

  // Floor 15 (y=14): Always Rest Site
  if (floor === 14) {
    return 'R';
  }

  // Floor 16 (y=15) would be Boss, but we handle that separately
  if (floor === 15) {
    return 'BOSS';
  }

  // For other floors, use probability
  // Ascension 20 probabilities: M(53%), E(8%), ?(20%), $(12%), R(7%)
  const roll = rng.nextFloat();

  // Elites and Rest Sites can't be below floor 6
  const canHaveElite = floor >= 5;
  const canHaveRest = floor >= 5;

  // Rest Site cannot be on floor 14 (but we already handled floor 14 above)

  let monsterChance = 0.53;
  let eliteChance = 0.08;
  let eventChance = 0.20;
  let shopChance = 0.12;
  let restChance = 0.07;

  // Adjust for ascension (simplified - actual game has more complex logic)
  if (ascensionLevel < 20) {
    monsterChance = 0.55;
    eliteChance = 0.07;
    eventChance = 0.22;
    shopChance = 0.10;
    restChance = 0.06;
  }

  // Redistribute chances if elite/rest not allowed
  if (!canHaveElite) {
    const eliteShare = eliteChance / 4;
    monsterChance += eliteShare * 2;
    eventChance += eliteShare;
    shopChance += eliteShare;
    eliteChance = 0;
  }

  if (!canHaveRest) {
    const restShare = restChance / 3;
    monsterChance += restShare;
    eventChance += restShare;
    shopChance += restShare;
    restChance = 0;
  }

  // Roll for node type
  let cumulative = 0;

  cumulative += monsterChance;
  if (roll < cumulative) return 'M';

  cumulative += eliteChance;
  if (roll < cumulative) return 'E';

  cumulative += eventChance;
  if (roll < cumulative) return '?';

  cumulative += shopChance;
  if (roll < cumulative) return '$';

  return 'R';
}

/**
 * Generate paths between nodes
 * Simplified version - the actual algorithm is more complex
 */
function generatePaths(nodes: MapNode[], rng: SeededRandom): Array<[number, number]> {
  const paths: Array<[number, number]> = [];
  const nodesByFloor = new Map<number, number[]>();

  // Group nodes by floor
  nodes.forEach((node, idx) => {
    if (!nodesByFloor.has(node.y)) {
      nodesByFloor.set(node.y, []);
    }
    nodesByFloor.get(node.y)!.push(idx);
  });

  // Connect each floor to the next
  for (let floor = 0; floor < 15; floor++) {
    const currentFloor = nodesByFloor.get(floor) || [];
    const nextFloor = nodesByFloor.get(floor + 1) || [];

    if (currentFloor.length === 0 || nextFloor.length === 0) continue;

    // Each node on current floor connects to 1-3 nodes on next floor
    for (const fromIdx of currentFloor) {
      const fromNode = nodes[fromIdx];

      // Find closest nodes on next floor
      const distances = nextFloor.map(toIdx => ({
        idx: toIdx,
        dist: Math.abs(nodes[toIdx].x - fromNode.x)
      }));

      distances.sort((a, b) => a.dist - b.dist);

      // Connect to 1-3 closest nodes (randomized)
      const numConnections = rng.nextInt(2) + 1; // 1 or 2 connections
      const connectTo = distances.slice(0, Math.min(numConnections + 1, distances.length));

      for (const { idx: toIdx } of connectTo) {
        paths.push([fromIdx, toIdx]);
      }
    }
  }

  // Remove duplicate paths
  const uniquePaths = Array.from(
    new Set(paths.map(p => `${p[0]}-${p[1]}`))
  ).map(p => p.split('-').map(Number) as [number, number]);

  return uniquePaths;
}

/**
 * Get the monster encounter for a specific node
 * Based on actual Slay the Spire encounter tables
 */
export function getEncounterForNode(
  seed: string | number,
  act: number,
  floor: number,
  ascensionLevel: number
): string[] {
  const rng = new SeededRandom(`${seed}-${act}-${floor}`);

  // Act 1 encounters - comprehensive list
  const act1Encounters = [
    ['Cultist'],
    ['Jaw Worm'],
    ['2x Louse'],
    ['Small Slimes'],
    ['Blue Slaver'],
    ['Looter'],
    ['Cultist', 'Jaw Worm'],
    ['2x Fungi Beast'],
    ['Exordium Thugs'], // 2x Looter or Cultist + Looter
    ['Exordium Wildlife'], // 2x Fungi Beast or Fungi Beast + Jaw Worm
    ['Red Slaver'],
    ['3x Louse'],
    ['2x Cultist'],
    ['Lots of Slimes'], // Multiple slimes
    ['Blue Slaver', 'Jaw Worm'],
    ['Red Slaver', 'Cultist'],
    ['3x Cultist'],
    ['Slime Gang'] // Acid Slime M + Spike Slime M + 2x Slime S
  ];

  // Act 2 encounters - comprehensive list
  const act2Encounters = [
    ['Spheric Guardian'],
    ['Chosen'],
    ['Shell Parasite'],
    ['3x Byrds'],
    ['Chosen', 'Byrd'],
    ['Sentry', 'Spheric Guardian'],
    ['Chosen', 'Cultist'],
    ['3x Cultist'],
    ['Looter', 'Mugger'],
    ['2x Thieves'],
    ['Centurion', 'Mystic'],
    ['Snake Plant'],
    ['Snecko'],
    ['Fungi Beast', 'Cultist'],
    ['2x Spheric Guardian'],
    ['Centurion', 'Healer'],
    ['Cultist', 'Chosen'],
    ['3x Byrds'],
    ['Spheric Guardian', 'Chosen'],
    ['Shelled Parasite', 'Fungi Beast']
  ];

  // Act 3 encounters - comprehensive list
  const act3Encounters = [
    ['Spheric Guardian', '2x Shapes'],
    ['Jaw Worm Horde'], // 3-4 Jaw Worms
    ['3x Darklings'],
    ['Orb Walker'],
    ['3x Shapes'],
    ['Spire Growth'],
    ['Transient'],
    ['4x Shapes'],
    ['Maw', '2x Jaw Worms'],
    ['Sphere Guardian', 'Shape', 'Exploder'],
    ['Writhing Mass'],
    ['Giant Head'],
    ['Nemesis'],
    ['Repulsor'],
    ['2x Orb Walker'],
    ['Spire Growth', 'Exploder'],
    ['Jaw Worm Horde'], // 4x Jaw Worms
    ['Darklings', 'Orb Walker'],
    ['Reptomancer'],
    ['3x Exploder']
  ];

  const encounters = act === 1 ? act1Encounters :
                    act === 2 ? act2Encounters :
                    act3Encounters;

  return rng.choice(encounters);
}
