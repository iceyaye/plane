import { observer } from "mobx-react";
import { Search } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useAppTheme, useCommandPalette } from "@/hooks/store";

export const AppSearch = observer(() => {
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { toggleCommandPaletteModal } = useCommandPalette();
  // translation
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={cn(
        "flex-shrink-0 size-8 aspect-square grid place-items-center rounded hover:bg-custom-sidebar-background-90 outline-none",
        {
          "border-[0.5px] border-custom-sidebar-border-300": !sidebarCollapsed,
        }
      )}
      onClick={() => toggleCommandPaletteModal(true)}
      aria-label={t("aria_labels.projects_sidebar.open_command_palette")}
    >
      <Search className="size-4 text-custom-sidebar-text-300" />
    </button>
  );
});
