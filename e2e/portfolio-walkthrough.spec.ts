import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";

const VIDEO_DIR = "portfolio-videos";
const FINAL_VIDEO = path.join(VIDEO_DIR, "habiganize-ux-walkthrough.webm");
const DEMO_USER_ID = "portfolio-user";
const PORTFOLIO_PAUSE_MS = 1500;

type Habit = {
  id: number;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  targetDays: string[];
  reminderEnabled: boolean;
  reminderTimes: string[];
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  todayMood?: "great" | "good" | "okay" | "meh" | "bad" | null;
  todayNote?: string | null;
  createdAt: string;
  archivedAt?: string | null;
};

type Completion = {
  id: number;
  habitId: number;
  completedDate: string;
  mood?: Habit["todayMood"];
  note?: string | null;
};

type Wallet = {
  coins: number;
  food: number;
  water: number;
};

const today = dateKey(new Date());

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return dateKey(date);
}

async function pause(page: Page) {
  await page.waitForTimeout(PORTFOLIO_PAUSE_MS);
}

async function json(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
}

async function noContent(route: Route) {
  await route.fulfill({ status: 204, body: "" });
}

async function requestBody<T extends object>(route: Route): Promise<Partial<T>> {
  const raw = route.request().postData();
  if (!raw) return {};
  return JSON.parse(raw) as Partial<T>;
}

