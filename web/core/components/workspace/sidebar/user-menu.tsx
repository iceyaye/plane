"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Home, Inbox, PenSquare } from "lucide-react";
// plane imports
import { EUserWorkspaceRoles } from "@plane/constants";
import { UserActivityIcon } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { SidebarUserMenuItem } from "@/components/workspace/sidebar";
// helpers
// hooks
import { useAppTheme, useUserPermissions, useUser } from "@/hooks/store";

export const SidebarUserMenu = observer(() => {
  const { workspaceSlug } = useParams();
  const { sidebarCollapsed } = useAppTheme();
  const { workspaceUserInfo } = useUserPermissions();
  const { data: currentUser } = useUser();

  const SIDEBAR_USER_MENU_ITEMS = [
    {
      key: "home",
      labelTranslationKey: "sidebar.home",
      href: `/${workspaceSlug.toString()}/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
      Icon: Home,
    },
    {
      key: "your-work",
      labelTranslationKey: "sidebar.your_work",
      href: `/${workspaceSlug.toString()}/profile/${currentUser?.id}/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
      Icon: UserActivityIcon,
    },
    {
      key: "notifications",
      labelTranslationKey: "sidebar.inbox",
      href: `/${workspaceSlug.toString()}/notifications/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
      Icon: Inbox,
    },
    {
      key: "drafts",
      labelTranslationKey: "sidebar.drafts",
      href: `/${workspaceSlug.toString()}/drafts/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
      Icon: PenSquare,
    },
  ];

  const draftIssueCount = workspaceUserInfo[workspaceSlug.toString()]?.draft_issue_count;

  return (
    <div
      className={cn("flex flex-col gap-0.5", {
        "space-y-0": sidebarCollapsed,
      })}
    >
      {SIDEBAR_USER_MENU_ITEMS.map((item) => (
        <SidebarUserMenuItem key={item.key} item={item} draftIssueCount={draftIssueCount} />
      ))}
    </div>
  );
});
