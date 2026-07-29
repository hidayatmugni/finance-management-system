import { BulbOutlined, CheckCircleFilled, HistoryOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Segmented, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useConfigSection, useFormatters } from "../../shared/config/useAppConfig";
import { useCatalogue } from "../../shared/data/useCatalogue";
import { useMutations } from "../../shared/data/useMutations";
import { useFormDraft } from "../../shared/hooks/useFormDraft";
import { formatCombo, useHotkeys } from "../../shared/hooks/useHotkeys";
import { useDebounce } from "../../shared/hooks/useResponsive";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { useAuth } from "../auth/AuthProvider";
import {
  Badge,
  Card,
  EmptyState,
  Field,
  Money,
  MoneyField,
  PageHeader,
  SearchSelect,
  useToast
} from "../../shared/ui";
import { frequentAmounts, suggestCategory } from "../../shared/utils/finance";

/** Stable identity so the draft effect isn't re-armed on every render. */
function isDraftEmpty(values) {
  return !values.amount && !values.note && !values.categoryId;
}

/**
 * Quick transaction entry.
 *
 * Optimised for the single most repeated task in the app:
 *  - opens with type, date and member already filled in;
 *  - amount is focused immediately, and accepts `25k` / `1,5jt` shorthand;
 *  - the category is suggested from the note using past entries;
 *  - Ctrl/⌘+Enter saves and keeps the form open for the next one;
 *  - anything half-typed is kept as a draft if the page is closed.
 *
 * Which fields appear at all is decided by the CMS (`forms.transaction`).
 */
