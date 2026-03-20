import { Tabs } from "antd";
import { UserOutlined, SettingOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/molecules/PageHeader";
import { DataCard } from "@/components/molecules/DataCard";
import { ProfileTab } from "./components/ProfileTab";
import { PreferencesTab } from "./components/PreferencesTab";

export function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your profile and platform preferences"
      />

      <DataCard>
        <Tabs
          defaultActiveKey="profile"
          items={[
            {
              key: "profile",
              label: (
                <span className="flex items-center gap-2">
                  <UserOutlined />
                  Profile
                </span>
              ),
              children: <ProfileTab />,
            },
            {
              key: "preferences",
              label: (
                <span className="flex items-center gap-2">
                  <SettingOutlined />
                  Preferences
                </span>
              ),
              children: <PreferencesTab />,
            },
          ]}
        />
      </DataCard>
    </div>
  );
}
