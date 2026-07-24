import { useEffect } from "react";
import { DatePicker, Form, Input, InputNumber, Modal, Select, message } from "antd";
import dayjs from "dayjs";
import contentClient from "@/lib/clients/content";
import type { ContentFormat, Video, VideoStatus } from "@/lib/clients/content";
import { VIDEO_STATUSES, VIDEO_STATUS_LABEL } from "./constants";

interface Props {
  open: boolean;
  video: Video | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  title: string;
  keyword?: string;
  format: ContentFormat;
  status: VideoStatus;
  publish_date?: dayjs.Dayjs | null;
  series?: string;
  episode_number?: number;
  thumb_url?: string;
  youtube_url?: string;
}

export function VideoFormModal({ open, video, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    if (video) {
      form.setFieldsValue({
        title: video.title,
        keyword: video.keyword ?? undefined,
        format: video.format,
        status: video.status,
        publish_date: video.publish_date ? dayjs(video.publish_date) : null,
        series: video.series ?? undefined,
        episode_number: video.episode_number ?? undefined,
        thumb_url: video.thumb_url ?? undefined,
        youtube_url: video.youtube_url ?? undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, video, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        title: values.title,
        keyword: values.keyword || null,
        format: values.format,
        status: values.status,
        publish_date: values.publish_date ? values.publish_date.format("YYYY-MM-DD") : null,
        series: values.series || null,
        episode_number: values.episode_number ?? null,
        thumb_url: values.thumb_url || null,
        youtube_url: values.youtube_url || null,
      };
      if (video) {
        await contentClient.updateVideo(video.id, payload);
        message.success("Video updated");
      } else {
        await contentClient.createVideo(payload);
        message.success("Video created");
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
      title={video ? "Edit video" : "New video"}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={video ? "Save" : "Create"}
      width={640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ format: "short", status: "idea" }}>
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: "Title is required" }]}
          tooltip="Clear on the subject, curious on the outcome (principle #12)"
        >
          <Input placeholder="O ano em que eu dobrei minhas reuniões e não fechei nenhuma" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="keyword"
            label="Keyword"
            tooltip="The one expression to own in search (principle #6)"
          >
            <Input placeholder="fome da comida errada" />
          </Form.Item>
          <Form.Item name="publish_date" label="Publish date">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="format" label="Format">
            <Select
              options={[
                { value: "short", label: "Short (30–60s, entry point)" },
                { value: "video", label: "Video (60–180s, depth)" },
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={VIDEO_STATUSES.map((s) => ({ value: s, label: VIDEO_STATUS_LABEL[s] }))}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="series" label="Series">
            <Input placeholder="O Empreendedor Exausto" />
          </Form.Item>
          <Form.Item name="episode_number" label="Episode #">
            <InputNumber className="w-full" min={1} />
          </Form.Item>
        </div>

        <Form.Item name="thumb_url" label="Thumbnail URL">
          <Input placeholder="https://…" />
        </Form.Item>
        <Form.Item name="youtube_url" label="YouTube URL">
          <Input placeholder="https://youtube.com/…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
