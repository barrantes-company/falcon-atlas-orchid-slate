import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LINK, linkDetail, linkLabel, type LinkState } from "./widget-demo.ts";

const STATES: LinkState[] = ["CONNECTED", "CONNECTING", "OFFLINE", "ERROR", "UNKNOWN"];

describe("linkLabel", () => {
  it("never calls the sample feed a live connection", () => {
    for (const state of STATES) {
      assert.equal(linkLabel(state, true), "DEMO");
    }
  });

  it("does not claim to be online without a confirmed link", () => {
    assert.equal(LINK, "UNKNOWN");
    assert.equal(linkLabel("UNKNOWN", false), "Sin conexión real");
    assert.equal(linkLabel("OFFLINE", false), "Sin conexión");
    assert.equal(linkLabel("ERROR", false), "Error de conexión");
    assert.notEqual(linkLabel("UNKNOWN", false), "En línea");
  });
});

describe("linkDetail", () => {
  it("keeps the sample and the real channel in different sentences", () => {
    assert.match(linkDetail("CONNECTED", true), /no es actividad real/i);
    assert.match(linkDetail("UNKNOWN", false), /sin telemetría/i);
  });
});