function installPortfolioApiMock(context: BrowserContext) {
  let nextHabitId = 4;
  let nextCompletionId = 20;
  let nextGroceryId = 3;

  const wallet: Wallet = { coins: 275, food: 6, water: 5 };
  const habits: Habit[] = [
    {
      id: 1,
      name: "Morning walk",
      description: "Start the day with ten quiet minutes outside.",
      color: "#7fc66c",
      icon: "Footprints",
      targetDays: ["all"],
      reminderEnabled: true,
      reminderTimes: ["08:00"],
      currentStreak: 6,
      longestStreak: 14,
      completedToday: true,
      todayMood: "good",
      todayNote: "Felt energized before work.",
      createdAt: `${daysAgo(21)}T08:00:00.000Z`,
      archivedAt: null,
    },
    {
      id: 2,
      name: "Drink water",
      description: "Refill the big bottle before lunch.",
      color: "#78c7ff",
      icon: "Droplet",
      targetDays: ["all"],
      reminderEnabled: false,
      reminderTimes: [],
      currentStreak: 4,
      longestStreak: 11,
      completedToday: false,
      todayMood: null,
      todayNote: null,
      createdAt: `${daysAgo(18)}T08:00:00.000Z`,
      archivedAt: null,
    },
    {
      id: 3,
      name: "Read before bed",
      description: "Replace late scrolling with a chapter.",
      color: "#b14dff",
      icon: "BookOpen",
      targetDays: ["all"],
      reminderEnabled: true,
      reminderTimes: ["21:30"],
      currentStreak: 2,
      longestStreak: 9,
      completedToday: false,
      todayMood: null,
      todayNote: null,
      createdAt: `${daysAgo(15)}T08:00:00.000Z`,
      archivedAt: null,
    },
  ];
  const completions: Completion[] = [
    { id: 1, habitId: 1, completedDate: today, mood: "good", note: "Felt energized before work." },
    { id: 2, habitId: 1, completedDate: daysAgo(1), mood: "great", note: "Longer route through the park." },
    { id: 3, habitId: 1, completedDate: daysAgo(2), mood: "good", note: null },
    { id: 4, habitId: 2, completedDate: daysAgo(1), mood: "okay", note: "Needed an afternoon refill." },
    { id: 5, habitId: 3, completedDate: daysAgo(1), mood: "great", note: "Finished a chapter." },
    { id: 6, habitId: 3, completedDate: daysAgo(2), mood: "good", note: null },
  ];
  const groceryItems = [
    { id: 1, name: "Blueberries", checked: false, sortOrder: 1, createdAt: `${today}T09:00:00.000Z` },
    { id: 2, name: "Sparkling water", checked: true, sortOrder: 2, createdAt: `${today}T09:05:00.000Z` },
  ];

  const activeHabits = () => habits.filter((habit) => !habit.archivedAt);
  const archivedHabits = () => habits.filter((habit) => habit.archivedAt);

  const dashboard = () => {
    const active = activeHabits();
    const completedToday = active.filter((habit) => habit.completedToday).length;
    return {
      todayCompletionRate: active.length ? completedToday / active.length : 0,
      totalHabits: active.length,
      completedToday,
      longestActiveStreak: Math.max(...active.map((habit) => habit.longestStreak), 0),
      weeklyCompletionRate: 0.74,
      habitStats: active.map((habit, index) => ({
        habitId: habit.id,
        name: habit.name,
        color: habit.color,
        icon: habit.icon,
        currentStreak: habit.currentStreak,
        longestStreak: habit.longestStreak,
        completedToday: habit.completedToday,
        weeklyCompletions: Math.min(7, Math.max(1, habit.currentStreak + (index % 2))),
        totalCompletions: completions.filter((completion) => completion.habitId === habit.id).length + habit.longestStreak,
      })),
    };
  };

  const historyMonth = (year: number, month: number) => {
    const inMonth = completions.filter((completion) => {
      const date = new Date(`${completion.completedDate}T00:00:00`);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });
    const earliest = completions
      .map((completion) => completion.completedDate)
      .sort((a, b) => a.localeCompare(b))[0] ?? null;

    return {
      year,
      month,
      earliestCompletionDate: earliest,
      habits: activeHabits().map((habit) => ({
        id: habit.id,
        name: habit.name,
        color: habit.color,
        icon: habit.icon,
        completions: inMonth
          .filter((completion) => completion.habitId === habit.id)
          .map(({ completedDate, mood, note }) => ({ completedDate, mood, note })),
      })),
    };
  };

  const ownedPet = {
    id: 1,
    slug: "shiba",
    name: "Toby",
    breed: "Shiba Inu",
    imageUrl: "",
    nickname: null,
    accessory: null,
    accessoryLayout: [{ accessoryId: "scarf", x: 0.5, y: 0.66 }],
    hunger: 88,
    thirst: 82,
    walk: 76,
    bath: 70,
    play: 92,
    feedLabel: "Full",
    walkLabel: "Ready for a short walk",
    bathLabel: "Fresh",
    playLabel: "Ready",
    feedReady: false,
    walkReady: true,
    bathReady: true,
    playReady: true,
    level: 4,
    mood: "happy",
    acquiredAt: `${daysAgo(12)}T10:00:00.000Z`,
  };

  return context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const pathName = url.pathname;

    if (method === "GET" && pathName === "/api/healthz") {
      return json(route, { status: "ok" });
    }

    if (pathName === "/api/habits" && method === "GET") {
      const archived = url.searchParams.get("archived");
      return json(route, archived === "true" ? archivedHabits() : activeHabits());
    }

    if (pathName === "/api/habits" && method === "POST") {
      const body = await requestBody<Partial<Habit>>(route);
      const habit: Habit = {
        id: nextHabitId++,
        name: String(body.name ?? "New habit"),
        description: typeof body.description === "string" ? body.description : null,
        color: typeof body.color === "string" ? body.color : "#e85d8f",
        icon: typeof body.icon === "string" ? body.icon : "Star",
        targetDays: Array.isArray(body.targetDays) ? body.targetDays : ["all"],
        reminderEnabled: Boolean(body.reminderEnabled),
        reminderTimes: Array.isArray(body.reminderTimes) ? body.reminderTimes : [],
        currentStreak: 0,
        longestStreak: 0,
        completedToday: false,
        todayMood: null,
        todayNote: null,
        createdAt: new Date().toISOString(),
        archivedAt: null,
      };
      habits.push(habit);
      return json(route, habit, 201);
    }

    const completionMatch = pathName.match(/^\/api\/habits\/(\d+)\/complete$/);
    if (completionMatch) {
      const habitId = Number(completionMatch[1]);
      const habit = habits.find((item) => item.id === habitId);
      if (!habit) return json(route, { error: "Habit not found" }, 404);

      if (method === "POST") {
        const body = await requestBody<Completion>(route);
        habit.completedToday = true;
        habit.currentStreak = Math.max(1, habit.currentStreak + 1);
        habit.longestStreak = Math.max(habit.longestStreak, habit.currentStreak);
        habit.todayMood = body.mood ?? habit.todayMood ?? null;
        habit.todayNote = body.note ?? habit.todayNote ?? null;

        let completion = completions.find(
          (item) => item.habitId === habitId && item.completedDate === (body.completedDate ?? today),
        );
        if (!completion) {
          completion = {
            id: nextCompletionId++,
            habitId,
            completedDate: today,
            mood: habit.todayMood,
            note: habit.todayNote,
          };
          completions.push(completion);
          wallet.coins += 10;
          wallet.food += 1;
          wallet.water += 1;
        }

        return json(route, {
          completion,
          coinsAwarded: 10,
          foodAwarded: 1,
          waterAwarded: 1,
          wallet,
        });
      }

      if (method === "PATCH") {
        const body = await requestBody<Completion>(route);
        habit.todayMood = body.mood ?? null;
        habit.todayNote = body.note ?? null;
        const completion =
          completions.find((item) => item.habitId === habitId && item.completedDate === today) ??
          ({ id: nextCompletionId++, habitId, completedDate: today } as Completion);
        completion.mood = habit.todayMood;
        completion.note = habit.todayNote;
        if (!completions.includes(completion)) completions.push(completion);
        return json(route, completion);
      }

      if (method === "DELETE") {
        habit.completedToday = false;
        habit.todayMood = null;
        habit.todayNote = null;
        return noContent(route);
      }
    }

    if (method === "GET" && pathName === "/api/completions") {
      return json(route, completions);
    }

    if (method === "GET" && pathName === "/api/dashboard") {
      return json(route, dashboard());
    }

    if (method === "GET" && pathName === "/api/history") {
      const now = new Date();
      const year = Number(url.searchParams.get("year") ?? now.getFullYear());
      const month = Number(url.searchParams.get("month") ?? now.getMonth() + 1);
      return json(route, historyMonth(year, month));
    }

    if (method === "GET" && pathName === "/api/wallet") {
      return json(route, wallet);
    }

    if (method === "GET" && pathName === "/api/grocery-items") {
      return json(route, groceryItems);
    }

    if (method === "POST" && pathName === "/api/grocery-items") {
      const body = await requestBody<{ name: string; checked: boolean }>(route);
      const item = {
        id: nextGroceryId++,
        name: String(body.name ?? "New grocery item"),
        checked: Boolean(body.checked),
        sortOrder: nextGroceryId,
        createdAt: new Date().toISOString(),
      };
      groceryItems.push(item);
      return json(route, item, 201);
    }

    if (pathName.match(/^\/api\/grocery-items\/\d+$/)) {
      return method === "DELETE" ? noContent(route) : json(route, groceryItems[0]);
    }

    if (method === "POST" && pathName === "/api/grocery-items/clear-checked") {
      return noContent(route);
    }

    if (method === "GET" && pathName === "/api/shop") {
      return json(route, [
        {
          slug: "shiba",
          name: "Toby",
          breed: "Shiba Inu",
          description: "A confident companion for streak-building days.",
          price: 0,
          imageUrl: "",
          owned: true,
        },
        {
          slug: "corgi",
          name: "Biscuit",
          breed: "Corgi",
          description: "Short legs, big accountability energy.",
          price: 120,
          imageUrl: "",
          owned: false,
        },
      ]);
    }

    if (method === "GET" && pathName === "/api/collection") {
      return json(route, [ownedPet]);
    }

    if (method === "GET" && pathName === "/api/foods") {
      return json(route, [
        {
          slug: "apple",
          name: "Apple bites",
          emoji: "A",
          description: "A crisp snack for happy pups.",
          price: 15,
          hungerAmount: 20,
          bonusLevel: 0,
          owned: 2,
        },
      ]);
    }

    if (method === "GET" && pathName === "/api/toys") {
      return json(route, [
        {
          slug: "tennis-ball",
          name: "Tennis ball",
          emoji: "o",
          description: "Classic playtime reward.",
          price: 40,
          happinessGain: 20,
          cooldownMinutes: 30,
          owned: true,
          ready: true,
          cooldownLabel: "Ready",
        },
      ]);
    }

    if (method === "GET" && pathName === "/api/visitor") {
      return json(route, {
        slug: "corgi",
        name: "Biscuit",
        breed: "Corgi",
        imageUrl: "",
        availableAt: new Date().toISOString(),
        ready: true,
      });
    }

    if (method === "POST" && pathName.startsWith("/api/collection/")) {
      return json(route, { pet: ownedPet, wallet });
    }

    return json(route, {});
  });
}

