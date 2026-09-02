"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Avatar, AvatarGroup } from "@/components/ui-kit/data-display/avatar";
import { AvatarStack } from "@/components/ui-kit/data-display/avatar-stack";
import { Skeleton } from "@/components/ui-kit/feedback/skeleton";
import { ProgressBar } from "@/components/ui-kit/feedback/progress-bar";
import {
  Tooltip,
  TooltipProvider,
} from "@/components/ui-kit/data-display/tooltip";
import { Separator } from "@/components/ui-kit/data-display/separator";
import { Tag } from "@/components/ui-kit/data-display/tag";
import { EmptyState } from "@/components/ui-kit/feedback/empty-state";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Select } from "@/components/ui-kit/forms/select";
import { Checkbox } from "@/components/ui-kit/forms/checkbox";
import { Switch } from "@/components/ui-kit/forms/switch";
import { RadioGroup } from "@/components/ui-kit/forms/radio";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { CommandPalette } from "@/components/ui-kit/overlays/command-palette";
import { Tabs } from "@/components/ui-kit/navigation/tabs";
import { Breadcrumb } from "@/components/ui-kit/navigation/breadcrumb";
import { toast } from "@/components/ui-kit/feedback/toast";
import type { MenuItem } from "@/components/ui-kit/overlays/menu";
import type { TabItem } from "@/components/ui-kit/navigation/tabs";
import type { CrumbItem } from "@/components/ui-kit/navigation/breadcrumb";
import type { CommandGroup } from "@/components/ui-kit/overlays/command-palette";
import { ScrollArea } from "@/components/ui-kit/data-display/scroll-area";
import { Icon } from "@/components/ui-kit/foundation/icon";

import { DatePicker as ShadcnDatepicker } from "@/components/ui/datepicker";

import { Switch as ShadcnSwitch } from "@/components/ui/switch";
import { CalendarPersian } from "@/components/ui/calendar-persian";
import { sendMessage } from "@/lib/bale/handlers";

const baseUrl = "https://tapi.bale.ai/bot";
const token = "446736531:LqRlOM6ECJDqgocQ6qPXPv_EdruKgB6yVwM";

