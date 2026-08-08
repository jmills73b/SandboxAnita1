import { describe, expect, it } from "vitest";
import { CLIENT_CASE_STATUSES, isValidClientCaseStatus } from "./clientCaseStatus";

describe("isValidClientCaseStatus", () => {
  it("accepts every status in the lifecycle", () => {
    for (const status of CLIENT_CASE_STATUSES) {
      expect(isValidClientCaseStatus(status)).toBe(true);
    }
  });

  it("rejects a status not in the lifecycle", () => {
    expect(isValidClientCaseStatus("Archived")).toBe(false);
  });
});
