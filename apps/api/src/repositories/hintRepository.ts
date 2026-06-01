export type HintType = "ra_light" | "thoth_hand";

export const HINT_LIMITS: Record<HintType, number> = {
  ra_light: 5,
  thoth_hand: 3,
};

export interface HintRepository {
  getUsage(
    userId: string,
    puzzleId: string,
    hintType: HintType,
  ): Promise<number>;
  incrementUsage(
    userId: string,
    puzzleId: string,
    hintType: HintType,
  ): Promise<void>;
}

function makeKey(userId: string, puzzleId: string, hintType: HintType): string {
  return `${userId}:${puzzleId}:${hintType}`;
}

export class InMemoryHintRepository implements HintRepository {
  private readonly store = new Map<string, number>();

  async getUsage(
    userId: string,
    puzzleId: string,
    hintType: HintType,
  ): Promise<number> {
    return this.store.get(makeKey(userId, puzzleId, hintType)) ?? 0;
  }

  async incrementUsage(
    userId: string,
    puzzleId: string,
    hintType: HintType,
  ): Promise<void> {
    const key = makeKey(userId, puzzleId, hintType);
    this.store.set(key, (this.store.get(key) ?? 0) + 1);
  }
}

export const hintRepository: HintRepository = new InMemoryHintRepository();
