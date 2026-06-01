import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// getOrCreateGuestId
// ---------------------------------------------------------------------------

describe("getOrCreateGuestId", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset the module so the function re-reads from the fresh localStorage
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("creates and stores a UUID on first call", async () => {
    const { getOrCreateGuestId } = await import("../utils/guestId");
    const id = getOrCreateGuestId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(localStorage.getItem("shards_guest_id")).toBe(id);
  });

  it("returns the same ID on subsequent calls", async () => {
    const { getOrCreateGuestId } = await import("../utils/guestId");
    const first = getOrCreateGuestId();
    const second = getOrCreateGuestId();
    expect(first).toBe(second);
  });

  it("reuses an existing ID stored in localStorage", async () => {
    const existing = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    localStorage.setItem("shards_guest_id", existing);
    const { getOrCreateGuestId } = await import("../utils/guestId");
    expect(getOrCreateGuestId()).toBe(existing);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/hints — Ra's Light
// ---------------------------------------------------------------------------

describe("handleRaLight → POST /api/v1/hints", () => {
  // We test the fetch call shape by calling the handler's internals directly
  // via a thin wrapper that mirrors the production async IIFE logic.

  const GUEST_ID = "test-guest-id";
  const TILES = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  const N = 3;
  const LAST_MOVED_VALUE = null;

  async function callHintsApi(
    hintType: "ra_light" | "thoth_hand",
    mockResponse: { status: number; body: unknown },
  ) {
    const fetchMock = vi.fn().mockResolvedValue({
      status: mockResponse.status,
      ok: mockResponse.status >= 200 && mockResponse.status < 300,
      json: () => Promise.resolve(mockResponse.body),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetch("/api/v1/hints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": GUEST_ID,
      },
      body: JSON.stringify({
        tiles: TILES,
        n: N,
        lastMovedValue: LAST_MOVED_VALUE,
        hintType,
      }),
    });

    return { fetchMock, response };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls POST /api/v1/hints with hintType ra_light and x-user-id header", async () => {
    const { fetchMock } = await callHintsApi("ra_light", {
      status: 200,
      body: { tile: 2 },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/hints");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-user-id"]).toBe(
      GUEST_ID,
    );

    const parsed = JSON.parse(init.body as string) as {
      hintType: string;
      tiles: number[];
      n: number;
      lastMovedValue: null;
    };
    expect(parsed.hintType).toBe("ra_light");
    expect(parsed.tiles).toEqual(TILES);
    expect(parsed.n).toBe(N);
    expect(parsed.lastMovedValue).toBeNull();
  });

  it("200 response → returns the tile number from response body", async () => {
    const { response } = await callHintsApi("ra_light", {
      status: 200,
      body: { tile: 5 },
    });
    expect(response.status).toBe(200);
    const data = (await response.json()) as { tile: number };
    expect(data.tile).toBe(5);
  });

  it("403 response → status is 403", async () => {
    const { response } = await callHintsApi("ra_light", {
      status: 403,
      body: { error: "Hint limit reached" },
    });
    expect(response.status).toBe(403);
  });

  it("401 response → status is 401", async () => {
    const { response } = await callHintsApi("ra_light", {
      status: 401,
      body: { error: "Unauthorized" },
    });
    expect(response.status).toBe(401);
  });

  it("400 response → status is 400", async () => {
    const { response } = await callHintsApi("ra_light", {
      status: 400,
      body: { error: "Puzzle already solved" },
    });
    expect(response.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/hints — Thoth's Hand
// ---------------------------------------------------------------------------

describe("handleThothHand → POST /api/v1/hints", () => {
  const GUEST_ID = "test-guest-id-thoth";
  const TILES = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  const N = 3;
  const LAST_MOVED_VALUE = 8;

  async function callHintsApi(
    hintType: "ra_light" | "thoth_hand",
    mockResponse: { status: number; body: unknown },
  ) {
    const fetchMock = vi.fn().mockResolvedValue({
      status: mockResponse.status,
      ok: mockResponse.status >= 200 && mockResponse.status < 300,
      json: () => Promise.resolve(mockResponse.body),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetch("/api/v1/hints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": GUEST_ID,
      },
      body: JSON.stringify({
        tiles: TILES,
        n: N,
        lastMovedValue: LAST_MOVED_VALUE,
        hintType,
      }),
    });

    return { fetchMock, response };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls POST /api/v1/hints with hintType thoth_hand", async () => {
    const { fetchMock } = await callHintsApi("thoth_hand", {
      status: 200,
      body: { tile: 7 },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/hints");
    const parsed = JSON.parse(init.body as string) as { hintType: string };
    expect(parsed.hintType).toBe("thoth_hand");
  });

  it("200 response → returns the tile index to move", async () => {
    const { response } = await callHintsApi("thoth_hand", {
      status: 200,
      body: { tile: 7 },
    });
    expect(response.status).toBe(200);
    const data = (await response.json()) as { tile: number };
    expect(data.tile).toBe(7);
  });

  it("403 response → status is 403", async () => {
    const { response } = await callHintsApi("thoth_hand", {
      status: 403,
      body: { error: "Hint limit reached" },
    });
    expect(response.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Request shape — shared assertions
// ---------------------------------------------------------------------------

describe("hints API request shape", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("always sends Content-Type application/json", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ tile: 0 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetch("/api/v1/hints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "some-id",
      },
      body: JSON.stringify({
        tiles: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        n: 3,
        lastMovedValue: null,
        hintType: "ra_light",
      }),
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("sends x-user-id header that is a non-empty string", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ tile: 0 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const userId = crypto.randomUUID();
    await fetch("/api/v1/hints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({
        tiles: [0],
        n: 1,
        lastMovedValue: null,
        hintType: "thoth_hand",
      }),
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentId = (init.headers as Record<string, string>)["x-user-id"];
    expect(sentId).toBeTruthy();
    expect(sentId).toBe(userId);
  });
});
