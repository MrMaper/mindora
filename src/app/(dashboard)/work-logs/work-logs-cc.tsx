"use client";

import { useTranslation } from "@/i18n/provider";

import * as React from "react";
import { formatNumber } from "@/lib/utils";
import { Pagination } from "@/components/ui-kit/tables/pagination";
import type { UserRow } from "@/features/users/types";
import type { ProjectRow } from "@/features/projects/types";
import type { Language } from "@/types/db";
import type { WorkLogSummary } from "@/features/work-logs/types";
import { AreaPathFilters } from "@/components/life/area-path-filters";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Select } from "@/components/ui-kit/forms/select";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { Button } from "@/components/ui-kit/forms/button";

interface WorkLogsCCProps {
  users: UserRow[];
  userProjects: ProjectRow[];
  summary: WorkLogSummary;
  filters: {
    userId: string;
    projectId: string;
    area: string;
    dateFrom: string;
    dateTo: string;
  };
  page: number;
  language: Language;
  currentUserId: string;
  currentUserRole: string;
  isAdmin: boolean;
}

export function WorkLogsCC({
  users,
  userProjects,
  summary,
  filters,
  page,
  language,
  currentUserId,
  currentUserRole,
  isAdmin,
}: WorkLogsCCProps) {
  const t = useTranslation();
  const dateLocale = language === "EN" ? "en-US" : "fa-IR";

  const userOptions = [
    { value: "", label: t.workLogs.allUsers },
    ...users.map(u => ({ value: u.id, label: u.name })),
  ];

  const hasActiveFilters = !!(
    filters.userId ||
    filters.projectId ||
    filters.area ||
    filters.dateFrom ||
    filters.dateTo
  );

  const writeFilters = (next: typeof filters) => {
    const params = new URLSearchParams();
    if (next.userId) params.set("userId", next.userId);
    if (next.area) params.set("area", next.area);
    if (next.projectId) params.set("projectId", next.projectId);
    if (next.dateFrom) params.set("dateFrom", next.dateFrom);
    if (next.dateTo) params.set("dateTo", next.dateTo);
    params.set("page", "1");
    window.location.href = `/work-logs?${params.toString()}`;
  };

  const handleFilterChange = (key: string, value: string) => {
    writeFilters({ ...filters, [key]: value });
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatHours = (hours: number): string => {
    return formatNumber(hours.toFixed(2), language);
  };

  return (
    <div className="flex flex-col gap-6 min-w-0 overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{t.workLogs.title}</h1>
          <p className="text-text-secondary mt-1 text-sm">
            {t.workLogs.subtitle}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="p-4">
          <div className="text-text-tertiary text-sm">{t.workLogs.totalHours}</div>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {formatHours(summary.totalHours)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-text-tertiary text-sm">{t.workLogs.totalEntries}</div>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {formatNumber(summary.totalEntries.toString(), language)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-text-tertiary text-sm">{t.workLogs.uniqueUsers}</div>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {formatNumber(Object.keys(summary.byUser).length.toString(), language)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-text-tertiary text-sm">{t.workLogs.uniqueTasks}</div>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {formatNumber(Object.keys(summary.byTask).length.toString(), language)}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 items-end">
            {isAdmin && (
              <Select
                label={t.workLogs.user}
                options={userOptions}
                value={filters.userId}
                onChange={value => handleFilterChange("userId", value)}
                placeholder={t.workLogs.allUsers}
              />
            )}
            <AreaPathFilters
              projects={userProjects}
              area={filters.area}
              project={filters.projectId}
              language={language === "EN" ? "EN" : "FA"}
              labels={{
                area: t.workLogs.area,
                path: t.workLogs.path,
                allAreas: t.workLogs.allAreas,
                allPaths: t.workLogs.allPaths,
              }}
              onChange={next =>
                writeFilters({ ...filters, area: next.area, projectId: next.project })
              }
            />
            <DatePicker
              value={filters.dateFrom ? new Date(filters.dateFrom) : null}
              onChange={date => handleFilterChange("dateFrom", date ? date.toISOString().split("T")[0] : "")}
              mode="single"
              label={t.workLogs.dateFrom}
            />
            <DatePicker
              value={filters.dateTo ? new Date(filters.dateTo) : null}
              onChange={date => handleFilterChange("dateTo", date ? date.toISOString().split("T")[0] : "")}
              mode="single"
              label={t.workLogs.dateTo}
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={() => window.location.href = "/work-logs"}
                size="sm"
              >
                <Icon name="x" size={14} className="mr-1" />
                {t.workLogs.clearFilters}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Breakdown by User */}
      {Object.keys(summary.byUser).length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4">{t.workLogs.byUser}</h3>
          <div className="space-y-3">
            {Object.entries(summary.byUser)
              .sort(([, a], [, b]) => b.hours - a.hours)
              .map(([_, data]) => (
                <div key={data.user.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-3">
                    <img
                      src={data.user.avatar ?? ""}
                      alt={data.user.name}
                      className="w-8 h-8 rounded-full bg-primary/20"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="font-medium text-text-primary">{data.user.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      {formatHours(data.hours)}
                    </div>
                    <div className="text-xs text-text-tertiary">{t.workLogs.hours}</div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Breakdown by Task */}
      {Object.keys(summary.byTask).length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4">{t.workLogs.byTask}</h3>
          <div className="space-y-3">
            {Object.entries(summary.byTask)
              .sort(([, a], [, b]) => b.hours - a.hours)
              .slice(0, 20)
              .map(([_, data]) => (
                <div key={data.taskTitle} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary truncate">{data.taskTitle}</div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xl font-bold text-primary">
                      {formatHours(data.hours)}
                    </div>
                    <div className="text-xs text-text-tertiary">{t.workLogs.hours}</div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Breakdown by Project */}
      {Object.keys(summary.byProject).length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4">{t.workLogs.byProject}</h3>
          <div className="space-y-3">
            {Object.entries(summary.byProject)
              .sort(([, a], [, b]) => b.hours - a.hours)
              .map(([_, data]) => (
                <div key={data.projectName} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon name="folder" size={16} className="text-primary" />
                    </div>
                    <span className="font-medium text-text-primary">{data.projectName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      {formatHours(data.hours)}
                    </div>
                    <div className="text-xs text-text-tertiary">{t.workLogs.hours}</div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Breakdown by Date */}
      {Object.keys(summary.byDate).length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4">{t.workLogs.byDate}</h3>
          <div className="space-y-3">
            {Object.entries(summary.byDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 30)
              .map(([date, hours]) => (
                <div key={date} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon name="calendar" size={16} className="text-primary" />
                    </div>
                    <span className="font-medium text-text-primary">{formatDate(new Date(date))}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      {formatHours(hours)}
                    </div>
                    <div className="text-xs text-text-tertiary">{t.workLogs.hours}</div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {summary.totalEntries === 0 && (
        <Card className="p-12 text-center">
          <Icon name="clock" size={48} className="mx-auto text-text-tertiary mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {t.workLogs.noData}
          </h3>
          <p className="text-text-secondary">
            {t.workLogs.noDataDesc}
          </p>
        </Card>
      )}
    </div>
  );
}