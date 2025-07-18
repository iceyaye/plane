"use client"

export type TStateGroups = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export type TDraggableData = {
  groupKey: TStateGroups;
  id: string;
};

export const STATE_GROUPS: {
  [key in TStateGroups]: {
    key: TStateGroups;
    label: string;
    defaultStateName: string;
    color: string;
  };
} = {
  backlog: {
    key: "backlog",
    label: "Backlog",
    defaultStateName: "Backlog",
    color: "#d9d9d9",
  },
  unstarted: {
    key: "unstarted",
    label: "Unstarted",
    defaultStateName: "Todo",
    color: "#3f76ff",
  },
  started: {
    key: "started",
    label: "Started",
    defaultStateName: "In Progress",
    color: "#f59e0b",
  },
  completed: {
    key: "completed",
    label: "Completed",
    defaultStateName: "Done",
    color: "#16a34a",
  },
  cancelled: {
    key: "cancelled",
    label: "Canceled",
    defaultStateName: "Cancelled",
    color: "#dc2626",
  },
};

export const ARCHIVABLE_STATE_GROUPS = [STATE_GROUPS.completed.key, STATE_GROUPS.cancelled.key];
export const COMPLETED_STATE_GROUPS = [STATE_GROUPS.completed.key];
export const PENDING_STATE_GROUPS = [
  STATE_GROUPS.backlog.key,
  STATE_GROUPS.unstarted.key,
  STATE_GROUPS.started.key,
  STATE_GROUPS.cancelled.key,
];

export const PROGRESS_STATE_GROUPS_DETAILS = [
  {
    key: "completed_issues",
    title: "Completed",
    color: "#16A34A",
  },
  {
    key: "started_issues",
    title: "Started",
    color: "#F59E0B",
  },
  {
    key: "unstarted_issues",
    title: "Unstarted",
    color: "#3A3A3A",
  },
  {
    key: "backlog_issues",
    title: "Backlog",
    color: "#A3A3A3",
  },
];


export const DISPLAY_WORKFLOW_PRO_CTA = false;
