/**
 * Acceptance tests for the hint system — React / useGameState layer.
 *
 * AC-3:  200 response → glow class applied to the tile returned
 * AC-4:  403 response → favor button enters exhausted / disabled state
 * AC-10: Request in-flight → button is disabled while pending
 *
 * We test useGameState directly via renderHook from @testing-library/react
 * because rendering the full App requires too many external dependencies
 * (audio context, image loading, CSS custom properties, etc.).
 * All observable state exported by the hook is the same state the App reads
 * to drive its buttons and board — so these tests verify user-visible behaviour.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  renderHook,
  act,
  waitFor,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGameState } from "../hooks/useGameState";
import { GameBoard } from "../components/GameBoard";
import type { PuzzleData, WinPhase } from "../types";

// ---------------------------------------------------------------------------
// Shared fetch helpers
// ---------------------------------------------------------------------------

/**
 * Creates a fetch stub that resolves immediately with the given status/body.
 */
function mockFetchResolving(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });
}

/**
 * Creates a fetch stub that never resolves — simulates an in-flight request.
 * Returns the stub plus a resolve function so tests can unblock it later.
 */
function mockFetchPending(): {
  fetchMock: ReturnType<typeof vi.fn>;
  resolve: (value: unknown) => void;
} {
  let resolve!: (value: unknown) => void;
  const pending = new Promise((res) => {
    resolve = res;
  });

  const fetchMock = vi.fn().mockReturnValue(pending);
  return { fetchMock, resolve };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  // Provide a stable guest ID so the hook can call getOrCreateGuestId()
  localStorage.setItem("shards_guest_id", "acceptance-guest-id");
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// AC-3: A 200 response applies the hint glow to the tile number returned
// ---------------------------------------------------------------------------

describe("AC-3: 200 response applies hint glow to the returned tile index", () => {
  it(
    "AC-3: after handleRaLight resolves with { tile: 5 }, " +
      "raLightIdx equals 5",
    async () => {
      const fetchMock = mockFetchResolving(200, { tile: 5 });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useGameState());

      // Initially no glow tile is highlighted
      expect(result.current.raLightIdx).toBeNull();

      await act(async () => {
        result.current.handleRaLight();
      });

      // Wait for the async fetch inside handleRaLight to settle
      await waitFor(() => {
        expect(result.current.raLightIdx).toBe(5);
      });

      // The loading flag should also have cleared
      expect(result.current.raLightLoading).toBe(false);
    },
  );

  it(
    "AC-3: raLightIdx is set to the exact tile number from the API response, " +
      "not a hardcoded value",
    async () => {
      const fetchMock = mockFetchResolving(200, { tile: 2 });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        result.current.handleRaLight();
      });

      await waitFor(() => {
        expect(result.current.raLightIdx).toBe(2);
      });
    },
  );
});

// ---------------------------------------------------------------------------
// AC-4: A 403 response marks that favor as exhausted in the UI
// ---------------------------------------------------------------------------

describe("AC-4: 403 response exhausts the favor in the UI state", () => {
  it(
    "AC-4: 403 on ra_light → raLightUsed is set to RA_LIGHT_MAX (5), " +
      "disabling the button",
    async () => {
      const fetchMock = mockFetchResolving(403, {
        error: "Hint limit reached",
      });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useGameState());

      // Initially the Ra counter is below the cap
      expect(result.current.raLightUsed).toBeLessThan(5);

      await act(async () => {
        result.current.handleRaLight();
      });

      await waitFor(() => {
        // App.tsx disables the button when raLightUsed >= RA_LIGHT_MAX (5)
        expect(result.current.raLightUsed).toBe(5);
      });

      expect(result.current.raLightLoading).toBe(false);
    },
  );

  it(
    "AC-4: 403 on thoth_hand → thothUsed is set to THOTH_HAND_MAX (3), " +
      "disabling the button",
    async () => {
      const fetchMock = mockFetchResolving(403, {
        error: "Hint limit reached",
      });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useGameState());

      expect(result.current.thothUsed).toBeLessThan(3);

      await act(async () => {
        result.current.handleThothHand();
      });

      await waitFor(() => {
        // App.tsx disables the Thoth button when thothUsed >= THOTH_HAND_MAX (3)
        expect(result.current.thothUsed).toBe(3);
      });

      expect(result.current.thothLoading).toBe(false);
    },
  );

  it(
    "AC-4: after Ra's Light is 403-exhausted, handleRaLight is a no-op " +
      "(guard condition `raLightUsed >= RA_LIGHT_MAX` prevents a second fetch)",
    async () => {
      // First call: 403 to exhaust
      const fetchMock = mockFetchResolving(403, {
        error: "Hint limit reached",
      });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        result.current.handleRaLight();
      });
      await waitFor(() => expect(result.current.raLightUsed).toBe(5));

      // Second call: should be swallowed by the guard in handleRaLight
      fetchMock.mockClear();
      await act(async () => {
        result.current.handleRaLight();
      });

      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});

