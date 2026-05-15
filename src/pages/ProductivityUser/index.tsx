import { useCallback, useEffect, useState } from "react";
import { Alert, Avatar, Collapse, DatePicker, Empty, Spin, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { productivityClient } from "@/lib/clients/productivity";
import type { UserActivityOrg, UserActivityResponse } from "@/lib/clients/productivity";
import { PageHeader, DataCard } from "@/components/molecules";

const { RangePicker } = DatePicker;

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl shadow-card overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide m-0">{label}</p>
        <p className="text-2xl font-semibold text-text-primary m-0 mt-1">{value}</p>
      </div>
    </div>
  );
}

function OrgHeader({ org }: { org: UserActivityOrg }) {
  return (
    <div className="flex items-center gap-3 w-full">
      {org.avatar_url ? (
        <Avatar src={org.avatar_url} size={24} shape="square" />
      ) : (
        <Avatar size={24} shape="square">{org.login[0]?.toUpperCase()}</Avatar>
      )}
      <span className="font-semibold text-text-primary">{org.login}</span>
      <Tag color="default" className="m-0">{org.repositories.length} repos</Tag>
      <div className="ml-auto flex items-center gap-3 text-xs text-text-muted">
        <span>
          <span className="text-text-primary font-semibold">{org.commits}</span> commits
        </span>
        <span>
          <span className="text-text-primary font-semibold">{org.prs}</span> PRs
        </span>
      </div>
    </div>
  );
}

export function ProductivityUserPage() {
  const [data, setData] = useState<UserActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await productivityClient.getUserActivity(
        dateRange[0].format("YYYY-MM-DD"),
        dateRange[1].format("YYYY-MM-DD"),
      );
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load user activity";
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [dateRange[0].valueOf(), dateRange[1].valueOf()]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const totals = data?.totals ?? { commits: 0, prs: 0 };

  const collapseItems = (data?.organizations ?? []).map((org) => ({
    key: org.login,
    label: <OrgHeader org={org} />,
    children: (
      <Table
        size="small"
        pagination={false}
        rowKey="name_with_owner"
        dataSource={org.repositories}
        columns={[
          {
            title: "Repository",
            dataIndex: "name_with_owner",
            render: (value: string) => (
              <a
                href={`https://github.com/${value}`}
                target="_blank"
                rel="noreferrer"
                className="text-text-primary hover:text-brand-primary"
              >
                {value}
              </a>
            ),
          },
          {
            title: "Commits",
            dataIndex: "commits",
            width: 120,
            align: "right" as const,
          },
          {
            title: "PRs",
            dataIndex: "prs",
            width: 120,
            align: "right" as const,
          },
        ]}
      />
    ),
  }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Productivity — by user"
        subtitle="Your activity across all GitHub organizations, fetched live"
        actions={
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            allowClear={false}
            size="middle"
          />
        }
      />

      {error && (
        <Alert
          type="error"
          showIcon
          message="Could not load GitHub activity"
          description={error}
        />
      )}

      {data && (() => {
        const diag = data.diagnostics;
        const missingCommits = diag.github_total_commits - data.totals.commits;
        const missingPrs = diag.github_total_prs - data.totals.prs;
        const hasGap = missingCommits > 0 || missingPrs > 0 || diag.restricted_contributions > 0;
        if (!hasGap) return null;
        return (
          <Alert
            type="warning"
            showIcon
            message="Some contributions are hidden"
            description={
              <div className="flex flex-col gap-1 text-sm">
                <span>
                  GitHub reports <b>{diag.github_total_commits}</b> commits and{" "}
                  <b>{diag.github_total_prs}</b> PRs in this range, but only{" "}
                  <b>{data.totals.commits}</b> commits and <b>{data.totals.prs}</b> PRs were
                  attributable to repositories your token can see.
                </span>
                {diag.restricted_contributions > 0 && (
                  <span>
                    {diag.restricted_contributions} contribution(s) are in private repos your
                    token cannot access.
                  </span>
                )}
                <span className="text-text-muted">
                  Likely causes: the PAT lacks <code>read:org</code> / <code>repo</code> scope,
                  or the organization enforces SAML SSO and the token is not authorized for it.
                </span>
              </div>
            }
          />
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Total Commits" value={String(totals.commits)} color="#7CB342" />
        <StatCard label="Total PRs" value={String(totals.prs)} color="#42A5F5" />
      </div>

      <DataCard>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spin />
          </div>
        ) : collapseItems.length > 0 ? (
          <Collapse items={collapseItems} defaultActiveKey={collapseItems.map((i) => i.key)} />
        ) : (
          <Empty
            description={
              error
                ? "No data available"
                : `No activity for ${data?.username ?? "your user"} in this date range.`
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </DataCard>
    </div>
  );
}