test("records a paced Habiganize UX portfolio walkthrough", async ({ browser, baseURL }) => {
  await mkdir(VIDEO_DIR, { recursive: true });
  await rm(FINAL_VIDEO, { force: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR },
  });
  await installPortfolioApiMock(context);
  await context.addInitScript((userId) => {
    window.localStorage.setItem(`habiganize:onboarding_v1:${userId}`, "1");
    window.localStorage.setItem(
      `habiganize:feedback_prompt_v1:${userId}`,
      JSON.stringify({ firstSeenAt: new Date().toISOString(), lastPromptAt: new Date().toISOString() }),
    );
  }, DEMO_USER_ID);

  const page = await context.newPage();
  await page.goto(baseURL ?? "http://127.0.0.1:5173");

  await expect(page.getByTestId("welcome-greeting")).toBeVisible();
  await pause(page);

  await pause(page);
  await page.getByTestId("nav-habits").click();
  await expect(page.getByRole("heading", { name: /habits/i })).toBeVisible();
  await pause(page);

  await page.getByTestId("button-create-habit").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await pause(page);

  await page.getByTestId("input-habit-name").fill("Evening stretch");
  await page.getByTestId("input-habit-description").fill("A calm five-minute reset after dinner.");
  await pause(page);

  await page.getByTestId("button-save-habit").click();
  await expect(page.getByText(/Evening stretch/i)).toBeVisible();
  await pause(page);

  await page.getByTestId("nav-today").click();
  await expect(page.getByTestId("today-progress-text")).toBeVisible();
  await pause(page);

  await page.getByTestId("habit-toggle-4").click();
  await expect(page.getByTestId("mood-sheet")).toBeVisible();
  await pause(page);

  await page.getByTestId("mood-option-great").click();
  await page.getByTestId("mood-note-input").fill("Nice transition from work mode to rest.");
  await pause(page);

  await page.getByTestId("mood-save").click();
  await expect(page.getByTestId("habit-mood-4")).toBeVisible();
  await pause(page);

  await page.getByTestId("nav-stats").click();
  await expect(page.getByRole("heading", { name: /stats/i })).toBeVisible();
  await pause(page);

  await page.getByTestId("nav-history").click();
  await expect(page.getByTestId("history-list")).toBeVisible();
  await pause(page);

  await page.getByTestId("nav-pups").click();
  await expect(page.getByRole("heading", { name: /pups/i })).toBeVisible();
  await pause(page);

  await page.getByTestId("tab-collection").click();
  await expect(page.getByTestId("owned-pet-shiba")).toBeVisible();
  await pause(page);

  await page.getByTestId("owned-pet-shiba").click();
  await expect(page.getByTestId("pet-detail-modal")).toBeVisible();
  await pause(page);

  await page.getByTestId("toggle-dressup").click();
  await expect(page.getByTestId("accessory-tray")).toBeVisible();
  await pause(page);

  const video = page.video();
  await context.close();

  const rawVideoPath = await video?.path();
  expect(rawVideoPath).toBeTruthy();
  await rename(rawVideoPath!, FINAL_VIDEO);
});
