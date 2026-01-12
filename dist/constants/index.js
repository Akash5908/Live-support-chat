"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = exports.Status = void 0;
var Status;
(function (Status) {
    Status["OPEN"] = "open";
    Status["ASSIGNED"] = "assigned";
    Status["CLOSED"] = "closed";
})(Status || (exports.Status = Status = {}));
var Role;
(function (Role) {
    Role["Admin"] = "admin";
    Role["Supervisor"] = "supervisor";
    Role["Agent"] = "agent";
    Role["Candidate"] = "candidate";
})(Role || (exports.Role = Role = {}));
