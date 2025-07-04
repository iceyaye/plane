"use client";

import React, { useEffect, useState, useCallback } from "react";
// plane imports
import { TOOLBAR_ITEMS, ToolbarMenuItem, EditorRefApi } from "@plane/editor";
import { Button, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  executeCommand: (item: ToolbarMenuItem) => void;
  handleSubmit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isCommentEmpty: boolean;
  isSubmitting: boolean;
  showSubmitButton: boolean;
  editorRef: EditorRefApi | null;
};

const toolbarItems = TOOLBAR_ITEMS.lite;

export const IssueCommentToolbar: React.FC<Props> = (props) => {
  const { executeCommand, handleSubmit, isCommentEmpty, editorRef, isSubmitting, showSubmitButton } = props;
  // states
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});

  // Function to update active states
  const updateActiveStates = useCallback(() => {
    if (!editorRef) return;
    const newActiveStates: Record<string, boolean> = {};
    Object.values(toolbarItems)
      .flat()
      .forEach((item) => {
        // TODO: update this while toolbar homogenization
        // @ts-expect-error type mismatch here
        newActiveStates[item.renderKey] = editorRef.isMenuItemActive({
          itemKey: item.itemKey,
          ...item.extraProps,
        });
      });
    setActiveStates(newActiveStates);
  }, [editorRef]);

  // useEffect to call updateActiveStates when isActive prop changes
  useEffect(() => {
    if (!editorRef) return;
    const unsubscribe = editorRef.onStateChange(updateActiveStates);
    updateActiveStates();
    return () => unsubscribe();
  }, [editorRef, updateActiveStates]);

  return (
    <div className="flex h-9 w-full items-stretch gap-1.5 bg-custom-background-90 overflow-x-scroll">
      <div className="flex w-full items-stretch justify-between gap-2 rounded border-[0.5px] border-custom-border-200 p-1">
        <div className="flex items-stretch">
          {Object.keys(toolbarItems).map((key, index) => (
            <div
              key={key}
              className={cn("flex items-stretch gap-0.5 border-r border-custom-border-200 px-2.5", {
                "pl-0": index === 0,
              })}
            >
              {toolbarItems[key].map((item) => {
                const isItemActive = activeStates[item.renderKey];

                return (
                  <Tooltip
                    key={item.renderKey}
                    tooltipContent={
                      <p className="flex flex-col gap-1 text-center text-xs">
                        <span className="font-medium">{item.name}</span>
                        {item.shortcut && <kbd className="text-custom-text-400">{item.shortcut.join(" + ")}</kbd>}
                      </p>
                    }
                  >
                    <button
                      type="button"
                      onClick={() => executeCommand(item)}
                      className={cn(
                        "grid place-items-center aspect-square rounded-sm p-0.5 text-custom-text-400 hover:bg-custom-background-80",
                        {
                          "bg-custom-background-80 text-custom-text-100": isItemActive,
                        }
                      )}
                    >
                      <item.icon
                        className={cn("h-3.5 w-3.5", {
                          "text-custom-text-100": isItemActive,
                        })}
                        strokeWidth={2.5}
                      />
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
        {showSubmitButton && (
          <div className="sticky right-1">
            <Button
              type="button"
              variant="primary"
              className="px-2.5 py-1.5 text-xs"
              onClick={handleSubmit}
              disabled={isCommentEmpty}
              loading={isSubmitting}
            >
              Comment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
