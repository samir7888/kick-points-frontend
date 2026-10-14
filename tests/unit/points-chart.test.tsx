import { describe, expect, it } from "vitest";
import {
  formatBucket,
  toShareData,
  toTrendData,
} from "@/components/points-chart";

describe("points charts", () => {
  it("labels sub-day buckets by local time and day buckets by UTC date", () => {
    // Sub-day labels are local (HH:mm), so assert the shape rather than a value.
    expect(formatBucket("2026-10-14T08:15:00+00:00", "24h")).toMatch(
      /^\d{2}:\d{2}$/,
    );
    // Day labels read the UTC date parts, immune to the machine's timezone.
    expect(formatBucket("2026-10-03T00:00:00+00:00", "30d")).toBe("3 Oct");
  });

  it("maps the total series to labelled chart points", () => {
    expect(
      toTrendData(
        [
          { at: "2026-10-01T00:00:00+00:00", total: 100 },
          { at: "2026-10-03T00:00:00+00:00", total: 130 },
        ],
        "7d",
      ),
    ).toEqual([
      { label: "1 Oct", total: 100 },
      { label: "3 Oct", total: 130 },
    ]);
  });

  it("builds share slices only for channels that hold points", () => {
    expect(
      toShareData([
        { slug: "alpha", current: 100 },
        { slug: "bravo", current: 0 },
        { slug: "charlie", current: 40 },
      ]),
    ).toEqual([
      { name: "alpha", value: 100 },
      { name: "charlie", value: 40 },
    ]);
  });
});
