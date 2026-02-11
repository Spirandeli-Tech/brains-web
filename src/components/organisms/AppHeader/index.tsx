import { Dropdown, Avatar, Input } from "antd";
import {
  SearchOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/auth";

export function AppHeader() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");

  const dropdownItems = {
    items: [
      {
        key: "signout",
        label: "Sign out",
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleSignOut,
      },
    ],
  };

  return (
    <header className="h-[var(--header-height)] bg-white border-b border-border-subtle fixed top-0 left-[var(--sidebar-width)] right-0 z-20 flex items-center justify-between px-6">
      <div className="flex-1 max-w-md">
        <Input
          placeholder="Search..."
          prefix={<SearchOutlined className="text-text-disabled" />}
        />
      </div>

      <Dropdown
        menu={dropdownItems}
        trigger={["click"]}
        placement="bottomRight"
      >
        <button className="flex items-center gap-3 cursor-pointer border-none bg-transparent p-1.5 rounded-[10px] hover:bg-bg-hover transition-colors">
          <Avatar
            size={34}
            className="bg-brand-primary text-white font-semibold"
            icon={!initials ? <UserOutlined /> : undefined}
          >
            {initials || undefined}
          </Avatar>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-text-primary leading-tight m-0">
              {user?.displayName || "User"}
            </p>
            <p className="text-xs text-text-muted leading-tight m-0">
              {user?.email || ""}
            </p>
          </div>
        </button>
      </Dropdown>
    </header>
  );
}