export default function Page() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [tabVal, setTabVal] = React.useState("tab1");
  const [selVal, setSelVal] = React.useState("option1");
  const [baleChatId, setBaleChatId] = React.useState("@scrumflow_updates_test");
  const [baleMessage, setBaleMessage] = React.useState(
    "Test message from ScrumFlow 🚀",
  );
  const [baleResult, setBaleResult] = React.useState<{
    success: boolean;
    error?: string;
  } | null>(null);
  const [baleLoading, setBaleLoading] = React.useState(false);
  const [dateVal, setDateVal] = React.useState<Date | null>(null);
  const [dateRangeVal, setDateRangeVal] = React.useState<{
    from: Date | null;
    to: Date | null;
  } | null>(null);
  const [dateDropdownVal, setDateDropdownVal] = React.useState<Date | null>(
    null,
  );
  const [dateTimeVal, setDateTimeVal] = React.useState<Date | null>(null);
  const [dateRangeDropdownVal, setDateRangeDropdownVal] = React.useState<{
    from: Date | null;
    to: Date | null;
  } | null>(null);
  const [progress, setProgress] = React.useState(45);
  const [textVal, setTextVal] = React.useState("");

  const menuItems: MenuItem[] = [
    { label: "ویرایش", icon: "pencil", onClick: () => {} },
    { label: "کپی", icon: "copy", onClick: () => {} },
    { divider: true },
    { label: "حذف", icon: "trash", danger: true, onClick: () => {} },
  ];

  const tabs: TabItem[] = [
    { value: "tab1", label: "فعال", count: 12 },
    { value: "tab2", label: "پایان‌یافته", count: 5 },
    { value: "tab3", label: "بایگانی", icon: "archive" },
  ];

  const crumbs: CrumbItem[] = [
    { label: "پروژه‌ها", href: "#" },
    { label: "اسکرام‌فلو", href: "#" },
    { label: "اسکرام‌فلو", href: "#" },
    { label: "اسکرام‌فلو", href: "#" },
    { label: "اسکرام‌فلو", href: "#" },
    { label: "اسکرام‌فلو", href: "#" },
    { label: "اسکرام‌فلو", href: "#" },
    { label: "اسکرام‌فلو", href: "#" },
    { label: "اسکرام‌فلو", href: "#" },
    { label: "تنظیمات" },
  ];

  const cmdGroups: CommandGroup[] = [
    {
      label: "پیمایش",
      items: [
        {
          label: "داشبورد",
          icon: "layout-dashboard",
          meta: "G+D",
          onSelect: () => setCmdOpen(false),
        },
        {
          label: "تسک‌ها",
          icon: "list",
          meta: "G+T",
          onSelect: () => setCmdOpen(false),
        },
        {
          label: "تنظیمات",
          icon: "settings",
          meta: "G+S",
          onSelect: () => setCmdOpen(false),
        },
      ],
    },
    {
      label: "عملیات",
      items: [
        {
          label: "تسک جدید",
          icon: "plus",
          kbd: "C",
          onSelect: () => setCmdOpen(false),
        },
        {
          label: "آپلود فایل",
          icon: "paperclip",
          kbd: "U",
          onSelect: () => setCmdOpen(false),
        },
      ],
    },
  ];

  // React.useEffect(() => {
  //   const interval = setInterval(
  //     () => setProgress(p => (p >= 100 ? 0 : p + 5)),
  //     800,
  //   );
  //   return () => clearInterval(interval);
  // }, []);

  const handleBaleGetUpdates = async () => {
    const url = `/api/bale/webhook`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    console.log(response);
  };

  const handleBaleSend = async () => {
    const url = `/api/bale/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: baleChatId, text: baleMessage }),
    });

    console.log(response);

    // try {
    //   const response = await fetch("/api/bale-test", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ chatId: baleChatId, text: baleMessage }),
    //   });
    //   const result = await response.json();
    //   setBaleResult(result);
    //   if (result.success) {
    //     toast.success("Message sent!", { description: "Check your Bale chat" });
    //   } else {
    //     toast.danger("Failed to send", { description: result.error });
    //   }
    // } catch (error) {
    //   setBaleResult({
    //     success: false,
    //     error: error instanceof Error ? error.message : "Unknown error",
    //   });
    //   toast.danger("Error", {
    //     description: error instanceof Error ? error.message : "Unknown error",
    //   });
    // } finally {
    //   setBaleLoading(false);
    // }
  };

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-4xl space-y-10 p-8 font-sans">
        {/* <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">نمایش کامپوننت‌ها</h1>
          <Breadcrumb items={crumbs} />
        </div> */}

        {/* <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-secondary">دکمه‌ها</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">ثبت</Button>
            <Button variant="secondary">انصراف</Button>
            <Button variant="ghost">لغو</Button>
            <Button variant="danger">حذف</Button>
            <Button variant="subtle">پیش‌نمایش</Button>
            <Button variant="primary" loading>
              در حال ذخیره
            </Button>
            <Button variant="primary" icon="plus">
              جدید
            </Button>
            <Button variant="primary" iconRight="arrow-left">
              بعدی
            </Button>
            <IconButton icon="settings" aria-label="تنظیمات" />
            <IconButton icon="trash" variant="outline" aria-label="حذف" />
            <IconButton icon="moon" variant="outline" aria-label="تغییر تم" />
          </div>
        </section> */}

        {/* <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-secondary">بج و تگ</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">پیش‌فرض</Badge>
            <Badge tone="brand">برند</Badge>
            <Badge tone="success">موفق</Badge>
            <Badge tone="warning">اخطار</Badge>
            <Badge tone="danger">خطا</Badge>
            <Badge tone="info">اطلاع</Badge>
            <Badge tone="count">۳</Badge>
            <Badge tone="solid">ثابت</Badge>
            <Badge tone="brand" dot>
              آنلاین
            </Badge>
            <Tag color="#3b82f6">برچسب</Tag>
            <Tag onRemove={() => {}}>قابل حذف</Tag>
            <Tag color="#22c55e">اولویت بالا</Tag>
          </div>
        </section> */}

        {/* <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-secondary">آواتار</h2>
          <div className="flex items-end gap-4">
            <Avatar name="علی محمدی" size="sm" />
            <Avatar name="سارا احمدی" size="md" status="online" />
            <Avatar name="رضا کریمی" size="lg" status="busy" />
            <Avatar
              name="مریم حسینی"
              size="xl"
              src="https://i.pravatar.cc/100"
            />
            <AvatarGroup>
              <Avatar name="علی" size="sm" src="https://i.pravatar.cc/200" />
              <Avatar name="سارا" size="sm" status="online" />
              <Avatar name="رضا" size="sm" src="https://i.pravatar.cc/100" />
              <Avatar name="مریم" size="sm" />
              <Avatar name="حسن" size="sm" />
            </AvatarGroup>
            <AvatarStack
              users={["علی", "سارا", "رضا", "مریم", "حسن"]}
              size="sm"
              max={3}
            />
          </div>
        </section> */}

        {/* <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-secondary">فرم‌ها</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="نام کاربری" placeholder="نام کاربری را وارد کنید" />
            <Input label="ایمیل" rightIcon="mail" placeholder="ایمیل" />
            <Input label="رمز عبور" error="حداقل ۸ کاراکتر" type="password" />
            <Input label="جستجو" icon="search" placeholder="جستجو..." />
            <Input
              button={<Button variant="ghost" size="sm" icon="search" />}
            />
            <Input
              rightIcon="search"
              button={
                <Button variant="primary" size="sm">
                  جستجو
                </Button>
              }
            />
            <div className="" dir="ltr">
              <Input
                icon="search"
                button={
                  <Button variant="primary" size="sm">
                    جستجو
                  </Button>
                }
              />
            </div>
            <Textarea label="توضیحات" placeholder="متن توضیحات" rows={3} />
            <Select
              label="وضعیت"
              options={[
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
                { value: "pending", label: "معلق" },
              ]}
              value={selVal}
              onChange={setSelVal}
            />
          </div>
          <div className="flex items-center gap-6">
            <Checkbox label="مرا به خاطر بسپار" disabled />
            <Checkbox label="قوانین را پذیرفته‌ام" indeterminate />
            <Switch label="حالت تاریک" />
          </div>
          <RadioGroup
            label="نقش کاربر"
            options={[
              { value: "admin", label: "مدیر" },
              { value: "editor", label: "ویرایشگر" },
              { value: "viewer", label: "بیننده" },
            ]}
          />
        </section> */}

        {/* <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-secondary">تاریخ</h2>
          <div className="grid grid-cols-2 gap-4">
            <CalendarPersian />
            <DatePicker
              label="تکی"
              value={dateVal}
              onChange={setDateVal}
              language="FA"
              placeholder="تاریخ را انتخاب کنید"
            />
            <DatePicker
              mode="range"
              label="بازه"
              value={dateRangeVal}
              onChange={setDateRangeVal}
              placeholder="بازه را انتخاب کنید"
            />
            <DatePicker
              label="ماه/سال (dropdown)"
              captionLayout="dropdown"
              value={dateDropdownVal}
              onChange={setDateDropdownVal}
              placeholder="تاریخ را انتخاب کنید"
            />
            <DatePicker
              label="تاریخ و زمان"
              showTimePicker
              value={dateTimeVal}
              onChange={setDateTimeVal}
              placeholder="تاریخ و زمان را انتخاب کنید"
            />
            <DatePicker
              mode="range"
              label="بازه با ماه/سال"
              captionLayout="dropdown"
              value={dateRangeDropdownVal}
              onChange={setDateRangeDropdownVal}
              placeholder="بازه را انتخاب کنید"
            />
          </div>
        </section> */}

        {/* <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-secondary">بازخورد</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <ProgressBar
                value={progress}
                label="پیشرفت"
                showLabel
                size="md"
              />
            </div>
            <div className="flex items-center gap-4">
              <ProgressBar value={67} variant="success" size="sm" />
              <ProgressBar value={34} variant="warning" size="sm" />
              <ProgressBar value={82} variant="info" size="sm" />
              <ProgressBar value={12} variant="danger" size="sm" />
            </div>
            <div className="flex gap-4">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="space-y-2 flex-1">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" />
                <Skeleton variant="text" lines={3} />
              </div>
            </div>
            <EmptyState
              icon="inbox"
              title="پیامی وجود ندارد"
              description="هیچ پیام جدیدی در صندوق ورودی شما نیست"
              action={
                <Button variant="primary" size="sm">
                  رفتن به پیام‌ها
                </Button>
              }
            />
          </div>
        </section> */}

        {/* <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-secondary">
            تب‌ها و راهنما
          </h2>
          <Tabs tabs={tabs} value={tabVal} onChange={setTabVal} />
          <div className="flex gap-2">
            <Tooltip content="ویرایش">
              <Button variant="ghost" size="sm" icon="pencil" />
            </Tooltip>
            <Tooltip content="حذف">
              <Button variant="ghost" size="sm" icon="trash" />
            </Tooltip>
            <Tooltip content="تنظیمات" side="bottom">
              <Button variant="ghost" size="sm" icon="settings" />
            </Tooltip>
            <Tooltip content="خروج" side="left">
              <Button variant="ghost" size="sm" icon="log-out" />
            </Tooltip>
          </div>
        </section> */}

        {/* <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-secondary">
            اورلی و دیالوگ
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              باز کردن دیالوگ
            </Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              باز کردن دراور
            </Button>
            <Menu
              trigger={<Button variant="secondary">منوی کشویی</Button>}
              items={menuItems}
            />
            <Button variant="subtle" onClick={() => setCmdOpen(true)}>
              فرمان‌ها (⌘K)
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.info("پیام آزمایشی", {
                  description: "این یک نوتیفیکیشن تست است",
                })
              }
            >
              نمایش توست
            </Button>
          </div>
        </section> */}

        {/* <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-secondary">اسکرول</h2>
          <ScrollArea className="h-24 w-full border rounded-md p-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <p key={i} className="text-sm py-1 text-text-secondary">
                آیتم شماره {i + 1}
              </p>
            ))}
          </ScrollArea>
        </section> */}

        {/* <Separator /> */}
        <section className="space-y-4" dir="ltr">
          <h2 className="text-lg font-medium text-text-secondary flex items-center gap-2">
            <Icon name="bot" size={18} className="text-brand-600" />
            Bale Bot Test
          </h2>
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border-default">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="bale-chat-id"
                  className="block text-sm font-medium text-text-secondary mb-1.5"
                >
                  Chat ID (e.g., @scrumflow_updates_test or numeric ID)
                </label>
                <Input
                  id="bale-chat-id"
                  placeholder="@scrumflow_updates_test"
                  value={baleChatId}
                  onChange={e => setBaleChatId(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="bale-message"
                  className="block text-sm font-medium text-text-secondary mb-1.5"
                >
                  Message (Markdown supported)
                </label>
                <Textarea
                  id="bale-message"
                  placeholder="Enter your message..."
                  value={baleMessage}
                  onChange={e => setBaleMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                onClick={handleBaleSend}
                loading={baleLoading}
                className="flex flex-row! w-50"
              >
                <Icon name="send" size={16} className="mr-2" />
                Send Test Message
              </Button>
              {baleResult && (
                <Badge
                  tone={baleResult.success ? "success" : "danger"}
                  className="text-sm"
                >
                  {baleResult.success ? "✓ Sent" : "✗ Failed"}
                </Badge>
              )}
            </div>
            {baleResult?.error && (
              <div className="text-sm text-red-500 font-mono bg-red-500/10 p-2 rounded max-h-32 overflow-auto">
                {baleResult.error}
              </div>
            )}
            <details className="text-xs text-text-tertiary">
              <summary className="cursor-pointer">How to get Chat ID</summary>
              <div className="mt-2 space-y-1 font-mono">
                <p>
                  • For channels: use <code>@channelusername</code>
                </p>
                <p>
                  • For groups/chats: use numeric ID (e.g.,{" "}
                  <code>-1001234567890</code>)
                </p>
                <p>• Bot must be admin in the channel/group</p>
              </div>
            </details>
          </div>
        </section>

        <Separator />
        <section className="space-y-2">
          <p className="text-xs text-text-tertiary text-center">
            نمایش کامپوننت‌های مهاجرت‌شده به shadcn/ui — اسکرام‌فلو
          </p>
        </section>

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="تأیید حذف"
          description="آیا از حذف این آیتم اطمینان دارید؟"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                انصراف
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setDialogOpen(false);
                  toast.danger("آیتم حذف شد");
                }}
              >
                حذف
              </Button>
            </div>
          }
        >
          <p className="text-sm text-text-secondary">
            این عملیات قابل بازگشت نیست.
          </p>
        </Dialog>

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          header="جزئیات تسک"
          footer={
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setDrawerOpen(false)}>
                ذخیره
              </Button>
              <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                انصراف
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input label="عنوان" defaultValue="بازبینی ماژول تسک‌ها" />
            <Select
              label="وضعیت"
              options={[
                { value: "open", label: "باز" },
                { value: "in_progress", label: "در حال انجام" },
                { value: "done", label: "انجام شده" },
              ]}
            />
            <Textarea
              label="توضیحات"
              defaultValue="لطفاً بخش dashboard را بررسی کنید"
              rows={4}
            />
          </div>
        </Drawer>

        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          groups={cmdGroups}
          placeholder="جستجوی فرمان‌ها..."
        />
      </div>
    </TooltipProvider>
  );
}
