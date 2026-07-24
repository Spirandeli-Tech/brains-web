import { useEffect } from "react";
import { Form, Input, Modal, Select, message } from "antd";
import contentClient from "@/lib/clients/content";

interface Props {
  open: boolean;
  videoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  body: string;
  titles?: string;
  caption?: string;
  hashtags?: string;
  cover?: string;
  facts_used?: string;
  short_cuts?: string;
  persona?: string;
}

/** One line per item — the skill posts arrays directly, so this is only the
 * by-hand path. */
function toList(value?: string): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ScriptFormModal({ open, videoId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await contentClient.createScript(videoId, {
        body: values.body,
        titles: toList(values.titles),
        caption: values.caption || null,
        hashtags: toList(values.hashtags),
        cover: values.cover || null,
        facts_used: values.facts_used || null,
        short_cuts: toList(values.short_cuts),
        persona: values.persona || null,
      });
      message.success("Script version saved");
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

  return (
    <Modal
      open={open}
      title="New script version"
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Save version"
      width={760}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="body"
          label="Script"
          rules={[{ required: true, message: "The script body is required" }]}
          tooltip="Markdown, with the [VISUAL: ...] markers"
        >
          <Input.TextArea rows={12} className="font-mono text-xs" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="titles" label="Titles (one per line)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="short_cuts"
            label="Short cuts (one per line)"
            tooltip="Named before recording — principle #7"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </div>

        <Form.Item name="caption" label="Caption + CTA">
          <Input.TextArea rows={3} />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="hashtags" label="Hashtags (one per line)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="facts_used" label="Verses / facts used">
            <Input.TextArea rows={3} />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="cover" label="Cover / thumb concept">
            <Input />
          </Form.Item>
          <Form.Item name="persona" label="Persona">
            <Select
              allowClear
              options={[
                { value: "persona-empreendedor", label: "persona-empreendedor" },
                { value: "persona-fe", label: "persona-fe" },
              ]}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