// ---------------------------------------------------------------------------
// AC-10: Button is disabled while a hint request is in flight
// ---------------------------------------------------------------------------

describe("AC-10: favor button is disabled while request is in-flight", () => {
  it(
    "AC-10: raLightLoading is true from the moment handleRaLight is called " +
      "until the response arrives",
    async () => {
      const { fetchMock, resolve } = mockFetchPending();
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useGameState());

      // Before the call: not loading
      expect(result.current.raLightLoading).toBe(false);

      // Trigger — do NOT await the full act so we can inspect mid-flight state
      act(() => {
        result.current.handleRaLight();
      });

      // Synchronously after triggering the async IIFE the loading flag is set
      await waitFor(() => {
        expect(result.current.raLightLoading).toBe(true);
      });

      // App.tsx renders `disabled={raLightUsed >= RA_LIGHT_MAX || raLightLoading}`
      // so while raLightLoading === true the button is disabled.
      expect(result.current.raLightLoading).toBe(true);

      // Now resolve the pending fetch so the hook can clean up
      await act(async () => {
        resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ tile: 3 }),
        });
        // Give microtasks a tick to run
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.raLightLoading).toBe(false);
      });
    },
  );

  it(
    "AC-10: thothLoading is true from the moment handleThothHand is called " +
      "until the response arrives",
    async () => {
      const { fetchMock, resolve } = mockFetchPending();
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useGameState());

      expect(result.current.thothLoading).toBe(false);

      act(() => {
        result.current.handleThothHand();
      });

      await waitFor(() => {
        expect(result.current.thothLoading).toBe(true);
      });

      // Resolve with a 200 so the finally block runs
      await act(async () => {
        resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ tile: 0 }), // tile 0 is movable in solved state
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.thothLoading).toBe(false);
      });
    },
  );

  it(
    "AC-10: raLightLoading returns to false after a 403 response " +
      "(error path does not leave the button stuck in loading state)",
    async () => {
      const fetchMock = mockFetchResolving(403, {
        error: "Hint limit reached",
      });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        result.current.handleRaLight();
      });

      await waitFor(() => {
        expect(result.current.raLightLoading).toBe(false);
      });
    },
  );

  it("AC-10: thothLoading returns to false after a 403 response", async () => {
    const fetchMock = mockFetchResolving(403, { error: "Hint limit reached" });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGameState());

    await act(async () => {
      result.current.handleThothHand();
    });

    await waitFor(() => {
      expect(result.current.thothLoading).toBe(false);
    });
  });

  it(
    "AC-10: a second handleRaLight call while loading is a no-op " +
      "(the guard `raLightLoading` prevents double-firing)",
    async () => {
      const { fetchMock, resolve } = mockFetchPending();
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useGameState());

      // First call: in-flight
      act(() => {
        result.current.handleRaLight();
      });

      await waitFor(() => expect(result.current.raLightLoading).toBe(true));

      // Second call while still loading — should be ignored
      act(() => {
        result.current.handleRaLight();
      });

      // fetch should only have been called once
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Clean up
      await act(async () => {
        resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ tile: 1 }),
        });
        await Promise.resolve();
      });
    },
  );
});

// ---------------------------------------------------------------------------
// AC-9 (supplementary): 401 response sets sessionExpired in UI
// This is a UI-observable effect of the 401 path that no existing web test
// covers at the hook-state level.
// ---------------------------------------------------------------------------

