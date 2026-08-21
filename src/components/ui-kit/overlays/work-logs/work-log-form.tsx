"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Select } from "@/components/ui-kit/forms/select";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { HOURS_OPTIONS } from "@/features/work-logs/types";
import { useLanguage } from "@/i18n/provider";

interface WorkLogFormProps {
  taskId: string;
  onSubmit: () => void;
  onClose: () => void;
}

export function WorkLogForm({ taskId, onSubmit, onClose }: WorkLogFormProps) {
  const language = useLanguage();
  const t = language === "FA" ? formTranslations.fa : formTranslations.en;
  const dateLocale = language === "EN" ? "en-US" : "fa-IR";

  const form = useForm<{
    hours: string;
    date: string;
    description: string;
  }>({
    defaultValues: {
      hours: "1",
      date: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  const isPending = React.useRef(false);

  const handleSubmit = async (data: { hours: string; date: string; description: string }) => {
    if (isPending.current) return;
    isPending.current = true;

    try {
      const formData = new FormData();
      formData.append("taskId", taskId);
      formData.append("hours", data.hours);
      formData.append("date", data.date);
      if (data.description) formData.append("description", data.description);

      const response = await fetch("/api/work-logs", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        onSubmit();
        onClose();
      } else {
        form.setError("hours", { message: result.error || "Failed to create work log" });
      }
    } catch {
      form.setError("hours", { message: "An error occurred" });
    } finally {
      isPending.current = false;
    }
  };

  const hoursOptions = HOURS_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }));

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="py-2 flex flex-col gap-4">
      <Controller
        name="hours"
        control={form.control}
        render={({ field, fieldState }) => (
          <Select
            {...field}
            label={t.hours}
            options={hoursOptions}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name="date"
        control={form.control}
        render={({ field, fieldState }) => {
          const value = field.value ? new Date(field.value) : null;
          return (
            <DatePicker
              value={value}
              onChange={date => {
                field.onChange(date ? date.toISOString().split("T")[0] : "");
              }}
              mode="single"
              label={t.date}
              error={fieldState.error?.message}
            />
          );
        }}
      />

      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Textarea
            {...field}
            label={t.description}
            placeholder={t.descriptionPlaceholder}
            error={fieldState.error?.message}
            rows={3}
          />
        )}
      />

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="ghost" onClick={onClose} disabled={isPending.current}>
          {t.cancel}
        </Button>
        <Button variant="primary" type="submit" loading={isPending.current}>
          {t.save}
        </Button>
      </div>
    </form>
  );
}

const formTranslations = {
  en: {
    hours: "Hours",
    date: "Date",
    description: "Description",
    descriptionPlaceholder: "What did you work on?",
    cancel: "Cancel",
    save: "Save",
  },
  fa: {
    hours: "ساعت‌ها",
    date: "تاریخ",
    description: "توضیحات",
    descriptionPlaceholder: "چه کاری انجام دادید؟",
    cancel: "انصراف",
    save: "ذخیره",
  },
};