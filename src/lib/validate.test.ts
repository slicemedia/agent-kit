import { describe, expect, it } from "vitest";

import { findOutdatedMcpNames } from "./validate.js";

describe("MCP instruction compatibility validation", () => {
  it("rejects outdated tool names without rejecting current data tools", () => {
    expect(findOutdatedMcpNames("Use element_tool for this change.")).toEqual([
      "element_tool",
    ]);
    expect(
      findOutdatedMcpNames("Use data_element_tool for this change."),
    ).toEqual([]);
  });
});
