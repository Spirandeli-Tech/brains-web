import { useEffect, useState } from "react";
import {
  Button,
  ColorPicker,
  Form,
  Select,
  Upload,
  message,
  Image,
} from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/auth";
import { usersClient } from "@/lib/clients/users";
import { uploadFile } from "@/lib/firebase-storage";
import { ImageCropModal } from "@/components";
import type { UserPreferencesData } from "@/lib/clients/users/types";

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "BRL", label: "BRL - Brazilian Real" },
  { value: "EUR", label: "EUR - Euro" },
];

export function PreferencesTab() {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preferences, setPreferences] =
    useState<UserPreferencesData | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await usersClient.getPreferences();
      setPreferences(prefs);
      form.setFieldsValue({
        reportThemeColor: prefs.report_theme_color || "#1677ff",
        defaultCurrency: prefs.default_currency || "USD",
      });
      setHeaderImageUrl(prefs.report_header_image_url);
    } catch {
      message.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedFile: File) => {
    setCropImageSrc(null);
    if (!user) return;

    setUploading(true);
    try {
      const path = `report-headers/${user.id}/${Date.now()}-cropped.jpg`;
      const url = await uploadFile(croppedFile, path);
      setHeaderImageUrl(url);
      message.success("Header image uploaded");
    } catch {
      message.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveHeaderImage = () => {
    setHeaderImageUrl(null);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const color =
        typeof values.reportThemeColor === "string"
          ? values.reportThemeColor
          : values.reportThemeColor?.toHexString?.() || "#1677ff";

      await usersClient.updatePreferences({
        report_theme_color: color,
        report_header_image_url: headerImageUrl,
        default_currency: values.defaultCurrency,
      });
      message.success("Preferences updated");
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-text-muted">Loading...</div>;
  }

  return (
    <Form form={form} layout="vertical" className="max-w-[600px]">
      <h3 className="text-base font-semibold text-text-primary mb-4 mt-0">
        Print Report
      </h3>

      <Form.Item name="reportThemeColor" label="Theme Color">
        <ColorPicker format="hex" showText />
      </Form.Item>

      <Form.Item label="Header Image">
        <div className="flex flex-col gap-3">
          {headerImageUrl && (
            <div className="relative inline-block">
              <Image
                src={headerImageUrl}
                alt="Report header"
                width={200}
                className="rounded-lg border border-border-subtle"
              />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={handleRemoveHeaderImage}
                className="absolute top-1 right-1"
              />
            </div>
          )}
          <Upload
            showUploadList={false}
            accept="image/jpeg,image/jpg,image/png"
            beforeUpload={(file) => {
              const isLt3M = file.size / 1024 / 1024 < 3;
              if (!isLt3M) {
                message.error("Image must be smaller than 3MB");
                return Upload.LIST_IGNORE;
              }
              handleFileSelected(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              {headerImageUrl ? "Replace Image" : "Upload Image"}
            </Button>
          </Upload>
        </div>
      </Form.Item>

      <div className="border-t border-border-subtle my-6" />

      <h3 className="text-base font-semibold text-text-primary mb-4 mt-0">
        Finance
      </h3>

      <Form.Item name="defaultCurrency" label="Default Currency">
        <Select options={CURRENCY_OPTIONS} />
      </Form.Item>

      <div className="flex justify-end mt-6">
        <Button type="primary" onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>

      {cropImageSrc && (
        <ImageCropModal
          open
          imageSrc={cropImageSrc}
          cropShape="rect"
          aspect={16 / 5}
          title="Crop Header Image"
          onCancel={() => setCropImageSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </Form>
  );
}
