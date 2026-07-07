import { useEffect, useState } from "react";
import {
  AutoComplete,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  TimePicker,
  message,
} from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import automationsClient from "@/lib/clients/automations";
import type {
  Automation,
  AutomationFrequency,
  ConnectionInfo,
  CreateAutomationPayload,
  UpdateAutomationPayload,
} from "@/lib/clients/automations";
import { DAY_NAMES, utcTimeToLocal } from "./utils";

dayjs.extend(utc);

interface FormValues {
  name: string;
  skill: string;
  instructions?: string;
  connection_name?: string;
  repo_name?: string;
  frequency: AutomationFrequency;
  day_of_week?: number;
  day_of_month?: number;
  days_of_week?: number[];
  time_of_day?: dayjs.Dayjs;
}

export function AutomationFormModal({
  open,
  onClose,
  onSaved,
  automation,
  duplicateFrom,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** When set, the modal edits this automation instead of creating a new one. */
  automation?: Automation | null;
  /** When set (and `automation` isn't), pre-fills a new automation's fields from this one. */
  duplicateFrom?: Automation | null;
}) {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [skillOptions, setSkillOptions] = useState<{ value: string }[]>([]);
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const frequency = Form.useWatch("frequency", form);
  const connectionName = Form.useWatch("connection_name", form);
  const isEdit = !!automation;
  const prefillFrom = automation ?? duplicateFrom;

  const selectedConnection = connections.find((c) => c.name === connectionName);
  const repoOptions = (selectedConnection?.repos ?? []).map((r) => ({
    label: r.name,
    value: r.name,
  }));

  useEffect(() => {
    if (!open) return;
    automationsClient
      .listSkills()
      .then((skills) => setSkillOptions(skills.map((s) => ({ value: s }))))
      .catch(() => setSkillOptions([]));
    automationsClient
      .listConnections()
      .then(setConnections)
      .catch(() => setConnections([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (prefillFrom) {
      form.setFieldsValue({
        name: prefillFrom.name,
        skill: prefillFrom.skill,
        instructions: prefillFrom.instructions ?? undefined,
        connection_name: prefillFrom.connection_name ?? undefined,
        repo_name: prefillFrom.repo_name ?? undefined,
        frequency: prefillFrom.frequency,
        day_of_week: prefillFrom.day_of_week ?? undefined,
        day_of_month: prefillFrom.day_of_month ?? undefined,
        days_of_week: prefillFrom.days_of_week ?? undefined,
        time_of_day: utcTimeToLocal(prefillFrom.time_of_day),
      });
    } else {
      form.resetFields();
    }
  }, [open, prefillFrom, form]);

  // Changing the org invalidates whatever repo was picked for the previous one.
  const handleConnectionChange = () => {
    form.setFieldValue("repo_name", undefined);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const shared = {
        name: values.name,
        skill: values.skill,
        instructions: values.instructions || undefined,
        frequency: values.frequency,
        connection_name: values.connection_name || undefined,
        repo_name: values.repo_name || undefined,
        day_of_week: values.day_of_week,
        day_of_month: values.day_of_month,
        days_of_week: values.days_of_week,
        time_of_day: values.time_of_day
          ? values.time_of_day.utc().format("HH:mm:ss")
          : undefined,
      };
      if (isEdit && automation) {
        await automationsClient.updateAutomation(
          automation.id,
          shared as UpdateAutomationPayload
        );
        message.success("Automation updated");
      } else {
        await automationsClient.createAutomation(shared as CreateAutomationPayload);
        message.success("Automation created");
        form.resetFields();
      }
      onSaved();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to save automation"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Automation" : duplicateFrom ? "Duplicate Automation" : "New Automation"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={saving}
      okText={isEdit ? "Save" : "Create"}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input placeholder="Daily status update" />
        </Form.Item>

        <Form.Item
          name="skill"
          label="Skill"
          rules={[{ required: true }]}
          extra="The Claude Code skill to run, e.g. /daily-status. Pick from your skills or type a project-specific one."
        >
          <AutoComplete
            options={skillOptions}
            filterOption={(input, option) =>
              (option?.value ?? "").toLowerCase().includes(input.toLowerCase())
            }
            placeholder="/daily-status"
          />
        </Form.Item>

        <Form.Item
          name="instructions"
          label="Instructions (optional)"
          extra="Extra context passed to Claude alongside the skill, e.g. specifics for this run"
        >
          <Input.TextArea
            rows={4}
            placeholder="e.g. Focus on the API repo, skip the frontend. Post the summary to #eng-status."
          />
        </Form.Item>

        <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Daily", value: "daily" },
              { label: "Weekdays (Mon–Fri)", value: "weekdays" },
              { label: "Every other weekday", value: "every_other_weekday" },
              { label: "Weekly", value: "weekly" },
              { label: "Custom days of week", value: "custom_days" },
              { label: "Monthly", value: "monthly" },
            ]}
          />
        </Form.Item>

        {frequency === "weekly" && (
          <Form.Item
            name="day_of_week"
            label="Day of Week"
            rules={[{ required: true }]}
          >
            <Select
              options={DAY_NAMES.map((d, i) => ({ label: d, value: i }))}
            />
          </Form.Item>
        )}

        {frequency === "custom_days" && (
          <Form.Item
            name="days_of_week"
            label="Days of Week"
            rules={[{ required: true, message: "Pick at least one day" }]}
          >
            <Checkbox.Group
              options={DAY_NAMES.map((d, i) => ({ label: d, value: i }))}
            />
          </Form.Item>
        )}

        {frequency === "monthly" && (
          <Form.Item
            name="day_of_month"
            label="Day of Month"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={31} style={{ width: "100%" }} />
          </Form.Item>
        )}

        <Form.Item name="time_of_day" label="Time">
          <TimePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="connection_name"
          label="Organization (optional)"
          extra="Which org's repo(s) and env this runs against. Leave blank to run against the runner's default checkout."
        >
          <Select
            allowClear
            placeholder="Select an organization"
            options={connections.map((c) => ({ label: c.name, value: c.name }))}
            onChange={handleConnectionChange}
          />
        </Form.Item>

        {connectionName && repoOptions.length > 0 && (
          <Form.Item
            name="repo_name"
            label="Repository (optional)"
            extra="Leave blank to use the organization's default repo."
          >
            <Select allowClear placeholder="Select a repository" options={repoOptions} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