describe("AC-9 (supplementary): 401 response sets sessionExpired flag", () => {
  it("AC-9: 401 from ra_light → sessionExpired becomes true", async () => {
    const fetchMock = mockFetchResolving(401, { error: "Unauthorized" });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGameState());

    expect(result.current.sessionExpired).toBe(false);

    await act(async () => {
      result.current.handleRaLight();
    });

    await waitFor(() => {
      expect(result.current.sessionExpired).toBe(true);
    });

    // Loading flag must also clear on 401 path
    expect(result.current.raLightLoading).toBe(false);
  });

  it("AC-9: 401 from thoth_hand → sessionExpired becomes true", async () => {
    const fetchMock = mockFetchResolving(401, { error: "Unauthorized" });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGameState());

    await act(async () => {
      result.current.handleThothHand();
    });

    await waitFor(() => {
      expect(result.current.sessionExpired).toBe(true);
    });

    expect(result.current.thothLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Shared GameBoard props factory
// ---------------------------------------------------------------------------

const TEST_PUZZLE: PuzzleData = {
  id: 1,
  name: "Test Puzzle",
  // 1×1 transparent GIF — loads synchronously in jsdom
  imageUrl:
    "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
  hook: "",
  lore: "",
  win: "",
};

// tiles=[1,2,3,4,5,6,7,8,0], n=3 → empty value = n*n-1 = 8
// tile at index 5 has value 6 (not empty, not hidden) — safe for raLightIdx=5
const TEST_TILES = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const TEST_MOVABLE = new Set([2, 4, 6, 8]);

function makeGameBoardProps(
  overrides: Partial<Parameters<typeof GameBoard>[0]> = {},
): Parameters<typeof GameBoard>[0] {
  return {
    n: 3,
    tiles: TEST_TILES,
    puzzle: TEST_PUZZLE,
    imageLoaded: true,
    winPhase: "none" as WinPhase,
    frozen: false,
    moveLocked: false,
    movable: TEST_MOVABLE,
    raLightIdx: null,
    hintGlow: false,
    visionActive: false,
    pressedIdx: null,
    onPointerDown: () => {},
    onPointerUp: () => {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// AC-3 DOM: tile-hint CSS class is applied in the rendered GameBoard
// ---------------------------------------------------------------------------

describe("AC-3 DOM: tile-hint CSS class is applied in the rendered GameBoard", () => {
  it("AC-3 DOM: button at index 5 has class tile-hint when raLightIdx=5 and frozen=false", () => {
    render(<GameBoard {...makeGameBoardProps({ raLightIdx: 5 })} />);

    const buttons = screen.getAllByRole("button");
    // buttons[5] is the 6th button (0-based index 5); tile value 6, not empty
    expect(buttons[5]).toHaveClass("tile-hint");
  });

  it("AC-3 DOM: no button has class tile-hint when raLightIdx=null", () => {
    render(<GameBoard {...makeGameBoardProps({ raLightIdx: null })} />);

    // document.querySelector returns null when no element matches
    expect(document.querySelector(".tile-hint")).toBeNull();
  });

  it(
    "AC-3 DOM: button at index 5 does NOT have class tile-hint when frozen=true " +
      "(frozen overrides the !frozen guard in isRaLight)",
    () => {
      render(
        <GameBoard
          {...makeGameBoardProps({
            raLightIdx: 5,
            frozen: true,
            winPhase: "frozen",
          })}
        />,
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons[5]).not.toHaveClass("tile-hint");
    },
  );
});

// ---------------------------------------------------------------------------
// AC-10 DOM: favor buttons have disabled attribute while request is in-flight
// ---------------------------------------------------------------------------

// Minimal wrapper component that mirrors the App.tsx button disabled logic.
// Defined here (not exported) so it sits close to the tests that use it.
function FavorButtons() {
  const game = useGameState();
  return (
    <div>
      <button
        disabled={game.raLightUsed >= 5 || game.raLightLoading}
        onClick={() => {
          void game.handleRaLight();
        }}
        data-testid="ra-btn"
      />
      <button
        disabled={game.thothUsed >= 3 || game.thothLoading}
        onClick={() => {
          void game.handleThothHand();
        }}
        data-testid="thoth-btn"
      />
    </div>
  );
}

describe("AC-10 DOM: favor buttons have disabled attribute while request is in-flight", () => {
  it(
    "AC-10 DOM (Ra): Ra button becomes disabled while fetch is pending, " +
      "then re-enables after response",
    async () => {
      const { fetchMock, resolve } = mockFetchPending();
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      render(<FavorButtons />);

      const raBtn = screen.getByTestId("ra-btn");

      // Initially not disabled
      expect(raBtn).not.toBeDisabled();

      // Clicking fires handleRaLight which sets raLightLoading=true
      await user.click(raBtn);

      // Button must be disabled while the fetch is in-flight
      expect(raBtn).toBeDisabled();

      // Resolve the pending fetch — hook clears raLightLoading in the finally block
      await act(async () => {
        resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ tile: 3 }),
        });
        await Promise.resolve();
      });

      await waitFor(() => expect(raBtn).not.toBeDisabled());
    },
  );

  it(
    "AC-10 DOM (Thoth): Thoth button becomes disabled while fetch is pending, " +
      "then re-enables after response",
    async () => {
      const { fetchMock, resolve } = mockFetchPending();
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      render(<FavorButtons />);

      const thothBtn = screen.getByTestId("thoth-btn");

      // Initially not disabled
      expect(thothBtn).not.toBeDisabled();

      // Click fires handleThothHand which sets thothLoading=true
      await user.click(thothBtn);

      // Button must be disabled while the fetch is in-flight
      expect(thothBtn).toBeDisabled();

      // Resolve the pending fetch
      await act(async () => {
        resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ tile: 0 }),
        });
        await Promise.resolve();
      });

      await waitFor(() => expect(thothBtn).not.toBeDisabled());
    },
  );

  it(
    "AC-10 DOM (Ra clears after response): Ra button returns to enabled state " +
      "once the 200 response settles",
    async () => {
      let resolvePromise!: (value: unknown) => void;
      const pending = new Promise((res) => {
        resolvePromise = res;
      });
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));

      const user = userEvent.setup();
      render(<FavorButtons />);

      const raBtn = screen.getByTestId("ra-btn");

      await user.click(raBtn);
      expect(raBtn).toBeDisabled();

      // Resolve with a successful 200 — the finally block clears raLightLoading
      await act(async () => {
        resolvePromise({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ tile: 3 }),
        });
        await Promise.resolve();
      });

      await waitFor(() => expect(raBtn).not.toBeDisabled());
    },
  );
});
