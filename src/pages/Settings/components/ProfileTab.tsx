import { useEffect, useState } from "react";
import { Avatar, Button, Form, Input, Upload, message } from "antd";
import { CameraOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/auth";
import { usersClient } from "@/lib/clients/users";
import { uploadFile } from "@/lib/firebase-storage";
import { ImageCropModal } from "@/components";

export function ProfileTab() {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
      setPhotoURL(user.photoURL);
    }
  }, [user, form]);

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
      const path = `profile-pictures/${user.id}/${Date.now()}-cropped.jpg`;
      const url = await uploadFile(croppedFile, path);
      setPhotoURL(url);
      await usersClient.updateMe({ photo_url: url });
      message.success("Photo updated");
    } catch {
      message.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await usersClient.updateMe({
        first_name: values.firstName,
        last_name: values.lastName,
        photo_url: photoURL,
      });
      message.success("Profile updated");
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 min-w-[220px]">
        <Upload
          showUploadList={false}
          accept="image/jpeg,image/jpg,image/png,image/gif"
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
          <div className="relative cursor-pointer group">
            <Avatar
              size={120}
              src={photoURL}
              icon={!initials && !photoURL ? <UserOutlined /> : undefined}
              className="bg-brand-primary text-white text-3xl font-semibold"
            >
              {!photoURL ? initials : undefined}
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <CameraOutlined className="text-white text-xl" />
            </div>
          </div>
        </Upload>
        <p className="text-xs text-text-muted text-center m-0">
          Allowed *.jpeg, *.jpg, *.png, *.gif
          <br />
          Max size of 3 MB
        </p>
        {uploading && (
          <p className="text-xs text-brand-primary m-0">Uploading...</p>
        )}
      </div>

      {/* Form Section */}
      <div className="flex-1">
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: "First name is required" }]}
            >
              <Input placeholder="First name" />
            </Form.Item>

            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: "Last name is required" }]}
            >
              <Input placeholder="Last name" />
            </Form.Item>

            <Form.Item name="email" label="Email Address">
              <Input disabled />
            </Form.Item>
          </div>

          <div className="flex justify-end mt-4">
            <Button type="primary" onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        </Form>
      </div>

      {cropImageSrc && (
        <ImageCropModal
          open
          imageSrc={cropImageSrc}
          cropShape="round"
          aspect={1}
          title="Crop Profile Photo"
          onCancel={() => setCropImageSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
