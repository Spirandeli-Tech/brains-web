import { useEffect } from "react";
import { Alert, Form, Input, InputNumber, Modal, message } from "antd";
import contentClient from "@/lib/clients/content";
import type { VideoDetail } from "@/lib/clients/content";

interface Props {
  open: boolean;
  video: VideoDetail;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  ctr_48h?: number | null;
  retention_48h?: number | null;
  learning?: string;
}

/** These two numbers are the only thing that turns a growth principle from
 * hypothesis into fact — `brand/principios-video.md` says every principle it
 * lists stays unproven until CTR and retention confirm it. Filling them in is the
 * point of the whole table, not an afterthought. */
export function MetricsFormModal({ open, video, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      ctr_48h: video.ctr_48h ? Number(video.ctr_48h) : undefined,
      retention_48h: video.retention_48h ? Number(video.retention_48h) : undefined,
      learning: video.learning ?? undefined,
    });
  }, [open, video, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await contentClient.updateVideo(video.id, {
        ctr_48h: values.ctr_48h != null ? String(values.ctr_48h) : null,
        retention_48h: values.retention_48h != null ? String(values.retention_48h) : null,
        learning: values.learning || null,
      });
      message.success("Metrics saved");
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

  return (
    <Modal
      open={open}
      title="48h metrics"
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Save"
      width={560}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="This is what validates the growth checklist"
        description="Every principle in principios-video.md is a hypothesis until CTR and retention back it. What doesn't hold up gets removed from the checklist."
      />
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="ctr_48h" label="CTR 48h (%)">
            <InputNumber className="w-full" min={0} max={100} step={0.1} />
          </Form.Item>
          <Form.Item name="retention_48h" label="Retention 48h (%)">
            <InputNumber className="w-full" min={0} max={100} step={0.1} />
          </Form.Item>
        </div>
        <Form.Item
          name="learning"
          label="Learning"
          extra="Which principle did this confirm or contradict?"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
