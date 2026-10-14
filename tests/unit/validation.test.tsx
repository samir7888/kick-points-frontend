import { describe, expect, it, vi } from "vitest";
import { amountSchema, slugSchema } from "@/lib/validation";
import { messageForError, ApiError } from "@/lib/api/errors";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SplitBar } from "@/components/split-bar";
import { Pagination } from "@/components/pagination";

describe("form validation", () => {
  it("accepts Kick-style channel slugs and rejects malformed names", () => {
    expect(slugSchema.safeParse("some_channel-2").success).toBe(true);
    expect(slugSchema.safeParse("not a slug").success).toBe(false);
  });
  it("enforces the configured point minimum", () => {
    expect(amountSchema.safeParse(10).success).toBe(true);
    expect(amountSchema.safeParse(2).success).toBe(false);
  });
  it("maps plan limit errors to actionable copy", () => {
    expect(messageForError(new ApiError(402, "PLAN_LIMIT", "full"))).toContain("Upgrade");
  });
  it("renders page controls and reports the requested page", async () => {
    const onPage = vi.fn();
    render(<Pagination page={2} pages={3} total={45} limit={20} onPage={onPage} />);
    expect(screen.getByText("Showing 21–40 of 45")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Next page"));
    expect(onPage).toHaveBeenCalledWith(3);
  });
  it("shows a plain outcome list when totals are unavailable", () => {
    render(<SplitBar outcomes={[{ id: "one", title: "One" }]} selected="one" />);
    expect(screen.getByText(/Your pick/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Prediction outcome shares")).not.toBeInTheDocument();
  });
});
