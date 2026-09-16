import { describe, expect, it } from "vitest";

import { findMutationGateOmissions, findOutdatedMcpNames } from "./validate.js";

describe("MCP instruction compatibility validation", () => {
  it("rejects outdated tool names without rejecting current data tools", () => {
    expect(findOutdatedMcpNames("Use element_tool for this change.")).toEqual([
      "element_tool",
    ]);
    expect(
      findOutdatedMcpNames("Use data_element_tool for this change."),
    ).toEqual([]);
  });

  it("requires the complete two-response gate for every Webflow mutation", () => {
    const complete = [
      "Before every Webflow-hosted mutation, present the exact plan.",
      "Ask for a fresh native Webflow restore point or an explicit informed waiver.",
      "Stop and wait for a new user reply.",
      "Then ask for a separate final confirmation; the waiver reply cannot double as write confirmation.",
      "Restart the gate when state or the plan changed.",
    ].join(" ");

    expect(findMutationGateOmissions(complete)).toEqual([]);
    expect(
      findMutationGateOmissions(
        "For high-risk work, ask for a restore point and confirmation.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "every Webflow-hosted mutation",
        "a new user reply",
        "a separate final confirmation",
        "separation between recovery and write confirmation",
      ]),
    );
  });
});
