import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Spin, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import empresaClient from "@/lib/clients/empresa";
import type { AgentData, MessageData, RitualData, TaskData } from "@/lib/clients/empresa";
import { PageHeader, DataCard } from "@/components/molecules";
import { OrgChart } from "./components/OrgChart";
import { CompanyFeed } from "./components/CompanyFeed";
import { TaskQueue } from "./components/TaskQueue";
import { RituaisCard } from "./components/RituaisCard";
import { EMPRESA_POLL_INTERVAL_MS } from "./utils";

export function EmpresaPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [feed, setFeed] = useState<MessageData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [rituais, setRituais] = useState<RitualData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const pollRef = useRef<number | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [agentsData, feedData, tasksData, rituaisData] = await Promise.all([
        empresaClient.listAgents(),
        empresaClient.listFeed(),
        empresaClient.listTasks(),
        empresaClient.listRituais(),
      ]);
      setAgents(agentsData);
      setFeed(feedData);
      setTasks(tasksData);
      setRituais(rituaisData);
    } catch (err) {
      if (!silent) {
        message.error(err instanceof Error ? err.message : "Falha ao carregar a empresa");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    pollRef.current = window.setInterval(() => fetchAll(true), EMPRESA_POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchAll]);

  const handleSend = useCallback(
    async (body: string): Promise<boolean> => {
      setSending(true);
      try {
        await empresaClient.sendMessage({ body });
        message.success("Mensagem enviada ao CEO");
        await fetchAll(true);
        return true;
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Falha ao enviar a mensagem");
        return false;
      } finally {
        setSending(false);
      }
    },
    [fetchAll],
  );

  const initialLoading = loading && agents.length === 0 && feed.length === 0 && tasks.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Empresa"
        subtitle="Organograma vivo, feed de mensagens e fila de execução dos agentes de IA"
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => fetchAll()} loading={loading}>
            Atualizar
          </Button>
        }
      />

      {initialLoading ? (
        <DataCard>
          <div className="flex justify-center py-12">
            <Spin />
          </div>
        </DataCard>
      ) : (
        <>
          <DataCard>
            <h2 className="text-base font-semibold text-text-primary m-0 mb-4">
              Organograma vivo
            </h2>
            <OrgChart agents={agents} />
          </DataCard>

          <DataCard>
            <h2 className="text-base font-semibold text-text-primary m-0 mb-4">
              Rituais — a agenda da empresa
            </h2>
            <RituaisCard rituais={rituais} agents={agents} />
          </DataCard>

          <DataCard>
            <h2 className="text-base font-semibold text-text-primary m-0 mb-4">
              Feed da empresa
            </h2>
            <CompanyFeed messages={feed} agents={agents} sending={sending} onSend={handleSend} />
          </DataCard>

          <DataCard>
            <h2 className="text-base font-semibold text-text-primary m-0 mb-4">
              Fila de execução
            </h2>
            <TaskQueue tasks={tasks} />
          </DataCard>
        </>
      )}
    </div>
  );
}
