import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Modal, Spin, message } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  QuestionCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import empresaClient from "@/lib/clients/empresa";
import type {
  AgentData,
  DiagnosticoData,
  MessageData,
  RitualData,
  TaskData,
} from "@/lib/clients/empresa";
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
  const [diagnosticoOpen, setDiagnosticoOpen] = useState(false);
  const [diagnosticoLoading, setDiagnosticoLoading] = useState(false);
  const [diagnostico, setDiagnostico] = useState<DiagnosticoData | null>(null);

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

  const fetchDiagnostico = useCallback(async () => {
    setDiagnosticoLoading(true);
    try {
      const data = await empresaClient.getDiagnostico();
      setDiagnostico(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Falha ao carregar o diagnóstico");
    } finally {
      setDiagnosticoLoading(false);
    }
  }, []);

  const handleOpenDiagnostico = useCallback(() => {
    setDiagnostico(null);
    setDiagnosticoOpen(true);
    fetchDiagnostico();
  }, [fetchDiagnostico]);

  const initialLoading = loading && agents.length === 0 && feed.length === 0 && tasks.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Empresa"
        subtitle="Organograma vivo, feed de mensagens e fila de execução dos agentes de IA"
        actions={
          <>
            <Button icon={<QuestionCircleOutlined />} onClick={handleOpenDiagnostico}>
              Por que está parado?
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchAll()} loading={loading}>
              Atualizar
            </Button>
          </>
        }
      />

      <Modal
        title="Por que está parado?"
        open={diagnosticoOpen}
        onCancel={() => setDiagnosticoOpen(false)}
        width={640}
        footer={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDiagnostico}
            loading={diagnosticoLoading}
          >
            Atualizar
          </Button>
        }
      >
        {diagnosticoLoading && !diagnostico ? (
          <div className="flex justify-center py-12">
            <Spin />
          </div>
        ) : diagnostico ? (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary m-0 mb-2">
                Estado da corrente
              </h3>
              <div className="flex flex-col gap-2">
                {diagnostico.checks.map((check) => (
                  <div key={check.nome} className="flex items-start gap-2">
                    {check.ok ? (
                      <CheckCircleFilled className="text-status-success-text mt-1" />
                    ) : (
                      <CloseCircleFilled className="text-status-danger-text mt-1" />
                    )}
                    <div>
                      <span className="font-bold">{check.nome}</span>{" "}
                      <span className="text-text-secondary">{check.detalhe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary m-0 mb-2">
                O que explica o momento
              </h3>
              <ul className="list-disc pl-5 m-0 flex flex-col gap-1">
                {diagnostico.motivos.map((motivo) => (
                  <li key={motivo}>{motivo}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>

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
            <RituaisCard rituais={rituais} agents={agents} onExecuted={() => fetchAll(true)} />
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
            <TaskQueue tasks={tasks} agents={agents} />
          </DataCard>
        </>
      )}
    </div>
  );
}
