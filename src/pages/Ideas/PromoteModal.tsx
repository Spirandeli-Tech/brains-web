import { useEffect } from "react";
import { DatePicker, Form, Input, InputNumber, Modal, Select, message } from "antd";
import dayjs from "dayjs";
import contentClient from "@/lib/clients/content";
import type { ContentFormat, Idea } from "@/lib/clients/content";

interface Props {
  open: boolean;
  idea: Idea | null;
  onClose: () => void;
  onSuccess: (videoId: string) => void;
}

interface FormValues {
  format: ContentFormat;
  publish_date?: dayjs.Dayjs | null;
  keyword?: string;
  series?: string;
  episode_number?: number;
}

/** Promoting is the gesture that used to be copy-and-paste between a spreadsheet
 * and your head: it creates the calendar row from the idea. The idea is kept and
 * marked `promoted` — promoting twice is allowed on purpose, because a Short and
 * a longer piece on the same theme are two videos. */
export function PromoteModal({ open, idea, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (idea) form.setFieldsValue({ format: idea.format });
  }, [open, idea, form]);

  const handleSubmit = async () => {
    if (!idea) return;
    try {
      const values = await form.validateFields();
      const video = await contentClient.promoteIdea(idea.id, {
        format: values.format,
        keyword: values.keyword || null,
        series: values.series || null,
        episode_number: values.episode_number ?? null,
        publish_date: values.publish_date ? values.publish_date.format("YYYY-MM-DD") : null,
      });
      message.success("Added to the calendar");
      onSuccess(video.id);
      onClose();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

  return (
    <Modal
      open={open}
      title={`Schedule "${idea?.title ?? ""}"`}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Add to calendar"
      width={560}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ format: "episode" }}>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="format"
            label="Format"
            tooltip="The episode is the product; cuts and the podcast are created from it afterwards"
          >
            <Select
              options={[
                { value: "episode", label: "Episode (8–15min, Sunday — the product)" },
                { value: "short", label: "Cut (Tue/Fri — discovery)" },
                { value: "podcast", label: "Podcast (audio track, Sunday)" },
              ]}
            />
          </Form.Item>
          <Form.Item name="publish_date" label="Publish date">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </div>

        <Form.Item
          name="keyword"
          label="Keyword"
          tooltip="The one expression to own in search — repeated in the first 5s, the middle and the close"
        >
          <Input placeholder="fome da comida errada" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="series" label="Series">
            <Input placeholder="O Empreendedor Exausto" />
          </Form.Item>
          <Form.Item name="episode_number" label="Episode #">
            <InputNumber className="w-full" min={1} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
