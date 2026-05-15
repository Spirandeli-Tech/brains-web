import { useMemo } from "react";
import { Collapse, Table, Tag } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { CommitData } from "@/lib/clients/productivity";

interface CommitsTableProps {
  commits: CommitData[];
  loading: boolean;
}

const columns: ColumnsType<CommitData> = [
  {
    title: "Date",
    dataIndex: "date",
    key: "date",
    width: 120,
    render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
  },
  {
    title: "Hash",
    dataIndex: "short_hash",
    key: "short_hash",
    width: 100,
    render: (hash: string) => (
      <span className="font-mono text-xs">{hash}</span>
    ),
  },
  {
    title: "Message",
    dataIndex: "message",
    key: "message",
    ellipsis: true,
  },
  {
    title: "Changes",
    key: "changes",
    width: 140,
    render: (_, record) => (
      <span className="font-mono text-xs">
        <span className="text-green-600">+{record.additions}</span>
        {" / "}
        <span className="text-red-500">-{record.deletions}</span>
      </span>
    ),
  },
  {
    title: "PR",
    key: "pr",
    width: 80,
    align: "center",
    render: (_, record) =>
      record.pr_url ? (
        <a href={record.pr_url} target="_blank" rel="noopener noreferrer">
          <Tag color="blue">
            <LinkOutlined /> #{record.pr_number}
          </Tag>
        </a>
      ) : (
        <span className="text-text-muted">—</span>
      ),
  },
];

export function CommitsTable({ commits, loading }: CommitsTableProps) {
  const groupedByRepo = useMemo(() => {
    const groups: Record<string, CommitData[]> = {};
    for (const commit of commits) {
      const repo = commit.repository;
      if (!groups[repo]) groups[repo] = [];
      groups[repo].push(commit);
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [commits]);

  if (groupedByRepo.length <= 1) {
    return (
      <Table<CommitData>
        columns={columns}
        dataSource={commits}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="small"
        expandable={{
          expandedRowRender: (record) => (
            <p className="m-0 text-sm text-text-muted font-mono whitespace-pre-wrap">
              {record.message}
            </p>
          ),
          rowExpandable: (record) => record.message.length > 60,
        }}
      />
    );
  }

  const repoStats = (repoCommits: CommitData[]) => {
    const additions = repoCommits.reduce((s, c) => s + c.additions, 0);
    const deletions = repoCommits.reduce((s, c) => s + c.deletions, 0);
    return { count: repoCommits.length, additions, deletions };
  };

  const items = groupedByRepo.map(([repo, repoCommits]) => {
    const stats = repoStats(repoCommits);
    const repoName = repo.split("/").pop() || repo;

    return {
      key: repo,
      label: (
        <div className="flex items-center gap-3">
          <span className="font-medium">{repoName}</span>
          <span className="text-xs text-text-muted">{repo}</span>
          <Tag>{stats.count} commits</Tag>
          <span className="font-mono text-xs">
            <span className="text-green-600">+{stats.additions}</span>
            {" / "}
            <span className="text-red-500">-{stats.deletions}</span>
          </span>
        </div>
      ),
      children: (
        <Table<CommitData>
          columns={columns}
          dataSource={repoCommits}
          rowKey="id"
          pagination={repoCommits.length > 20 ? { pageSize: 20 } : false}
          size="small"
          expandable={{
            expandedRowRender: (record) => (
              <p className="m-0 text-sm text-text-muted font-mono whitespace-pre-wrap">
                {record.message}
              </p>
            ),
            rowExpandable: (record) => record.message.length > 60,
          }}
        />
      ),
    };
  });

  return (
    <Collapse
      defaultActiveKey={groupedByRepo.map(([repo]) => repo)}
      items={items}
    />
  );
}
