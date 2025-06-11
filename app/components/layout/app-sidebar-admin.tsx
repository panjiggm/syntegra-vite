import * as React from "react";
import {
  BarChart3,
  Users,
  Brain,
  Settings,
  FileText,
  Clock,
} from "lucide-react";

import { NavMain } from "./nav-main";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import { NavUserAdmin } from "./nav-user-admin";

// Data untuk sistem psikotes
const data = {
  company: {
    name: "Syntegra Services",
    subTitle: "Sistem Psikotes Digital",
    logo: "/images/syntegra-clear-logo.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Manajemen Peserta",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Modul Psikotes",
      url: "/admin/tests",
      icon: Brain,
    },
    {
      title: "Jadwal & Sesi",
      url: "/admin/sessions",
      icon: Clock,
    },
    {
      title: "Laporan & Hasil",
      url: "/admin/reports",
      icon: FileText,
    },
    {
      title: "Pengaturan Sistem",
      url: "/admin/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebarAdmin({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher company={data.company} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUserAdmin />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
