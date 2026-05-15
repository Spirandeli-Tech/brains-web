import { useEffect, useMemo, useState } from "react";
import { Empty, Spin, Table, Tooltip, message } from "antd";
import { LinkOutlined, LaptopOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { DataCard } from "@/components/molecules";

dayjs.extend(relativeTime);
import { productivityClient } from "@/lib/clients/productivity";
import type { LocalRepoActivity } from "@/lib/clients/productivity";

interface LocalActivityCardProps {
  dateFrom: string;
  dateTo: string;
}

function buildRemoteHref(remoteUrl: string): string | null {
  if (!remoteUrl) return null;
  let s = remoteUrl.trim().replace(/\/$/, "");
  if (s.endsWith(".git")) s = s.slice(0, -4);
  const ssh = s.match(/^[^@]+@([^:]+):(.+)$/);
  if (ssh) return `https://${ssh[1]}/${ssh[2]}`;
  if (/^https?:\/\//.test(s)) return s;
  return null;
}

export function LocalActivityCard({ dateFrom, dateTo }: LocalActivityCardProps) {
  const [data, setData] = useState<LocalRepoActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    productivityClient
      .getLocalCommitsByRepo(dateFrom, dateTo)
      .then((rows) => {
        if (active) setData(rows);
      })
      .catch((e) => {
        if (active) message.error(e instanceof Error ? e.message : "Failed to load local activity");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dateFrom, dateTo]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, r) => {
        acc.commits += r.commits;
        acc.additions += r.additions;
        acc.deletions += r.deletions;
        return acc;
      },
      { commits: 0, additions: 0, deletions: 0 }
    );
  }, [data]);

  const columns: ColumnsType<LocalRepoActivity> = [
    {
      title: "Repository",
      key: "display",
      render: (_, r) => {
        const href = buildRemoteHref(r.remote_url);
        return (
          <span className="flex items-center gap-2">
            <span className="font-medium">{r.display}</span>
            {href && (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-text-muted">
                <LinkOutlined />
              </a>
            )}
          </span>
        );
      },
    },
    {
      title: "Commits",
      dataIndex: "commits",
      key: "commits",
      width: 110,
      align: "right",
      sorter: (a, b) => a.commits - b.commits,
    },
    {
      title: "Changes",
      key: "changes",
      width: 180,
      render: (_, r) => (
        <span className="font-mono text-xs">
          <span className="text-green-600">+{r.additions.toLocaleString()}</span>
          {" / "}
          <span className="text-red-500">-{r.deletions.toLocaleString()}</span>
        </span>
      ),
      sorter: (a, b) => a.additions + a.deletions - (b.additions + b.deletions),
    },
    {
      title: "Last commit",
      dataIndex: "last_commit",
      key: "last_commit",
      width: 180,
      render: (v: string | null) =>
        v ? (
          <Tooltip title={dayjs(v).format("YYYY-MM-DD HH:mm")}>{dayjs(v).fromNow()}</Tooltip>
        ) : (
          <span className="text-text-muted">—</span>
        ),
      sorter: (a, b) =>
        (a.last_commit ? dayjs(a.last_commit).valueOf() : 0) -
        (b.last_commit ? dayjs(b.last_commit).valueOf() : 0),
      defaultSortOrder: "descend",
    },
  ];

  return (
    <DataCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LaptopOutlined className="text-text-muted" />
          <h3 className="text-base font-semibold m-0">Local Activity</h3>
          <span className="text-xs text-text-muted">
            captured by your <span className="font-mono">commit</span> shell function
          </span>
        </div>
        {data.length > 0 && (
          <div className="text-xs text-text-muted">
            <span className="font-semibold text-text-primary">{totals.commits}</span> commits
            {" · "}
            <span className="text-green-600">+{totals.additions.toLocaleString()}</span>
            {" / "}
            <span className="text-red-500">-{totals.deletions.toLocaleString()}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : data.length === 0 ? (
        <Empty
          description="No local commits captured in this range yet."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          rowKey="display"
          columns={columns}
          dataSource={data}
          pagination={false}
          size="small"
        />
      )}
    </DataCard>
  );
}
