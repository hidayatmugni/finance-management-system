import { App, Button } from "antd";
import { useCallback, useMemo, useRef } from "react";

/**
 * Toast + confirm helpers built on Ant's App context (so they inherit the
 * theme and render inside the React tree rather than a detached root).
 *
 * `undoable` is the important one: destructive actions run optimistically and
 * stay reversible for a few seconds instead of interrupting the user with a
 * confirmation modal.
 */
export function useToast() {
  const { message, notification, modal } = App.useApp();
  const undoTimers = useRef(new Map());

  const success = useCallback((content) => message.success(content), [message]);
  const error = useCallback((content) => message.error(content), [message]);
  const info = useCallback((content) => message.info(content), [message]);
  const warning = useCallback((content) => message.warning(content), [message]);

  const loading = useCallback(
    (content, key = "loading") => {
      message.open({ type: "loading", content, key, duration: 0 });
      return {
        done: (doneContent) => message.open({ type: "success", content: doneContent, key, duration: 2 }),
        fail: (failContent) => message.open({ type: "error", content: failContent, key, duration: 3 })
      };
    },
    [message],
  );

  /**
   * Runs `commit` after `timeoutMs` unless the user hits Undo, in which case
   * `rollback` runs instead. The caller is expected to have already applied the
   * change to local state (optimistic UI).
   */
  const undoable = useCallback(
    ({ description, commit, rollback, timeoutMs = 5000, undoLabel = "Urungkan" }) => {
      const key = `undo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const finish = async () => {
        undoTimers.current.delete(key);
        notification.destroy(key);
        try {
          await commit();
        } catch (commitError) {
          rollback?.();
          message.error(
            commitError instanceof Error ? commitError.message : "Perubahan gagal disimpan.",
          );
        }
      };

      const timerId = window.setTimeout(finish, timeoutMs);
      undoTimers.current.set(key, timerId);

      notification.open({
        key,
        message: description,
        duration: timeoutMs / 1000,
        placement: "bottomRight",
        closeIcon: null,
        actions: (
          <Button
            size="small"
            type="link"
            onClick={() => {
              window.clearTimeout(undoTimers.current.get(key));
              undoTimers.current.delete(key);
              notification.destroy(key);
              rollback?.();
            }}
          >
            {undoLabel}
          </Button>
        )
      });

      return { commitNow: finish };
    },
    [notification, message],
  );

  /** Confirmation dialog for actions that genuinely cannot be undone. */
  const confirm = useCallback(
    ({
      title,
      content,
      okText = "Lanjutkan",
      cancelText = "Batal",
      danger = false,
      onOk
    }) =>
      new Promise((resolve) => {
        modal.confirm({
          title,
          content,
          okText,
          cancelText,
          okButtonProps: { danger },
          centered: true,
          async onOk() {
            await onOk?.();
            resolve(true);
          },
          onCancel() {
            resolve(false);
          }
        });
      }),
    [modal],
  );

  return useMemo(
    () => ({ success, error, info, warning, loading, undoable, confirm }),
    [success, error, info, warning, loading, undoable, confirm],
  );
}
