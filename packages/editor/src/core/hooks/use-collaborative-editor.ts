import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import { useEffect, useMemo, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
// extensions
import { HeadingListExtension, SideMenuExtension } from "@/extensions";
// hooks
import { useEditor } from "@/hooks/use-editor";
// plane editor extensions
import { DocumentEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import { TCollaborativeEditorHookProps } from "@/types";

export const useCollaborativeEditor = (props: TCollaborativeEditorHookProps) => {
  const {
    onChange,
    onTransaction,
    disabledExtensions,
    editable,
    editorClassName = "",
    editorProps = {},
    embedHandler,
    extensions = [],
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    user,
  } = props;
  // states
  const [hasServerConnectionFailed, setHasServerConnectionFailed] = useState(false);
  const [hasServerSynced, setHasServerSynced] = useState(false);
  // initialize Hocuspocus provider
  const provider = useMemo(
    () =>
      new HocuspocusProvider({
        name: id,
        parameters: realtimeConfig.queryParams,
        // using user id as a token to verify the user on the server
        token: JSON.stringify(user),
        url: realtimeConfig.url,
        onAuthenticationFailed: () => {
          serverHandler?.onServerError?.();
          setHasServerConnectionFailed(true);
        },
        onConnect: () => serverHandler?.onConnect?.(),
        onClose: (data) => {
          if (data.event.code === 1006) {
            serverHandler?.onServerError?.();
            setHasServerConnectionFailed(true);
          }
        },
        onSynced: () => setHasServerSynced(true),
      }),
    [id, realtimeConfig, serverHandler, user]
  );

  const localProvider = useMemo(
    () => (id ? new IndexeddbPersistence(id, provider.document) : undefined),
    [id, provider]
  );

  // destroy and disconnect all providers connection on unmount
  useEffect(
    () => () => {
      provider?.destroy();
      localProvider?.destroy();
    },
    [provider, localProvider]
  );

  const editor = useEditor({
    disabledExtensions,
    id,
    editable,
    editorProps,
    editorClassName,
    enableHistory: false,
    extensions: [
      SideMenuExtension({
        aiEnabled: !disabledExtensions?.includes("ai"),
        dragDropEnabled: true,
      }),
      HeadingListExtension,
      Collaboration.configure({
        document: provider.document,
      }),
      ...extensions,
      ...DocumentEditorAdditionalExtensions({
        disabledExtensions,
        embedConfig: embedHandler,
        fileHandler,
        flaggedExtensions,
        provider,
        userDetails: user,
      }),
    ],
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    mentionHandler,
    onChange,
    onTransaction,
    placeholder,
    provider,
    tabIndex,
  });

  return {
    editor,
    hasServerConnectionFailed,
    hasServerSynced,
  };
};
