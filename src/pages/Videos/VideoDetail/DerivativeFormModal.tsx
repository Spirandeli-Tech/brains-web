import { useEffect } from "react";
import { Alert, DatePicker, Form, Input, Modal, Select, message } from "antd";
import dayjs from "dayjs";
import contentClient from "@/lib/clients/content";
import type { VideoFormat } from "@/lib/clients/content";
import { FORMAT_HINT } from "../constants";

interface Props {
  open: boolean;
  episodeId: string;
  episodeTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  format: VideoFormat;
  title?: string;
  publish_date?: dayjs.Dayjs | null;
}

/** Cuts and the podcast inherit the episode's idea, keyword and series — they are
 * the same content in another shape, and splitting the keyword would break
 * principle #6. */
export function DerivativeFormModal({
  open,
  episodeId,
  episodeTitle,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const format = Form.useWatch("format", form);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await contentClient.createDerivative(episodeId, {
        format: values.format,
        title: values.title || null,
        publish_date: values.publish_date ? values.publish_date.format("YYYY-MM-DD") : null,
      });
      message.success("Added to the episode");
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

  return (
    <Modal
      open={open}
      title="New derivative"
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Add"
      width={560}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message={`Derived from “${episodeTitle}”`}
        description="Inherits the episode's idea, keyword and series."
      />
      <Form form={form} layout="vertical" initialValues={{ format: "short" }}>
        <Form.Item name="format" label="Format" extra={FORMAT_HINT[format ?? "short"]}>
          <Select
            options={[
              { value: "short", label: "Cut (Tue/Fri)" },
              { value: "podcast", label: "Podcast (audio track)" },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="title"
          label="Title"
          extra="Leave empty to name it after the episode."
        >
          <Input placeholder="O momento em que o e-mail chegou" />
        </Form.Item>
        <Form.Item name="publish_date" label="Publish date">
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
