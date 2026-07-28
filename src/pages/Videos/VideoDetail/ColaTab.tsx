import { useEffect, useState } from "react";
import { Button, Empty, Input, message } from "antd";
import { PlayCircleOutlined, SaveOutlined, ThunderboltOutlined } from "@ant-design/icons";
import contentClient from "@/lib/clients/content";
import type { VideoScript } from "@/lib/clients/content";
import { parseSlides, renderCola } from "@/lib/cola";
import { Presenter } from "./Presenter";

export function ColaTab({
  videoId,
  script,
  onSaved,
}: {
  videoId: string;
  script: VideoScript;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(script.topics_md ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [presenting, setPresenting] = useState(false);

  // Switching script version resets the editor to that version's saved cola.
  useEffect(() => {
    setDraft(script.topics_md ?? "");
  }, [script.id, script.topics_md]);

  const dirty = draft !== (script.topics_md ?? "");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await contentClient.generateTopics(videoId, script.id);
      setDraft(result.topics_md);
      message.success("Rascunho gerado — revise antes de salvar");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Falha ao gerar a cola");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await contentClient.saveTopics(videoId, script.id, draft);
      message.success("Cola salva");
      onSaved();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Falha ao salvar a cola");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-text-muted">
          Título por cena + versículo/CVV em destaque. Gerada pelo Gemini a partir do roteiro —
          sempre revise antes de salvar.
        </span>
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            loading={generating}
            onClick={() => void handleGenerate()}
          >
            {draft ? "Gerar de novo" : "Gerar cola"}
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<SaveOutlined />}
            disabled={!dirty}
            loading={saving}
            onClick={() => void handleSave()}
          >
            Salvar
          </Button>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            disabled={!draft}
            onClick={() => setPresenting(true)}
          >
            Apresentar
          </Button>
        </div>
      </div>

      {draft ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input.TextArea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoSize={{ minRows: 16, maxRows: 40 }}
            className="font-mono text-xs"
          />
          <div
            className="text-sm leading-relaxed bg-bg-hover rounded p-3 overflow-auto [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:uppercase [&_h4]:tracking-wide [&_h4]:text-text-muted [&_h4]:mt-4 [&_h4]:mb-2 [&_h4:first-child]:mt-0 [&_ul]:pl-5 [&_ul]:m-0 [&_ul]:mb-3 [&_li]:mb-1 [&_.verse]:font-serif [&_.verse]:italic [&_.destaque]:font-semibold [&_.pausa]:text-text-disabled [&_.pausa]:text-xs [&_hr]:border-border-subtle [&_hr]:my-3"
            dangerouslySetInnerHTML={{ __html: renderCola(draft) }}
          />
        </div>
      ) : (
        <Empty description="Sem cola ainda — gere um rascunho a partir do roteiro" />
      )}

      {presenting && <Presenter slides={parseSlides(draft)} onClose={() => setPresenting(false)} />}
    </div>
  );
}
