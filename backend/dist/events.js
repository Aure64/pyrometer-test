"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilteredSender = exports.excludeEvents = exports.Events = void 0;
const loglevel_1 = require("loglevel");
var Events;
(function (Events) {
    Events["Baked"] = "baked";
    Events["MissedBake"] = "missed_bake";
    Events["MissedBonus"] = "missed_bonus";
    Events["DoubleBaked"] = "double_baked";
    Events["Endorsed"] = "endorsed";
    Events["MissedEndorsement"] = "missed_endorsement";
    Events["DoubleEndorsed"] = "double_endorsed";
    Events["DoublePreendorsed"] = "double_preendorsed";
    Events["Deactivated"] = "deactivated";
    Events["DeactivationRisk"] = "deactivation_risk";
    Events["NodeBehind"] = "node_behind";
    Events["NodeSynced"] = "node_synced";
    Events["NodeLowPeers"] = "low_peer_count";
    Events["NodeLowPeersResolved"] = "low_peer_count_resolved";
    Events["RpcError"] = "rpc_error";
    Events["RpcErrorResolved"] = "rpc_error_resolved";
    Events["Notification"] = "notification";
    Events["BakerUnhealthy"] = "baker_unhealthy";
    Events["BakerRecovered"] = "baker_recovered";
})(Events || (exports.Events = Events = {}));
const excludeEvents = (inEvents, exclude, bakers) => {
    return inEvents.filter((e) => !exclude.includes(e.kind) &&
        (!bakers || !("baker" in e) || bakers.includes(e.baker)));
};
exports.excludeEvents = excludeEvents;
const FilteredSender = (sender, config) => {
    return async (inEvents) => {
        const events = (0, exports.excludeEvents)(inEvents, config.exclude, config.bakers);
        if (events.length !== inEvents.length) {
            (0, loglevel_1.getLogger)("events").debug(`Filtered out ${inEvents.length - events.length}`);
        }
        await sender(events);
    };
};
exports.FilteredSender = FilteredSender;
