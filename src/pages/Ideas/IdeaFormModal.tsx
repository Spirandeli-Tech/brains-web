import { useEffect } from "react";
import { Form, Input, Modal, Select, Switch, message } from "antd";
import contentClient from "@/lib/clients/content";
import type { CreateIdeaPayload, Idea } from "@/lib/clients/content";
import {
  IDEA_STATUSES,
  IDEA_STATUS_LABEL,
  IDEA_TYPES,
  IDEA_TYPE_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
} from "../Videos/constants";

const FORMATS = ["short", "video", "message", "series"];

interface Props {
  open: boolean;
  idea: Idea | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function IdeaFormModal({ open, idea, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<CreateIdeaPayload>();

  useEffect(() => {
    if (!open) return;
    if (idea) {
      form.setFieldsValue({
        title: idea.title,
        slug: idea.slug,
        format: idea.format,
        type: idea.type,
        priority: idea.priority,
        status: idea.status,
        hook: idea.hook,
        why_now: idea.why_now,
        visual_refs: idea.visual_refs,
        trustworthy: idea.trustworthy,
        fact_check: idea.fact_check,
      });
    } else {
      form.resetFields();
    }
  }, [open, idea, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (idea) {
        await contentClient.updateIdea(idea.id, values);
        message.success("Idea updated");
      } else {
        await contentClient.createIdea(values);
        message.success("Idea created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

  return (
    <Modal
      open={open}
      title={idea ? "Edit idea" : "New idea"}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={idea ? "Save" : "Create"}
      width={640}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ format: "short", priority: "media", status: "idea", trustworthy: true }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: "Title is required" }]}
        >
          <Input placeholder="A geração que desistiu de querer mais não está errada" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="slug" label="Slug" tooltip="Short concept key, used for dedup">
            <Input placeholder="quiet-ambition-fome-da-comida-errada" />
          </Form.Item>
          <Form.Item name="format" label="Format">
            <Select
              options={FORMATS.map((f) => ({
                value: f,
                label: f.charAt(0).toUpperCase() + f.slice(1),
              }))}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Form.Item name="type" label="Type">
            <Select
              allowClear
              options={IDEA_TYPES.map((t) => ({ value: t, label: IDEA_TYPE_LABEL[t] }))}
            />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={IDEA_STATUSES.map((s) => ({ value: s, label: IDEA_STATUS_LABEL[s] }))}
            />
          </Form.Item>
        </div>

        <Form.Item name="hook" label="Hook (first 15s)">
          <Input.TextArea rows={2} placeholder="The first sentence that holds, starting from the scene" />
        </Form.Item>

        <Form.Item name="why_now" label="Why now">
          <Input.TextArea rows={2} placeholder="The trend signal + its source" />
        </Form.Item>

        <Form.Item name="visual_refs" label="Visual references">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item
          name="trustworthy"
          label="Fact-check passed"
          valuePropName="checked"
          tooltip="Off means something is still pending — the script skill will refuse to run"
        >
          <Switch />
        </Form.Item>

        <Form.Item name="fact_check" label="Fact-check notes">
          <Input.TextArea rows={3} placeholder="What was confirmed, sources, any [CHECAR: ...]" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
