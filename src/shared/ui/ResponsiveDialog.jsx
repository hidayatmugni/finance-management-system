import { Button, Drawer, Modal } from "antd";
import { useResponsive } from "../hooks/useResponsive";
import { useHotkeys } from "../hooks/useHotkeys";

/**
 * One dialog API, two presentations: a centred modal on desktop and a bottom
 * sheet on mobile (reachable with a thumb, dismissible by tapping the mask).
 *
 * Cmd/Ctrl+Enter always confirms, so a keyboard user never reaches for the
 * mouse to submit.
 */
export function ResponsiveDialog({
  open,
  onClose,
  onSubmit,
  title,
  description,
  children,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  submitting = false,
  danger = false,
  width = 520,
  footer,
  destroyOnClose = true
}) {
  const { isMobile } = useResponsive();

  useHotkeys(
    {
      "mod+enter": () => {
        if (open && onSubmit && !submitting) onSubmit();
      }
    },
    { enabled: open },
  );

  const defaultFooter = onSubmit ? (
    <div className="flex items-center justify-end gap-2">
      <Button onClick={onClose} disabled={submitting}>
        {cancelLabel}
      </Button>
      <Button type="primary" danger={danger} loading={submitting} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
  ) : null;

  const resolvedFooter = footer === undefined ? defaultFooter : footer;

  const body = (
    <div className="space-y-4">
      {description ? <p className="!mb-0 text-[13px] leading-6 text-muted">{description}</p> : null}
      {children}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={title}
        placement="bottom"
        height="auto"
        destroyOnHidden={destroyOnClose}
        styles={{
          content: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
          body: { paddingBottom: 16, maxHeight: "70vh" }
        }}
        footer={resolvedFooter ? <div className="safe-bottom">{resolvedFooter}</div> : null}
      >
        {body}
      </Drawer>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={title}
      width={width}
      footer={resolvedFooter}
      destroyOnHidden={destroyOnClose}
      maskClosable={!submitting}
    >
      {body}
    </Modal>
  );
}
