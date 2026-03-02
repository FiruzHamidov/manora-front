export type BranchPoint = {
  id: number;
  name: string;
  address: string;
  coords: [number, number];
  isNew?: boolean;
};

export const BRANCHES: BranchPoint[] = [
  {
    id: 1,
    name: 'Первый филиал',
    address: 'Душанбе, ул. Айни 9',
    coords: [38.563279, 68.791256],
  },
  {
    id: 2,
    name: 'Новый филиал',
    address: 'Душанбе, ул. Казакон, 208',
    coords: [38.583443, 68.73332],
    isNew: true,
  },
];

export const BRANCHES_CENTER: [number, number] = [
  (BRANCHES[0].coords[0] + BRANCHES[1].coords[0]) / 2,
  (BRANCHES[0].coords[1] + BRANCHES[1].coords[1]) / 2,
];

