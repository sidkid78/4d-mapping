export interface Coordinates4D {
  x: number;
  y: number;
  z: number;
  e: number;
}

export interface SpaceMapper {
  mapToCoordinates(data: unknown): Promise<Coordinates4D>;
  findNearest(coordinates: Coordinates4D): Promise<unknown[]>;
  updateMapping(data: unknown): Promise<void>;
} 