export function QuickAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const mutations = useMutations();
  const formatters = useFormatters();
  const catalogue = useCatalogue();
  const { user, profile } = useAuth();

  const general = useConfigSection("general");
  const formConfig = useConfigSection("forms").transaction;
  const transactions = useFinanceStore((state) => state.transactions);

  const amountRef = useRef(null);

  const fields = useMemo(
    () => formConfig.fields.filter((field) => field.visible !== false),
    [formConfig.fields],
  );
  const isVisible = (name) => fields.some((field) => field.name === name);
  const isRequired = (name) => fields.find((field) => field.name === name)?.required;

  const defaultType =
    searchParams.get("type") || catalogue.transactionTypes[0]?.id || "expense";

  const buildInitialValues = () => ({
    type: defaultType,
    amount: null,
    categoryId: "",
    note: "",
    date: dayjs().format("YYYY-MM-DD"),
    accountId: catalogue.accounts[0]?.id || "",
    userId: user?.uid || ""
  });

  const [values, setValues] = useState(buildInitialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const { draft, clearDraft, dismissRestore } = useFormDraft("transaction", values, {
    enabled: formConfig.autoSaveDraft !== false,
    isEmpty: isDraftEmpty
  });

  const debouncedNote = useDebounce(values.note, 400);

  /** Categories valid for the chosen type. */
  const categoryOptions = useMemo(
    () => catalogue.categoryOptions(values.type),
    [catalogue, values.type],
  );

  /** Amounts this user enters most often, offered as one-tap chips. */
  const quickAmounts = useMemo(() => {
    const learned = frequentAmounts(transactions, values.type, 4);
    return learned.length >= 2 ? learned : general.quickAmounts;
  }, [transactions, values.type, general.quickAmounts]);

  const suggestion = useMemo(() => {
    if (formConfig.smartSuggestion === false) return null;
    if (values.categoryId) return null;

    const match = suggestCategory(debouncedNote, transactions, values.type);
    if (!match) return null;

    const category = catalogue.getCategory(match.categoryId);
    return category ? { ...match, category } : null;
  }, [debouncedNote, transactions, values.type, values.categoryId, catalogue, formConfig.smartSuggestion]);

  // Clear a category that doesn't belong to the newly chosen type.
  useEffect(() => {
    if (!values.categoryId) return;
    const stillValid = categoryOptions.some((option) => option.value === values.categoryId);
    if (!stillValid) setValues((current) => ({ ...current, categoryId: "" }));
  }, [categoryOptions, values.categoryId]);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const validate = (candidate) => {
    const nextErrors = {};

    if (!candidate.amount || Number(candidate.amount) <= 0) {
      nextErrors.amount = "Isi nominal lebih dari 0.";
    }
    if (isRequired("categoryId") && !candidate.categoryId) {
      nextErrors.categoryId = "Pilih kategori.";
    }
    if (isRequired("note") && !candidate.note.trim()) {
      nextErrors.note = "Keterangan wajib diisi.";
    }
    if (!candidate.date) {
      nextErrors.date = "Pilih tanggal.";
    }

    return nextErrors;
  };

  const patch = (values_) => {
    setValues((current) => {
      const next = { ...current, ...values_ };
      if (Object.keys(errors).length > 0) setErrors(validate(next));
      return next;
    });
  };

  const handleSubmit = async ({ keepOpen = formConfig.keepOpenAfterSave !== false } = {}) => {
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.warning("Periksa isian yang ditandai merah.");
      return;
    }

    const category = catalogue.getCategory(values.categoryId);
    const note = values.note.trim();

    const payload = {
      type: values.type,
      amount: Number(values.amount),
      categoryId: values.categoryId || null,
      categoryName: category?.name || null,
      note,
      title: note || category?.name || catalogue.getTypeLabel(values.type),
      date: values.date,
      accountId: isVisible("accountId") ? values.accountId || null : null,
      userId: values.userId || user?.uid || null,
      memberName: profile?.fullName || user?.displayName || user?.email || null,
      sourceModule: "quick-add"
    };

    setSubmitting(true);
    const outcome = await mutations.create("transactions", payload, {
      context: "transaksi",
      successMessage: `${catalogue.getTypeLabel(values.type)} ${formatters.currency(payload.amount)} tersimpan.`
    });
    setSubmitting(false);

    if (!outcome.ok) return;

    clearDraft();
    setSavedCount((count) => count + 1);

    if (keepOpen) {
      // Keep type and date — the next entry is usually the same day.
      setValues((current) => ({
        ...current,
        amount: null,
        categoryId: "",
        note: ""
      }));
      amountRef.current?.focus();
    } else {
      navigate("/dashboard/transactions");
    }
  };

  useHotkeys({
    "mod+enter": () => {
      if (!submitting) handleSubmit();
    },
    "mod+shift+s": () => {
      if (!submitting) handleSubmit({ keepOpen: false });
    }
  });

  if (catalogue.isEmpty) {
    return (
      <div className="animate-fade-in">
        <PageHeader eyebrow="Catat" title="Input cepat" />
        <Card padding="none">
          <EmptyState
            title="Buat kategori terlebih dahulu"
            description="Transaksi dikelompokkan per kategori. Buat beberapa kategori sesuai kebiasaan Anda, lalu kembali ke sini — prosesnya cuma sekali."
            action={
              <Link to="/dashboard/categories">
                <Button type="primary">Kelola kategori</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Catat"
        title="Input cepat"
        description={`Simpan dengan ${formatCombo("mod+enter")} — form tetap terbuka untuk catatan berikutnya.`}
        actions={
          savedCount > 0 ? (
            <Badge tone="success" icon={<CheckCircleFilled />}>
              {savedCount} tersimpan sesi ini
            </Badge>
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-2xl">
        {draft ? (
          <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 border-primary-border bg-primary-soft p-3.5">
            <div className="flex min-w-0 items-center gap-2">
              <HistoryOutlined className="text-primary-ink" />
              <Typography.Text className="!text-small !text-ink">
                Ada isian yang belum sempat disimpan dari{" "}
                {dayjs(draft.savedAt).format("DD MMM, HH:mm")}.
              </Typography.Text>
            </div>
            <div className="flex gap-2">
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  setValues((current) => ({ ...current, ...draft.values }));
                  dismissRestore();
                }}
              >
                Pulihkan
              </Button>
              <Button size="small" onClick={clearDraft}>
                Buang
              </Button>
            </div>
          </Card>
        ) : null}

        <Card className="p-4 md:p-5">
          <div className="space-y-4">
            {isVisible("type") ? (
              <Segmented
                block
                className="ds-segmented-lg"
                value={values.type}
                onChange={(value) => patch({ type: value })}
                options={catalogue.transactionTypes.map((type) => ({
                  label: type.label,
                  value: type.id
                }))}
              />
            ) : null}

            <Field label="Nominal" required error={errors.amount}>
              <MoneyField
                ref={amountRef}
                value={values.amount}
                onChange={(value) => patch({ amount: value })}
                currencySymbol={general.currencySymbol}
                locale={general.locale}
                quickAmounts={quickAmounts}
                status={errors.amount ? "error" : undefined}
                onPressEnter={() => handleSubmit()}
              />
            </Field>

            {isVisible("note") ? (
              <Field
                label="Keterangan"
                optional={!isRequired("note")}
                error={errors.note}
                hint="Ketik dulu keterangannya — kategori bisa disarankan otomatis."
              >
                <Input
                  size="large"
                  value={values.note}
                  onChange={(event) => patch({ note: event.target.value })}
                  placeholder={
                    fields.find((field) => field.name === "note")?.placeholder ||
                    "Contoh: belanja mingguan"
                  }
                  status={errors.note ? "error" : undefined}
                  maxLength={120}
                />
              </Field>
            ) : null}

            {isVisible("categoryId") ? (
              <Field
                label="Kategori"
                required={isRequired("categoryId")}
                error={errors.categoryId}
                labelExtra={
                  suggestion ? (
                    <button
                      type="button"
                      onClick={() => patch({ categoryId: suggestion.category.id })}
                      className="flex items-center gap-1 text-caption font-medium text-primary-ink"
                    >
                      <BulbOutlined />
                      Pakai &ldquo;{suggestion.category.name}&rdquo;
                    </button>
                  ) : null
                }
              >
                <SearchSelect
                  options={categoryOptions}
                  value={values.categoryId}
                  onChange={(value) => patch({ categoryId: value })}
                  status={errors.categoryId ? "error" : undefined}
                  placeholder="Ketik untuk mencari kategori"
                  allowClear
                />
              </Field>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {isVisible("date") ? (
                <Field label="Tanggal" required error={errors.date}>
                  <DatePicker
                    size="large"
                    className="!w-full"
                    format={general.dateFormat}
                    allowClear={false}
                    value={values.date ? dayjs(values.date) : null}
                    onChange={(value) => patch({ date: value ? value.format("YYYY-MM-DD") : "" })}
                    presets={[
                      { label: "Hari ini", value: dayjs() },
                      { label: "Kemarin", value: dayjs().subtract(1, "day") }
                    ]}
                  />
                </Field>
              ) : null}

              {isVisible("accountId") ? (
                <Field label="Sumber dana" optional={!isRequired("accountId")}>
                  <SearchSelect
                    options={catalogue.accountOptions}
                    value={values.accountId}
                    onChange={(value) => patch({ accountId: value })}
                    placeholder="Pilih dompet"
                    allowClear
                  />
                </Field>
              ) : null}

              {isVisible("userId") ? (
                <Field label="Dicatat oleh" optional>
                  <SearchSelect
                    options={catalogue.memberOptions}
                    value={values.userId}
                    onChange={(value) => patch({ userId: value })}
                    placeholder="Pilih anggota"
                  />
                </Field>
              ) : null}
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <Typography.Text className="!text-small !text-muted">Akan disimpan</Typography.Text>
              <Money
                value={Number(values.amount) || 0}
                type={values.type}
                className="!text-title"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="primary"
                size="large"
                block
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={() => handleSubmit()}
              >
                Simpan &amp; catat lagi
              </Button>
              <Button
                size="large"
                block
                loading={submitting}
                onClick={() => handleSubmit({ keepOpen: false })}
              >
                Simpan &amp; tutup
              </Button>
            </div>

            <Typography.Text className="!mt-3 !block !text-center !text-caption !text-muted">
              {formatCombo("mod+enter")} simpan · {formatCombo("mod+shift+s")} simpan &amp; tutup
            </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
