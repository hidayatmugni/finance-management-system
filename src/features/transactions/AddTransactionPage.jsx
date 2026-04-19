import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Card, DatePicker, Form, Input, InputNumber, Radio, Select, Space, Typography } from "antd";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { enqueueOfflineMutation } from "../../shared/lib/offlineQueue";
import { createTransaction } from "../../shared/firebase/firestoreTransactions";
import { useAuth } from "../auth/AuthProvider";
import { EmptyState } from "../../shared/components/EmptyState";
import {
  getKategoriByJenis,
  getKategoriName,
  getJenisLabel,
  JENIS_ARUS_KAS,
  PILIHAN_JENIS_ARUS_KAS
} from "../../shared/config/cashflow";

const transactionSchema = z.object({
  type: z.string().min(1),
  amount: z.coerce.number().min(1, "Nominal wajib diisi"),
  userId: z.string().min(1),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  date: z.string().min(1),
  note: z.string().optional()
});

export function AddTransactionPage() {
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const family = useFinanceStore((state) => state.family);
  const members = useFinanceStore((state) => state.members);
  const { user } = useAuth();
  const [submitAlert, setSubmitAlert] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: JENIS_ARUS_KAS.PENGELUARAN,
      amount: "",
      userId: user?.uid || "",
      categoryId: "makan",
      date: new Date().toISOString().slice(0, 10),
      note: ""
    }
  });

  const selectedType = watch("type");
  const selectedCategoryId = watch("categoryId");
  const availableCategories = getKategoriByJenis(selectedType);

  useEffect(() => {
    if (user?.uid && members.some((member) => member.id === user.uid)) {
      setValue("userId", user.uid);
    }
  }, [members, setValue, user?.uid]);

  useEffect(() => {
    const firstCategory = availableCategories[0]?.id || "";
    if (!availableCategories.some((item) => item.id === selectedCategoryId)) {
      setValue("categoryId", firstCategory);
    }
  }, [availableCategories, selectedCategoryId, setValue]);

  const onSubmit = async (values) => {
    setSubmitAlert(null);
    try {
      const member = members.find((item) => item.id === values.userId);
      const cleanNote = values.note?.trim() || "";
      const transactionPayload = {
        familyId: family.id,
        userId: values.userId,
        createdBy: user?.uid || values.userId,
        ownershipType: "shared",
        type: values.type,
        categoryId: values.categoryId,
        accountId: null,
        amount: values.amount,
        date: values.date,
        note: cleanNote,
        tags: [],
        syncStatus: navigator.onLine ? "synced" : "pending",
        title: cleanNote || getKategoriName(values.categoryId),
        memberName: member?.fullName || member?.name || "Tanpa nama",
        categoryName: getKategoriName(values.categoryId),
        sourceModule: "cashflow"
      };

      if (navigator.onLine) {
        await createTransaction({
          familyId: family.id,
          payload: transactionPayload
        });
        setSubmitAlert({
          type: "success",
          title: "Transaksi berhasil disimpan."
        });
      } else {
        addTransaction({
          id: crypto.randomUUID(),
          ...transactionPayload
        });
        await enqueueOfflineMutation({
          entityType: "transaction",
          action: "create",
          body: transactionPayload
        });
        setSubmitAlert({
          type: "info",
          title: "Transaksi disimpan offline dan menunggu sinkronisasi."
        });
      }

      reset({
        type: values.type,
        amount: "",
        userId: user?.uid || values.userId,
        categoryId: getKategoriByJenis(values.type)[0]?.id || "",
        date: new Date().toISOString().slice(0, 10),
        note: ""
      });
    } catch (error) {
      setSubmitAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Gagal menyimpan transaksi."
      });
    }
  };

  if (!family?.id) {
    return (
      <EmptyState
        title="Data keluarga belum siap"
        description="Sesi login aktif, tetapi data keluarga belum selesai dimuat."
      />
    );
  }

  if (!members.length) {
    return (
      <EmptyState
        title="Data anggota belum tersedia"
        description="Anggota keluarga belum termuat. Coba muat ulang halaman setelah login."
      />
    );
  }

  return (
    <div className="space-y-3">
      <Card className="finance-card finance-soft-card">
        <Space orientation="vertical" size={6} className="w-full">
          <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Input Harian
          </Typography.Text>
          <Typography.Title level={3} className="!m-0 !text-lg !font-extrabold">
            Input pemasukan dan pengeluaran dengan cepat
          </Typography.Title>
          <Typography.Paragraph className="!m-0 !text-xs !leading-5 !text-muted">
            Cukup pilih jenis, pilih kategori, isi nominal, lalu beri keterangan singkat.
          </Typography.Paragraph>
        </Space>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          {submitAlert ? (
            <Alert
              type={submitAlert.type}
              showIcon
              title={submitAlert.title}
              closable={{ closeIcon: true, onClose: () => setSubmitAlert(null), "aria-label": "close" }}
            />
          ) : null}
          <Form layout="vertical" component={false}>
            <Form.Item label="Jenis arus kas">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Radio.Group
                    {...field}
                    optionType="button"
                    buttonStyle="solid"
                    className="finance-type-toggle"
                    options={PILIHAN_JENIS_ARUS_KAS.map((option) => ({
                      label: option.label,
                      value: option.value
                    }))}
                  />
                )}
              />
            </Form.Item>

            <Field label="Kategori" error={errors.categoryId?.message}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="large"
                    options={availableCategories.map((category) => ({
                      value: category.id,
                      label: category.name
                    }))}
                  />
                )}
              />
            </Field>

            <Field label="Nominal" error={errors.amount?.message}>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    size="large"
                    className="!w-full"
                    min={0}
                    placeholder="Contoh: 150000"
                    controls={false}
                    formatter={(value) =>
                      value ? `Rp ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : ""
                    }
                    parser={(value) => value?.replace(/Rp\s?/g, "").replace(/\./g, "") || ""}
                  />
                )}
              />
            </Field>

            <Field label="Keterangan" error={errors.note?.message}>
              <Input.TextArea
                {...register("note")}
                autoSize={{ minRows: 3, maxRows: 5 }}
                placeholder={`Contoh: ${selectedType === JENIS_ARUS_KAS.PENGELUARAN ? "Belanja sayur dan lauk untuk hari ini" : "Bayaran proyek desain bulan ini"}`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Tanggal">
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      size="large"
                      className="!w-full"
                      format="DD MMM YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(value) => field.onChange(value ? value.format("YYYY-MM-DD") : "")}
                    />
                  )}
                />
              </Field>

              <Field label="Diinput oleh">
                <Controller
                  name="userId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      size="large"
                      options={members.map((member) => ({
                        value: member.id,
                        label: member.fullName || member.name
                      }))}
                    />
                  )}
                />
              </Field>
            </div>
          </Form>

          <Card size="small" className="finance-soft-card">
            <Typography.Text className="text-xs uppercase tracking-[0.16em] text-muted">Ringkasan</Typography.Text>
            <Typography.Text className="mt-1 block text-sm font-semibold text-ink">
              {getJenisLabel(selectedType)} - {getKategoriName(selectedCategoryId)}
            </Typography.Text>
          </Card>

          <Button type="primary" htmlType="submit" loading={isSubmitting} size="large" block>
            Simpan input harian
          </Button>

          <Alert
            type="info"
            showIcon
            title="Saat offline, data tetap disimpan lokal dan akan ditandai menunggu sinkronisasi."
            closable={{ closeIcon: true, "aria-label": "close" }}
          />
        </form>
      </Card>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <Form.Item
      label={<span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>}
      validateStatus={error ? "error" : ""}
      help={error || null}
      className="!mb-0"
    >
      {children}
    </Form.Item>
  );
}
