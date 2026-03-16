'use client';

type DeleteReelDialogProps = {
  open: boolean;
  title?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function DeleteReelDialog({
  open,
  title,
  submitting = false,
  onClose,
  onConfirm,
}: DeleteReelDialogProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Закрыть подтверждение удаления"
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/40"
      />
      <div className="fixed inset-x-0 top-[12%] z-[61] mx-auto w-[calc(100%-32px)] max-w-lg rounded-[24px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <h3 className="text-xl font-bold text-[#101828]">Удалить рилс?</h3>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Рилс
          {title ? ` «${title}»` : ''}
          {' '}будет удалён без возможности восстановления.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-[#D0D5DD] px-4 py-2.5 text-sm font-medium text-[#344054]"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={submitting}
            className="rounded-xl bg-[#D92D20] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </>
  );
}
