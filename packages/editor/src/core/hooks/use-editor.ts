import { DOMSerializer } from "@tiptap/pm/model";
import { useEditor as useTiptapEditor } from "@tiptap/react";
import { useImperativeHandle, useEffect } from "react";
import * as Y from "yjs";
// components
import { getEditorMenuItems } from "@/components/menus";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { CORE_EDITOR_META } from "@/constants/meta";
// extensions
import { CoreEditorExtensions } from "@/extensions";
// helpers
import { getParagraphCount } from "@/helpers/common";
import { getExtensionStorage } from "@/helpers/get-extension-storage";
import { insertContentAtSavedSelection } from "@/helpers/insert-content-at-cursor-position";
import { IMarking, scrollSummary, scrollToNodeViaDOMCoordinates } from "@/helpers/scroll-to-node";
// props
import { CoreEditorProps } from "@/props";
// types
import type { TDocumentEventsServer, TEditorCommands, TEditorHookProps } from "@/types";

export const useEditor = (props: TEditorHookProps) => {
  const {
    autofocus = false,
    disabledExtensions,
    editable = true,
    editorClassName = "",
    editorProps = {},
    enableHistory,
    extensions = [],
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id = "",
    initialValue,
    mentionHandler,
    onChange,
    onTransaction,
    placeholder,
    provider,
    tabIndex,
    value,
  } = props;

  const editor = useTiptapEditor(
    {
      editable,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      autofocus,
      parseOptions: { preserveWhitespace: true },
      editorProps: {
        ...CoreEditorProps({
          editorClassName,
        }),
        ...editorProps,
      },
      extensions: [
        ...CoreEditorExtensions({
          editable,
          disabledExtensions,
          enableHistory,
          fileHandler,
          flaggedExtensions,
          mentionHandler,
          placeholder,
          tabIndex,
        }),
        ...extensions,
      ],
      content: typeof initialValue === "string" && initialValue.trim() !== "" ? initialValue : "<p></p>",
      onCreate: () => handleEditorReady?.(true),
      onTransaction: () => {
        onTransaction?.();
      },
      onUpdate: ({ editor }) => onChange?.(editor.getJSON(), editor.getHTML()),
      onDestroy: () => handleEditorReady?.(false),
    },
    [editable]
  );

  // Effect for syncing SWR data
  useEffect(() => {
    // value is null when intentionally passed where syncing is not yet
    // supported and value is undefined when the data from swr is not populated
    if (value == null) return;
    if (editor) {
      const isUploadInProgress = getExtensionStorage(editor, CORE_EXTENSIONS.UTILITY)?.uploadInProgress;
      if (!editor.isDestroyed && !isUploadInProgress) {
        try {
          editor.commands.setContent(value, false, { preserveWhitespace: true });
          if (editor.state.selection) {
            const docLength = editor.state.doc.content.size;
            const relativePosition = Math.min(editor.state.selection.from, docLength - 1);
            editor.commands.setTextSelection(relativePosition);
          }
        } catch (error) {
          console.error("Error syncing editor content with external value:", error);
        }
      }
    }
  }, [editor, value, id]);

  // update assets upload status
  useEffect(() => {
    if (!editor) return;
    const assetsUploadStatus = fileHandler.assetsUploadStatus;
    editor.commands.updateAssetsUploadStatus?.(assetsUploadStatus);
  }, [editor, fileHandler.assetsUploadStatus]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      blur: () => editor?.commands.blur(),
      scrollToNodeViaDOMCoordinates(behavior?: ScrollBehavior, pos?: number) {
        const resolvedPos = pos ?? editor?.state.selection.from;
        if (!editor || !resolvedPos) return;
        scrollToNodeViaDOMCoordinates(editor, resolvedPos, behavior);
      },
      getCurrentCursorPosition: () => editor?.state.selection.from,
      clearEditor: (emitUpdate = false) => {
        editor?.chain().setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true).clearContent(emitUpdate).run();
      },
      setEditorValue: (content: string, emitUpdate = false) => {
        editor?.commands.setContent(content, emitUpdate, { preserveWhitespace: true });
      },
      setEditorValueAtCursorPosition: (content: string) => {
        if (editor?.state.selection) {
          insertContentAtSavedSelection(editor, content);
        }
      },
      executeMenuItemCommand: (props) => {
        const { itemKey } = props;
        const editorItems = getEditorMenuItems(editor);

        const getEditorMenuItem = (itemKey: TEditorCommands) => editorItems.find((item) => item.key === itemKey);

        const item = getEditorMenuItem(itemKey);
        if (item) {
          item.command(props);
        } else {
          console.warn(`No command found for item: ${itemKey}`);
        }
      },
      isMenuItemActive: (props) => {
        const { itemKey } = props;
        const editorItems = getEditorMenuItems(editor);

        const getEditorMenuItem = (itemKey: TEditorCommands) => editorItems.find((item) => item.key === itemKey);
        const item = getEditorMenuItem(itemKey);
        if (!item) return false;

        return item.isActive(props);
      },
      onHeadingChange: (callback: (headings: IMarking[]) => void) => {
        // Subscribe to update event emitted from headers extension
        editor?.on("update", () => {
          const headings = getExtensionStorage(editor, CORE_EXTENSIONS.HEADINGS_LIST)?.headings;
          if (headings) {
            callback(headings);
          }
        });
        // Return a function to unsubscribe to the continuous transactions of
        // the editor on unmounting the component that has subscribed to this
        // method
        return () => {
          editor?.off("update");
        };
      },
      getHeadings: () => (editor ? getExtensionStorage(editor, CORE_EXTENSIONS.HEADINGS_LIST)?.headings : []),
      onStateChange: (callback: () => void) => {
        // Subscribe to editor state changes
        editor?.on("transaction", () => {
          callback();
        });

        // Return a function to unsubscribe to the continuous transactions of
        // the editor on unmounting the component that has subscribed to this
        // method
        return () => {
          editor?.off("transaction");
        };
      },
      getMarkDown: (): string => {
        const markdownOutput = editor?.storage.markdown.getMarkdown();
        return markdownOutput;
      },
      getDocument: () => {
        const documentBinary = provider?.document ? Y.encodeStateAsUpdate(provider?.document) : null;
        const documentHTML = editor?.getHTML() ?? "<p></p>";
        const documentJSON = editor?.getJSON() ?? null;

        return {
          binary: documentBinary,
          html: documentHTML,
          json: documentJSON,
        };
      },
      scrollSummary: (marking: IMarking): void => {
        if (!editor) return;
        scrollSummary(editor, marking);
      },
      isEditorReadyToDiscard: () =>
        !!editor && getExtensionStorage(editor, CORE_EXTENSIONS.UTILITY)?.uploadInProgress === false,
      setFocusAtPosition: (position: number) => {
        if (!editor || editor.isDestroyed) {
          console.error("Editor reference is not available or has been destroyed.");
          return;
        }
        try {
          const docSize = editor.state.doc.content.size;
          const safePosition = Math.max(0, Math.min(position, docSize));
          editor
            .chain()
            .insertContentAt(safePosition, [{ type: CORE_EXTENSIONS.PARAGRAPH }])
            .focus()
            .run();
        } catch (error) {
          console.error("An error occurred while setting focus at position:", error);
        }
      },
      getSelectedText: () => {
        if (!editor) return null;

        const { state } = editor;
        const { from, to, empty } = state.selection;

        if (empty) return null;

        const nodesArray: string[] = [];
        state.doc.nodesBetween(from, to, (node, _pos, parent) => {
          if (parent === state.doc && editor) {
            const serializer = DOMSerializer.fromSchema(editor.schema);
            const dom = serializer.serializeNode(node);
            const tempDiv = document.createElement("div");
            tempDiv.appendChild(dom);
            nodesArray.push(tempDiv.innerHTML);
          }
        });
        const selection = nodesArray.join("");
        return selection;
      },
      insertText: (contentHTML, insertOnNextLine) => {
        if (!editor) return;
        const { from, to, empty } = editor.state.selection;
        if (empty) return;
        if (insertOnNextLine) {
          // move cursor to the end of the selection and insert a new line
          editor.chain().focus().setTextSelection(to).insertContent("<br />").insertContent(contentHTML).run();
        } else {
          // replace selected text with the content provided
          editor.chain().focus().deleteRange({ from, to }).insertContent(contentHTML).run();
        }
      },
      getDocumentInfo: () => ({
        characters: editor?.storage?.characterCount?.characters?.() ?? 0,
        paragraphs: getParagraphCount(editor?.state),
        words: editor?.storage?.characterCount?.words?.() ?? 0,
      }),
      setProviderDocument: (value) => {
        const document = provider?.document;
        if (!document) return;
        Y.applyUpdate(document, value);
      },
      emitRealTimeUpdate: (message: TDocumentEventsServer) => provider?.sendStateless(message),
      listenToRealTimeUpdate: () => provider && { on: provider.on.bind(provider), off: provider.off.bind(provider) },
    }),
    [editor]
  );

  if (!editor) {
    return null;
  }

  return editor;
};
